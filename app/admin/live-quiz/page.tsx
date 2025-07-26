"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/app/firebase/config";
import { FaClipboardList, FaBeer } from "react-icons/fa";
import ManageQuizzes from "@/components/admin/ManageQuizzes";
import ManagePubs from "@/components/admin/ManagePubs";

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

export default function LiveQuizAdminPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selected, setSelected] = useState<"quizzes" | "pubs">("quizzes");

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace("/sign-in");
      else if (user.uid !== ADMIN_UID) router.replace("/");
      else setIsAdmin(true);
      setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  if (!authChecked || !isAdmin) {
    return (
      <div className="text-center text-lg mt-12">
        Loading Live Quiz Admin...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-purple-700 mb-8 text-center">
        Live Quiz Admin
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Manage Quizzes Card */}
        <button
          className={`flex flex-col items-center p-8 rounded-2xl shadow-lg transition cursor-pointer
            ${
              selected === "quizzes"
                ? "bg-purple-700 text-white"
                : "bg-white text-purple-700 hover:bg-purple-50"
            }`}
          onClick={() => setSelected("quizzes")}
        >
          <FaClipboardList className="text-4xl mb-3" />
          <div className="text-lg font-bold mb-1">Manage Quizzes</div>
          <div className="text-sm opacity-80">
            Create, edit, and control live quizzes
          </div>
        </button>
        {/* Manage Pubs Card */}
        <button
          className={`flex flex-col items-center p-8 rounded-2xl shadow-lg transition cursor-pointer
            ${
              selected === "pubs"
                ? "bg-purple-700 text-white"
                : "bg-white text-purple-700 hover:bg-purple-50"
            }`}
          onClick={() => setSelected("pubs")}
        >
          <FaBeer className="text-4xl mb-3" />
          <div className="text-lg font-bold mb-1">Manage Pubs</div>
          <div className="text-sm opacity-80">
            Add or manage virtual pubs (quiz rooms)
          </div>
        </button>
      </div>

      {/* Render selected management panel */}
      <div className="mt-8">
        {selected === "quizzes" ? <ManageQuizzes /> : <ManagePubs />}
      </div>
    </div>
  );
}

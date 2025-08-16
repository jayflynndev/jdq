"use client";
import { useState } from "react";
import { FaClipboardList, FaBeer } from "react-icons/fa";
import ManageQuizzes from "@/components/admin/ManageQuizzes";
import ManagePubs from "@/components/admin/ManagePubs";

export default function LiveQuizAdminPage() {
  const [selected, setSelected] = useState<"quizzes" | "pubs">("quizzes");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-purple-700 mb-8 text-center">
        Live Quiz Admin
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <button
          className={`flex flex-col items-center p-8 rounded-2xl shadow-lg transition cursor-pointer
            ${
              selected === "quizzes"
                ? "bg-purple-700 text-white"
                : "bg-white text-purple-700 hover:bg-purple-50"
            }
            `}
          onClick={() => setSelected("quizzes")}
        >
          <FaClipboardList className="text-4xl mb-3" />
          <div className="text-lg font-bold mb-1">Manage Quizzes</div>
          <div className="text-sm opacity-80">
            Create, edit, and control live quizzes
          </div>
        </button>
        <button
          className={`flex flex-col items-center p-8 rounded-2xl shadow-lg transition cursor-pointer
            ${
              selected === "pubs"
                ? "bg-purple-700 text-white"
                : "bg-white text-purple-700 hover:bg-purple-50"
            }
            `}
          onClick={() => setSelected("pubs")}
        >
          <FaBeer className="text-4xl mb-3" />
          <div className="text-lg font-bold mb-1">Manage Pubs</div>
          <div className="text-sm opacity-80">
            Add or manage virtual pubs (quiz rooms)
          </div>
        </button>
      </div>
      <div className="mt-8">
        {selected === "quizzes" ? <ManageQuizzes /> : <ManagePubs />}
      </div>
    </div>
  );
}

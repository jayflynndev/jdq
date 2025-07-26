"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/app/firebase/config";
import {
  FaListOl,
  FaUsers,
  FaEnvelopeOpenText,
  FaChartBar,
} from "react-icons/fa";

// Your admin UID:
const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

export default function AdminDashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin Auth Check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/sign-in");
      } else if (user.uid !== ADMIN_UID) {
        router.replace("/");
      } else {
        setIsAdmin(true);
      }
      setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  if (!authChecked || !isAdmin) {
    return (
      <div className="text-center text-lg mt-12">
        Loading admin dashboard...
      </div>
    );
  }

  // --- Dashboard cards config
  const cards = [
    {
      href: "/admin/jvq",
      icon: <FaListOl className="text-yellow-400 text-5xl mb-4" />,
      title: "JVQ Admin",
      desc: "Manage Jay's Virtual Quiz (leaderboards, recaps, edit scores).",
    },
    {
      href: "/admin/live-quiz",
      icon: <FaUsers className="text-purple-600 text-5xl mb-4" />,
      title: "Live Quiz Admin",
      desc: "Run live quizzes, create & control rooms, and manage quizzes.",
    },
    {
      href: "/admin/messages",
      icon: <FaEnvelopeOpenText className="text-green-500 text-5xl mb-4" />,
      title: "Messages",
      desc: "View and reply to user messages and contact form submissions.",
    },
  ];

  return (
    <div className="px-6 py-12 max-w-6xl mx-auto">
      <h1 className="text-4xl font-black text-yellow-400 mb-10 text-center">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <div className="cursor-pointer bg-white hover:bg-purple-50 shadow-xl rounded-2xl p-8 flex flex-col items-center transition group">
              {card.icon}
              <div className="text-xl font-bold text-purple-900 mb-2 group-hover:underline">
                {card.title}
              </div>
              <div className="text-gray-500 text-center">{card.desc}</div>
            </div>
          </Link>
        ))}
      </div>
      <div className="rounded-2xl bg-white/80 border-dashed border-2 border-purple-200 p-12 text-center shadow-inner">
        <FaChartBar className="text-4xl mx-auto text-purple-400 mb-3" />
        <div className="text-2xl font-semibold text-purple-600 mb-2">
          Stats & Analytics coming soon…
        </div>
        <div className="text-gray-400">
          Here you’ll find quiz stats, player counts, and more insights!
        </div>
      </div>
    </div>
  );
}

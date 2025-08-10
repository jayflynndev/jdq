"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";
import Link from "next/link";

interface Quiz {
  id: string;
  quiz_day: string;
  quiz_date: string;
  youtubeUrl: string;
  // ...add other fields as needed (like 'parts' if you use them)
}

export default function JVQAdmin() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabase Admin check
  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/sign-in");
        return;
      }
      // Query profile for is_admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        router.replace("/");
      } else {
        setIsAdmin(true);
      }
      setAuthChecked(true);
    };
    checkAdmin();
  }, [router]);

  // Fetch Quizzes
  useEffect(() => {
    if (!authChecked || !isAdmin) return;
    const fetchQuizzes = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("quizzes")
        .select("*")
        .order("quiz_date", { ascending: false });
      setQuizzes(data || []);
      setLoading(false);
    };
    fetchQuizzes();
  }, [authChecked, isAdmin]);

  // Delete quiz
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz and all its data?"))
      return;
    // Optionally: delete associated media from storage (if you use it in Supabase Storage)
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (!error) setQuizzes((prev) => prev.filter((q) => q.id !== id));
    else alert("An error occurred while deleting the quiz.");
  };

  if (!authChecked || !isAdmin) {
    return (
      <div className="text-center text-lg mt-12">Loading JVQ admin...</div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-yellow-400 mb-8">JVQ Admin</h2>
      <Link href="/admin/addquiz">
        <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-500 mb-8">
          + Add Quiz
        </button>
      </Link>
      {loading ? (
        <div className="text-white">Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-gray-300">No quizzes found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-purple-700 text-white p-6 rounded-xl shadow-lg"
            >
              <div className="text-xl font-semibold mb-1">{quiz.quiz_day}</div>
              <div className="text-sm text-gray-300 mb-4">{quiz.quiz_date}</div>
              <div className="flex justify-between">
                <button
                  onClick={() => alert("Edit feature coming soon")}
                  className="bg-yellow-400 text-black px-4 py-1 rounded hover:bg-yellow-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaPlus } from "react-icons/fa";
import CreateQuizForm from "./CreateQuizForm";
import Link from "next/link";

type Quiz = {
  id: string;
  title: string;
  start_time: string | null;
  status: string;
  livestream_url: string;
};

export default function ManageQuizzes() {
  const [showForm, setShowForm] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch all quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("livequizzes")
        .select("*")
        .order("start_time", { ascending: false });
      setQuizzes(data || []);
      setLoading(false);
    };
    fetchQuizzes();
  }, [refreshKey]);

  return (
    <div className="bg-white rounded-xl p-8 shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-purple-700">
          Manage Quizzes
        </h3>
        <button
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition"
          onClick={() => setShowForm(true)}
        >
          <FaPlus className="mr-2" /> Create Quiz
        </button>
      </div>
      {showForm && (
        <CreateQuizForm
          onCreated={() => {
            setShowForm(false);
            setRefreshKey((k) => k + 1);
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading quizzes…</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center text-gray-400 py-10">No quizzes found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="border rounded-xl p-4 shadow flex flex-col md:flex-row md:items-center md:justify-between mb-2"
            >
              <div>
                <div className="font-bold text-lg text-purple-900">
                  {quiz.title}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  {quiz.start_time
                    ? new Date(quiz.start_time).toLocaleString()
                    : ""}
                </div>
                <div className="text-xs text-gray-400">
                  Status: {quiz.status}
                </div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <Link href={`/admin/live-quiz/${quiz.id}`}>
                  <button className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-700 text-sm font-bold">
                    Open Dashboard
                  </button>
                </Link>
                {/* You can add edit/delete if needed */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

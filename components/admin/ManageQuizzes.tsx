"use client";
import { useEffect, useState } from "react";
import { db } from "@/app/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { FaPlus } from "react-icons/fa";
import Link from "next/link";
import CreateQuizForm from "./CreateQuizForm";

interface LiveQuiz {
  id: string;
  title: string;
  startTime: string;
  status: string;
  livestreamUrl: string;
}

export default function ManageQuizzes() {
  const [showForm, setShowForm] = useState(false);
  const [quizzes, setQuizzes] = useState<LiveQuiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "liveQuizzes"));
        let fetched = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LiveQuiz[];
        // If database is empty, use dummy quiz
        if (fetched.length === 0) {
          fetched = [
            {
              id: "dummy1",
              title: "Sample Pub Quiz Night",
              startTime: new Date().toISOString(),
              status: "waiting",
              livestreamUrl: "https://youtube.com/watch?v=xxxxxxx",
            },
          ];
        }
        setQuizzes(fetched);
      } finally {
        setLoading(false);
      }
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
            setRefreshKey((k) => k + 1); // trigger quiz list reload
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
                  {quiz.startTime
                    ? new Date(quiz.startTime).toLocaleString()
                    : ""}
                </div>
                <div className="text-xs text-gray-400">
                  Status: {quiz.status}
                </div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                {/* Add edit/delete/control buttons here if you want */}
                <Link href={`/admin/live-quiz/${quiz.id}`}>
                  <button className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-700 text-sm font-bold">
                    Open Dashboard
                  </button>
                </Link>
                <button
                  className="px-3 py-1 rounded bg-purple-200 text-purple-800 text-sm hover:bg-purple-300"
                  disabled
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 rounded bg-red-100 text-red-700 text-sm hover:bg-red-200"
                  disabled
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

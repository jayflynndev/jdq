"use client";

import { useEffect, useState } from "react";
import { deleteObject, ref as storageRef } from "firebase/storage";
import { db, storage } from "@/app/firebase/config"; // adjust path if needed
import {
  collection,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Link from "next/link";

interface Quiz {
  id: string;
  quizDay: string;
  quizDate: string;
  youtubeUrl: string;
}

export default function AdminDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const snapshot = await getDocs(collection(db, "quizzes"));
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Quiz[];
        setQuizzes(fetched);
      } catch (err) {
        console.error("Error loading quizzes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz and all its data?"))
      return;

    try {
      const quizDoc = await getDoc(doc(db, "quizzes", id));
      if (!quizDoc.exists()) throw new Error("Quiz not found");

      const quizData = quizDoc.data();

      // Delete associated images
      const allImages = [
        ...(quizData?.parts?.part1?.images || []),
        ...(quizData?.parts?.part2?.images || []),
      ];

      await Promise.all(
        allImages.map(async (img: { url: string }) => {
          try {
            // Extract storage path from URL
            const fullUrl = new URL(img.url);
            const path = decodeURIComponent(
              fullUrl.pathname.split("/o/")[1].split("?")[0]
            );
            const fileRef = storageRef(storage, path);
            await deleteObject(fileRef);
          } catch (err) {
            console.warn("Image delete failed:", err);
          }
        })
      );

      // Delete quiz document
      await deleteDoc(doc(db, "quizzes", id));

      // Update UI
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error("Failed to delete quiz:", err);
      alert("An error occurred while deleting the quiz.");
    }
  };

  return (
    <div className="px-12 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-400">Admin Dashboard</h1>
        <Link href="/admin/addquiz">
          <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-500">
            + Add Quiz
          </button>
        </Link>
      </div>

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
              <div className="text-xl font-semibold mb-1">{quiz.quizDay}</div>
              <div className="text-sm text-gray-300 mb-4">{quiz.quizDate}</div>
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

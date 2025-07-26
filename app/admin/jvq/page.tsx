"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { deleteObject, ref as storageRef } from "firebase/storage";
import { db, storage, auth } from "@/app/firebase/config";
import {
  collection,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Link from "next/link";

const ADMIN_UID = "VT9wP6OIAhfxLiD13k2XqnUkIC62";

interface Quiz {
  id: string;
  quizDay: string;
  quizDate: string;
  youtubeUrl: string;
}

export default function JVQAdmin() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!authChecked || !isAdmin) return;
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
  }, [authChecked, isAdmin]);

  if (!authChecked || !isAdmin) {
    return (
      <div className="text-center text-lg mt-12">Loading JVQ admin...</div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz and all its data?"))
      return;

    try {
      const quizDoc = await getDoc(doc(db, "quizzes", id));
      if (!quizDoc.exists()) throw new Error("Quiz not found");
      const quizData = quizDoc.data();

      // Delete associated images if needed
      const allImages = [
        ...(quizData?.parts?.part1?.images || []),
        ...(quizData?.parts?.part2?.images || []),
      ];
      await Promise.all(
        allImages.map(async (img: { url: string }) => {
          try {
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
      await deleteDoc(doc(db, "quizzes", id));
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error("Failed to delete quiz:", err);
      alert("An error occurred while deleting the quiz.");
    }
  };

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

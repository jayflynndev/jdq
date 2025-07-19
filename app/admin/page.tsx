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
  updateDoc,
} from "firebase/firestore";
import Link from "next/link";

// Your actual admin UID here:
const ADMIN_UID = "VT9wP6OIAhfxLiD13k2XqnUkIC62";

interface Quiz {
  id: string;
  quizDay: string;
  quizDate: string;
  youtubeUrl: string;
}

interface ContactMessage {
  id: string;
  uid: string;
  username: string;
  email: string;
  message: string;
  created?: { seconds: number; nanoseconds: number } | Date | string;
  adminReply?: string;
  replyTimestamp?: { seconds: number; nanoseconds: number } | Date | string;
}

export default function AdminDashboard() {
  const router = useRouter();

  // 🟢 All hooks at the top!
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [reply, setReply] = useState<{ [id: string]: string }>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

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

  // Only fetch data if confirmed admin!
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
    const fetchMessages = async () => {
      try {
        const snapshot = await getDocs(collection(db, "contactMessages"));
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ContactMessage[];
        setContactMessages(fetched);
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchQuizzes();
    fetchMessages();
  }, [authChecked, isAdmin]);

  // 🚦 Show loading until admin is confirmed
  if (!authChecked || !isAdmin) {
    return (
      <div className="text-center text-lg mt-12">
        Loading admin dashboard...
      </div>
    );
  }

  // The rest of your dashboard:
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

  const handleReplyChange = (id: string, value: string) => {
    setReply((prev) => ({ ...prev, [id]: value }));
  };

  const handleSendReply = async (msg: ContactMessage) => {
    if (!reply[msg.id]?.trim()) return;
    setSendingReply(msg.id);
    try {
      await updateDoc(doc(db, "contactMessages", msg.id), {
        adminReply: reply[msg.id],
        replyTimestamp: new Date(),
      });
      setContactMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? { ...m, adminReply: reply[msg.id], replyTimestamp: new Date() }
            : m
        )
      );
      setReply((prev) => ({ ...prev, [msg.id]: "" }));
    } catch {
      alert("Failed to send reply.");
    } finally {
      setSendingReply(null);
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
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">
          Contact Messages
        </h2>
        {loadingMessages ? (
          <div className="text-white">Loading messages...</div>
        ) : contactMessages.length === 0 ? (
          <div className="text-gray-300">No contact messages found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactMessages.map((msg) => (
              <div
                key={msg.id}
                className="bg-white/90 text-purple-900 p-6 rounded-xl shadow-lg"
              >
                <div className="font-bold">
                  {msg.username}{" "}
                  <span className="text-sm text-gray-500">({msg.email})</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {msg.created &&
                    (typeof msg.created === "object" && "seconds" in msg.created
                      ? new Date(
                          (msg.created as { seconds: number }).seconds * 1000
                        ).toLocaleString()
                      : typeof msg.created === "string"
                      ? new Date(msg.created).toLocaleString()
                      : msg.created instanceof Date
                      ? msg.created.toLocaleString()
                      : "")}
                </div>
                <div className="mb-4">{msg.message}</div>
                {msg.adminReply ? (
                  <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-400 rounded">
                    <div className="font-semibold text-yellow-700">
                      Your Reply:
                    </div>
                    <div>{msg.adminReply}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      {msg.replyTimestamp &&
                        (typeof msg.replyTimestamp === "object" &&
                        "seconds" in msg.replyTimestamp
                          ? new Date(
                              (msg.replyTimestamp as { seconds: number })
                                .seconds * 1000
                            ).toLocaleString()
                          : typeof msg.replyTimestamp === "string"
                          ? new Date(msg.replyTimestamp).toLocaleString()
                          : msg.replyTimestamp instanceof Date
                          ? msg.replyTimestamp.toLocaleString()
                          : "")}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <textarea
                      rows={2}
                      className="w-full border rounded p-2 mb-2"
                      placeholder="Write your reply…"
                      value={reply[msg.id] || ""}
                      onChange={(e) =>
                        handleReplyChange(msg.id, e.target.value)
                      }
                    />
                    <button
                      onClick={() => handleSendReply(msg)}
                      className="bg-yellow-400 text-black px-4 py-1 rounded hover:bg-yellow-300 font-semibold"
                      disabled={
                        sendingReply === msg.id || !(reply[msg.id] || "").trim()
                      }
                    >
                      {sendingReply === msg.id ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

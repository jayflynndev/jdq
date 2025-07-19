import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "@/app/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

interface ContactReply {
  id: string;
  message: string;
  adminReply: string;
  created?: import("firebase/firestore").Timestamp;
  replyTimestamp?: import("firebase/firestore").Timestamp;
  userRead?: boolean;
}

export function ContactReplies() {
  const [replies, setReplies] = useState<ContactReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Load the user's replies
  useEffect(() => {
    const fetchReplies = async (uid: string) => {
      const q = query(
        collection(db, "contactMessages"),
        where("uid", "==", uid),
        where("adminReply", "!=", null)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ContactReply[];
      setReplies(items);
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchReplies(user.uid);
      else setLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Handle deleting a message
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "contactMessages", id));
      setReplies((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Failed to delete message. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-500 my-8">Loading messages…</div>
    );
  }
  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-purple-700 mb-4 text-center">
        Replies from Jay’s Quiz Hub
      </h2>
      <div className="space-y-4">
        {replies.map((r) => (
          <div key={r.id} className="bg-yellow-100 rounded-lg shadow p-4">
            <div className="mb-2">
              <span className="font-semibold text-purple-800">You asked:</span>
              <div className="ml-2 text-gray-700">{r.message}</div>
              <div className="text-xs text-gray-500 mt-1">
                Sent:{" "}
                {r.created?.seconds
                  ? new Date(r.created.seconds * 1000).toLocaleString()
                  : ""}
              </div>
            </div>
            <div className="mt-2 border-t pt-2">
              <span className="font-semibold text-purple-900">Reply:</span>
              <div className="ml-2 text-purple-900">{r.adminReply}</div>
              <div className="text-xs text-gray-500 mt-1">
                {r.replyTimestamp?.seconds
                  ? "Replied: " +
                    new Date(r.replyTimestamp.seconds * 1000).toLocaleString()
                  : ""}
              </div>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => handleDelete(r.id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                disabled={deleting === r.id}
              >
                {deleting === r.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

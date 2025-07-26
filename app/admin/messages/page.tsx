"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { db, auth } from "@/app/firebase/config";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

const ADMIN_UID = "VT9wP6OIAhfxLiD13k2XqnUkIC62";

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

export default function MessagesAdmin() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [reply, setReply] = useState<{ [id: string]: string }>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

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
    fetchMessages();
  }, [authChecked, isAdmin]);

  if (!authChecked || !isAdmin) {
    return (
      <div className="text-center text-lg mt-12">Loading messages admin...</div>
    );
  }

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
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-yellow-400 mb-8">
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
                    onChange={(e) => handleReplyChange(msg.id, e.target.value)}
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
  );
}

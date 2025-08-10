"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

interface ContactReply {
  id: string;
  message: string;
  admin_reply: string;
  created_at?: string;
  reply_timestamp?: string;
  user_read?: boolean;
}

export function ContactReplies() {
  const [replies, setReplies] = useState<ContactReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Load replies from Supabase
  useEffect(() => {
    const fetchReplies = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, message, admin_reply, created_at, reply_timestamp")
        .eq("uid", user.id)
        .not("admin_reply", "is", null)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setReplies(data as ContactReply[]);
      }
      setLoading(false);
    };
    fetchReplies();
  }, []);

  // Handle deleting a message
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;
    setDeleting(id);
    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);
      if (!error) setReplies((prev) => prev.filter((r) => r.id !== id));
      else alert("Failed to delete message. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-500 my-8">Loading messages…</div>
    );
  }
  if (replies.length === 0) return null;

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
                {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
              </div>
            </div>
            <div className="mt-2 border-t pt-2">
              <span className="font-semibold text-purple-900">Reply:</span>
              <div className="ml-2 text-purple-900">{r.admin_reply}</div>
              <div className="text-xs text-gray-500 mt-1">
                {r.reply_timestamp
                  ? "Replied: " + new Date(r.reply_timestamp).toLocaleString()
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

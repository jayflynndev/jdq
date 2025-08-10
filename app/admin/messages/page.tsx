"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import toast from "react-hot-toast";

interface Thread {
  id: string;
  subject: string;
  user_id: string; // UUID of user who started the thread
  created_at: string;
}
interface Message {
  id: string;
  sender: string;
  sender_id: string;
  message: string;
  created_at: string;
  profiles?: {
    username?: string;
  };
}

export default function AdminContactThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [reply, setReply] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // User state for admin
  const [user, setUser] = useState<any>(null);

  // Username cache for display
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  // Fetch all threads on mount
  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true);
      const { data: threadData } = await supabase
        .from("contact_threads")
        .select("*")
        .order("created_at", { ascending: false });
      setThreads(threadData ?? []);
      setLoading(false);

      // Auto-expand most recent
      if (threadData && threadData[0]) {
        setExpanded({ [threadData[0].id]: true });
      }

      // Get usernames for all threads
      if (threadData) {
        const userIds = Array.from(new Set(threadData.map((t) => t.user_id)));
        if (userIds.length > 0) {
          const { data: profileRows } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", userIds);
          if (profileRows) {
            const nameMap: Record<string, string> = {};
            for (const row of profileRows) {
              nameMap[row.id] = row.username || row.id.slice(0, 8);
            }
            setUsernames(nameMap);
            console.log("usernames mapping", nameMap);
          }
        }
      }
    };
    fetchThreads();
  }, []);

  // Load all messages for expanded threads
  useEffect(() => {
    const fetchMessages = async () => {
      const newMsgs: Record<string, Message[]> = { ...messages };
      for (const threadId of Object.keys(expanded).filter(
        (id) => expanded[id]
      )) {
        if (!messages[threadId]) {
          const { data } = await supabase
            .from("contact_messages")
            .select(
              `
    *,
    profiles:sender_id (
      username
    )
  `
            )
            .eq("thread_id", threadId)
            .order("created_at");

          newMsgs[threadId] = data ?? [];
        }
      }
      console.log("messages", messages);

      setMessages(newMsgs);
    };
    fetchMessages();
    // eslint-disable-next-line
  }, [expanded]);

  const handleToggle = (id: string) => {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  };

  const handleReply = async (threadId: string) => {
    const content = reply[threadId];
    if (!content?.trim()) return;
    const { error } = await supabase.from("contact_messages").insert([
      {
        thread_id: threadId,
        sender: "admin",
        sender_id: user?.id, // or your admin's real uuid
        message: content.trim(),
      },
    ]);
    if (error) {
      toast.error("Failed to send reply");
      return;
    }
    toast.success("Reply sent!");

    setReply((r) => ({ ...r, [threadId]: "" }));

    // Refresh this thread's messages
    const { data: newMsgs } = await supabase
      .from("contact_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at");
    setMessages((msgs) => ({ ...msgs, [threadId]: newMsgs ?? [] }));
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-3xl font-bold mb-4 text-purple-700 text-center">
        Admin: User Messages
      </h1>
      {threads.length === 0 && (
        <p className="text-center text-gray-500">No messages yet.</p>
      )}
      <div className="space-y-4">
        {threads.map((thread) => (
          <div key={thread.id} className="border rounded-lg shadow">
            {/* HEADER: Username | Subject | Date | Expand/collapse */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-purple-100 hover:bg-purple-200 rounded-t-lg focus:outline-none"
              onClick={() => handleToggle(thread.id)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="font-bold text-purple-800">
                  {usernames[thread.user_id] || thread.user_id.slice(0, 8)}
                </span>
                <span className="ml-2 font-semibold text-purple-700">
                  {thread.subject || "No subject"}
                </span>
                <span className="ml-4 text-gray-500 text-sm">
                  {new Date(thread.created_at).toLocaleString()}
                </span>
              </div>
              {expanded[thread.id] ? <FaChevronDown /> : <FaChevronRight />}
            </button>
            {expanded[thread.id] && (
              <div className="p-4 space-y-3 bg-purple-50 rounded-b-lg">
                <div className="space-y-2">
                  {messages[thread.id]?.length === 0 && (
                    <div className="text-gray-500">No messages yet.</div>
                  )}
                  {messages[thread.id]?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === "admin" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          msg.sender === "admin"
                            ? "bg-yellow-300 text-purple-900"
                            : "bg-white text-purple-900 border"
                        }`}
                      >
                        {/* SHOW username! */}
                        <div className="text-xs font-bold text-purple-700 mb-1">
                          {msg.sender === "admin"
                            ? "Admin"
                            : msg.profiles?.username ||
                              msg.sender_id.slice(0, 8)}
                        </div>
                        <div className="text-sm">{msg.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(msg.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Reply box */}
                <div className="mt-4 flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded border"
                    placeholder="Write a reply…"
                    value={reply[thread.id] || ""}
                    onChange={(e) =>
                      setReply((r) => ({ ...r, [thread.id]: e.target.value }))
                    }
                  />
                  <button
                    className="px-4 py-2 rounded bg-purple-700 text-white font-bold hover:bg-yellow-400 hover:text-purple-800"
                    onClick={() => handleReply(thread.id)}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

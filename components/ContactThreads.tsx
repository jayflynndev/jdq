"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

interface Thread {
  id: string;
  subject: string;
  created_at: string;
}
interface Message {
  id: string;
  sender: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export default function ContactThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // 1. Get user info and their threads
  useEffect(() => {
    const fetchThreads = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setLoading(false);
        return;
      }
      // Fetch threads for user
      const { data: threadsData } = await supabase
        .from("contact_threads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setThreads(threadsData || []);
      setLoading(false);

      // Fetch messages for each thread
      if (threadsData) {
        const msgs: Record<string, Message[]> = {};
        for (const thread of threadsData) {
          const { data: messagesData } = await supabase
            .from("contact_messages")
            .select("*")
            .eq("thread_id", thread.id)
            .order("created_at", { ascending: true });
          msgs[thread.id] = messagesData || [];
        }
        setMessages(msgs);

        // Expand most recent thread by default, collapse others
        if (threadsData.length) {
          const expand: Record<string, boolean> = {};
          threadsData.forEach((t, i) => (expand[t.id] = i === 0));
          setExpanded(expand);
        }
      }
    };
    fetchThreads();
  }, []);

  // 2. Send a reply in a thread
  const handleReply = async (threadId: string) => {
    if (!replyContent[threadId] || !replyContent[threadId].trim()) return;
    setSending((s) => ({ ...s, [threadId]: true }));
    const { error } = await supabase.from("contact_messages").insert({
      thread_id: threadId,
      sender: "user",
      sender_id: user.id,
      message: replyContent[threadId],
    });
    setSending((s) => ({ ...s, [threadId]: false }));
    if (!error) {
      // Reload messages for this thread
      const { data: messagesData } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      setMessages((m) => ({ ...m, [threadId]: messagesData || [] }));
      setReplyContent((r) => ({ ...r, [threadId]: "" }));
      setExpanded((e) => ({ ...e, [threadId]: true }));
    }
  };

  const toggleExpand = (threadId: string) => {
    setExpanded((e) => ({ ...e, [threadId]: !e[threadId] }));
  };

  if (loading) {
    return (
      <div className="text-center text-gray-500 my-8">Loading messages…</div>
    );
  }
  if (!user || threads.length === 0) {
    return null; // no threads to show
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-purple-700 mb-4 text-center">
        Replies from Jay’s Quiz Hub
      </h2>
      <div className="space-y-6">
        {threads.map((thread) => (
          <div key={thread.id} className="bg-yellow-100 rounded-lg shadow p-4">
            <button
              className="flex items-center w-full text-left focus:outline-none mb-2"
              onClick={() => toggleExpand(thread.id)}
              aria-expanded={expanded[thread.id]}
            >
              {expanded[thread.id] ? (
                <FaChevronDown className="text-purple-700 mr-2" />
              ) : (
                <FaChevronRight className="text-purple-700 mr-2" />
              )}
              <span className="font-semibold text-purple-800">
                {thread.subject}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                ({new Date(thread.created_at).toLocaleString()})
              </span>
            </button>
            {expanded[thread.id] && (
              <>
                <div className="mb-2">
                  {messages[thread.id]?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-3 pl-2 ${
                        msg.sender === "admin"
                          ? "border-l-4 border-purple-700"
                          : "border-l-4 border-yellow-400"
                      }`}
                    >
                      <div className="font-semibold text-sm text-purple-900">
                        {msg.sender === "admin" ? "Jay's Quiz Hub" : "You"}
                        <span className="ml-2 text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="ml-1 text-gray-900">{msg.message}</div>
                    </div>
                  ))}
                </div>
                {/* Reply form */}
                <form
                  className="flex gap-2 mt-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleReply(thread.id);
                  }}
                >
                  <input
                    type="text"
                    value={replyContent[thread.id] || ""}
                    onChange={(e) =>
                      setReplyContent((c) => ({
                        ...c,
                        [thread.id]: e.target.value,
                      }))
                    }
                    placeholder="Type your reply…"
                    className="flex-1 px-3 py-2 border rounded"
                    disabled={sending[thread.id]}
                  />
                  <button
                    type="submit"
                    className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-yellow-400 hover:text-purple-800 font-bold"
                    disabled={sending[thread.id]}
                  >
                    {sending[thread.id] ? "Sending…" : "Reply"}
                  </button>
                </form>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

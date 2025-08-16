"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { BrandButton } from "@/components/ui/BrandButton";

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

      const { data: threadsData } = await supabase
        .from("contact_threads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setThreads(threadsData || []);
      setLoading(false);

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

        if (threadsData.length) {
          const expand: Record<string, boolean> = {};
          threadsData.forEach(
            (t: Thread, i: number) => (expand[t.id] = i === 0)
          );
          setExpanded(expand);
        }
      }
    };
    fetchThreads();
  }, []);

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
      <div className="text-center text-textc-muted my-8">Loading messages…</div>
    );
  }
  if (!user || threads.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Replies from Jay’s Quiz Hub</CardTitle>
          <CardDescription>We’ll keep your conversations here</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="rounded-lg border borderc bg-white dark:bg-surface-inverted/60 p-4 shadow-card"
            >
              <button
                className="flex items-center w-full text-left focus:outline-none mb-2"
                onClick={() => toggleExpand(thread.id)}
                aria-expanded={expanded[thread.id]}
              >
                {expanded[thread.id] ? (
                  <FaChevronDown className="text-brand mr-2" />
                ) : (
                  <FaChevronRight className="text-brand mr-2" />
                )}
                <span className="font-semibold text-textc">
                  {thread.subject}
                </span>
                <span className="text-xs text-textc-muted ml-2">
                  ({new Date(thread.created_at).toLocaleString()})
                </span>
              </button>

              {expanded[thread.id] && (
                <>
                  <div className="mb-3">
                    {messages[thread.id]?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-3 pl-3 ${
                          msg.sender === "admin"
                            ? "border-l-4 border-brand"
                            : "border-l-4 border-accent"
                        }`}
                      >
                        <div className="font-semibold text-sm text-textc">
                          {msg.sender === "admin" ? "Jay's Quiz Hub" : "You"}
                          <span className="ml-2 text-xs text-textc-muted">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="ml-1 text-textc">{msg.message}</div>
                      </div>
                    ))}
                  </div>

                  <form
                    className="flex gap-2"
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
                      className="flex-1 px-3 py-2 rounded-md border borderc bg-white dark:bg-surface-inverted text-textc"
                      disabled={sending[thread.id]}
                    />
                    <BrandButton type="submit" disabled={sending[thread.id]}>
                      {sending[thread.id] ? "Sending…" : "Reply"}
                    </BrandButton>
                  </form>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

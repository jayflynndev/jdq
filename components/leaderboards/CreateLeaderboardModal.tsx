"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import toast from "react-hot-toast";

type QuizType = "JDQ" | "JVQ";
type JDQScope = "weekly" | "monthly" | "all_time";
type JVQScope = "monthly" | "all_time";

type Friend = { id: string; username: string };

export interface CreateLeaderboardModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void; // called with new leaderboard id
}

export default function CreateLeaderboardModal({
  open,
  onClose,
  onCreated,
}: CreateLeaderboardModalProps) {
  const [me, setMe] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // form state
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [quizType, setQuizType] = useState<QuizType>("JDQ");
  const [jdqScope, setJdqScope] = useState<JDQScope>("weekly");
  const [jvqDays, setJvqDays] = useState<{
    thursday: boolean;
    saturday: boolean;
    combined: boolean;
  }>({
    thursday: true,
    saturday: false,
    combined: false,
  });
  const [jvqScope, setJvqScope] = useState<JVQScope>("monthly");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  // reset when closing
  const resetForm = () => {
    setName("");
    setQuizType("JDQ");
    setJdqScope("weekly");
    setJvqDays({ thursday: true, saturday: false, combined: false });
    setJvqScope("monthly");
    setStartDate(null);
    setSelectedFriendIds([]);
  };

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingFriends(true);
      const { data: userResp } = await supabase.auth.getUser();
      const uid = userResp.user?.id || null;
      setMe(uid);

      if (!uid) {
        setFriends([]);
        setLoadingFriends(false);
        return;
      }

      // accepted friendships
      const { data: fr } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id, status")
        .eq("status", "accepted")
        .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);

      const otherIds = (fr || []).map(
        (f: { requester_id: string; addressee_id: string; status: string }) =>
          f.requester_id === uid ? f.addressee_id : f.requester_id
      );
      if (otherIds.length) {
        const { data: fps } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", Array.from(new Set(otherIds)));
        setFriends((fps || []) as Friend[]);
      } else {
        setFriends([]);
      }
      setLoadingFriends(false);
    })();
  }, [open]);

  const toggleFriend = (id: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createLeaderboard = async () => {
    if (!me) {
      toast.error("Please sign in.");
      return;
    }
    if (!name.trim()) {
      toast.error("Please give your leaderboard a name.");
      return;
    }

    // radio-like checkbox behavior
    const chosenJVQDays = (
      ["thursday", "saturday", "combined"] as const
    ).filter((k) => (jvqDays as any)[k]);

    if (quizType === "JVQ" && chosenJVQDays.length === 0) {
      toast.error("Choose one JVQ day scope.");
      return;
    }
    if (quizType === "JVQ" && chosenJVQDays.length > 1) {
      toast.error("Only one JVQ day can be selected.");
      return;
    }

    setCreating(true);
    const payload = {
      p_name: name.trim(),
      p_quiz_type: quizType,
      p_jdq_scope: quizType === "JDQ" ? jdqScope : null,
      p_jvq_days: quizType === "JVQ" ? chosenJVQDays : null, // text[]
      p_jvq_scope: quizType === "JVQ" ? jvqScope : null,
      p_start_date: startDate ?? null,
      p_member_ids: selectedFriendIds,
    };

    const { data, error } = await supabase.rpc(
      "create_leaderboard_and_add_members",
      payload as any
    );
    setCreating(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const newId =
      (typeof data === "string" && data) ||
      (data as any)?.create_leaderboard_and_add_members ||
      (data as any)?.id;

    toast.success("Leaderboard created");
    resetForm();
    onClose?.();
    if (newId && onCreated) onCreated(newId);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create Leaderboard</h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold">
            Leaderboard name
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Thursday Crew"
            />
          </label>

          <label className="block text-sm font-semibold">
            Quiz Type (JVQ/JDQ?)
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={quizType}
              onChange={(e) => setQuizType(e.target.value as QuizType)}
            >
              <option value="JDQ">JDQ</option>
              <option value="JVQ">JVQ</option>
            </select>
          </label>

          {quizType === "JDQ" ? (
            <fieldset className="block text-sm md:col-span-2">
              <legend className="mb-1 font-semibold">
                JDQ Pick a Weekly, Monthly or All Time Leaderboard?
              </legend>
              <div className="flex flex-wrap gap-3 rounded-md border p-2">
                {(["weekly", "monthly", "all_time"] as JDQScope[]).map(
                  (opt) => (
                    <label
                      key={opt}
                      className="inline-flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={jdqScope === opt}
                        onChange={() => setJdqScope(opt)}
                      />
                      {opt.replace("_", " ")}
                    </label>
                  )
                )}
              </div>
            </fieldset>
          ) : (
            <>
              <fieldset className="block text-sm">
                <legend className="mb-1 font-semibold">
                  Thurs, Sat or Both Quizzes Combined
                </legend>
                <div className="flex flex-wrap gap-3 rounded-md border p-2">
                  {(["thursday", "saturday", "combined"] as const).map(
                    (opt) => (
                      <label
                        key={opt}
                        className="inline-flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={(jvqDays as any)[opt]}
                          onChange={() =>
                            setJvqDays({
                              thursday: false,
                              saturday: false,
                              combined: false,
                              [opt]: true,
                            } as any)
                          }
                        />
                        {opt[0].toUpperCase() + opt.slice(1)}
                      </label>
                    )
                  )}
                </div>
              </fieldset>

              <label className="block text-sm font-semibold">
                Monthly or all time Leaderboard?
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={jvqScope}
                  onChange={(e) => setJvqScope(e.target.value as JVQScope)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="all_time">All-Time</option>
                </select>
              </label>
            </>
          )}

          <label className="block text-sm md:col-span-2 font-semibold">
            Start Date (Leave Blank to pick all historic scores)
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={startDate ?? ""}
              onChange={(e) => setStartDate(e.target.value || null)}
            />
          </label>

          <div className="md:col-span-2">
            <div className="mb-1 text-sm font-semibold">
              Add friends to the leaderboard (They can opt out later)
            </div>
            {loadingFriends ? (
              <p className="text-sm text-gray-500">Loading friends…</p>
            ) : friends.length === 0 ? (
              <p className="text-sm text-gray-500">No friends yet.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {friends.map((f) => {
                  const checked = selectedFriendIds.includes(f.id);
                  return (
                    <label
                      key={f.id}
                      className="flex items-center gap-2 rounded-md border p-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFriend(f.id)}
                      />
                      @{f.username}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="flex-1 rounded-md border px-4 py-2 hover:bg-gray-50"
            disabled={creating}
          >
            Cancel
          </button>
          <button
            onClick={createLeaderboard}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={creating}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

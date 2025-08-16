"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import toast from "react-hot-toast";
import { BrandButton } from "@/components/ui/BrandButton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";

type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at: string | null;
};

type Profile = { id: string; username: string };

export default function ManageQuizzers() {
  const [me, setMe] = useState<string | null>(null);
  const [usernameToAdd, setUsernameToAdd] = useState("");

  const [incoming, setIncoming] = useState<
    (Friendship & { requester: Profile })[]
  >([]);
  const [outgoing, setOutgoing] = useState<
    (Friendship & { addressee: Profile })[]
  >([]);
  const [friends, setFriends] = useState<(Friendship & { other: Profile })[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr) {
      toast.error(authErr.message);
      setLoading(false);
      return;
    }
    if (!user) {
      setMe(null);
      setIncoming([]);
      setOutgoing([]);
      setFriends([]);
      setLoading(false);
      return;
    }
    setMe(user.id);

    const [{ data: incRows }, { data: outRows }, { data: frRows }] =
      await Promise.all([
        supabase
          .from("friendships")
          .select(
            "id, requester_id, addressee_id, status, created_at, responded_at"
          )
          .eq("addressee_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("friendships")
          .select(
            "id, requester_id, addressee_id, status, created_at, responded_at"
          )
          .eq("requester_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("friendships")
          .select(
            "id, requester_id, addressee_id, status, created_at, responded_at"
          )
          .eq("status", "accepted")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .order("created_at", { ascending: false }),
      ]);

    const inc = incRows || [];
    const out = outRows || [];
    const fr = frRows || [];

    const ids = new Set<string>();
    inc.forEach((f: Friendship) => ids.add(f.requester_id));
    out.forEach((f: Friendship) => ids.add(f.addressee_id));
    fr.forEach((f: Friendship) =>
      ids.add(f.requester_id === user.id ? f.addressee_id : f.requester_id)
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", Array.from(ids));
    const byId = new Map((profiles || []).map((p: Profile) => [p.id, p]));

    setIncoming(
      inc.map((f: Friendship) => ({
        ...f,
        requester: byId.get(f.requester_id) || {
          id: f.requester_id,
          username: "(unknown)",
        },
      }))
    );
    setOutgoing(
      out.map((f: Friendship) => ({
        ...f,
        addressee: byId.get(f.addressee_id) || {
          id: f.addressee_id,
          username: "(unknown)",
        },
      }))
    );
    setFriends(
      fr.map((f: Friendship) => {
        const otherId =
          f.requester_id === user.id ? f.addressee_id : f.requester_id;
        return {
          ...f,
          other: byId.get(otherId) || { id: otherId, username: "(unknown)" },
        };
      })
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("friendships-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const sendRequest = async () => {
    if (!me) return;
    const raw = usernameToAdd.trim();
    if (!raw) return;

    setSending(true);
    const { data, error } = await supabase.rpc("request_friend_by_username", {
      target_username: raw,
    });
    setSending(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    if (data?.status === "accepted")
      toast.success("Matched request — you’re now friends!");
    else toast.success("Request sent!");
    setUsernameToAdd("");
    await load();
  };

  const accept = async (id: string) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Request accepted");
      load();
    }
  };

  const decline = async (id: string) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "declined", responded_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast("Declined");
      load();
    }
  };

  const cancelOrRemove = async (id: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removed");
      load();
    }
  };

  if (loading) return <div className="text-sm text-textc-muted">Loading…</div>;
  if (!me)
    return (
      <div className="text-sm text-textc-muted">
        Please sign in to manage quizzers.
      </div>
    );

  return (
    <div className="space-y-8">
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Add by Username</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border borderc p-4 bg-white dark:bg-surface-inverted/60">
            <div className="flex gap-2">
              <input
                value={usernameToAdd}
                onChange={(e) => setUsernameToAdd(e.target.value)}
                placeholder="Exact username"
                className="flex-1 rounded-md border borderc px-3 py-2 bg-white dark:bg-surface-inverted text-textc"
              />
              <BrandButton
                onClick={sendRequest}
                disabled={sending || !usernameToAdd.trim()}
              >
                {sending ? "Sending…" : "Send Request"}
              </BrandButton>
            </div>
            <p className="mt-2 text-xs text-textc-muted">
              Privacy-first: no search. You must know their exact username.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <CardTitle>Incoming Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {incoming.length === 0 ? (
            <p className="text-sm text-textc-muted">No incoming requests.</p>
          ) : (
            <ul className="space-y-2">
              {incoming.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-md border borderc px-3 py-2 bg-white dark:bg-surface-inverted/60"
                >
                  <span className="font-medium">@{r.requester.username}</span>
                  <div className="flex gap-2">
                    <BrandButton
                      variant="outline"
                      size="sm"
                      onClick={() => accept(r.id)}
                    >
                      Accept
                    </BrandButton>
                    <BrandButton
                      variant="outline"
                      size="sm"
                      onClick={() => decline(r.id)}
                    >
                      Decline
                    </BrandButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <CardTitle>Pending (Outgoing)</CardTitle>
        </CardHeader>
        <CardContent>
          {outgoing.length === 0 ? (
            <p className="text-sm text-textc-muted">No pending requests.</p>
          ) : (
            <ul className="space-y-2">
              {outgoing.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-md border borderc px-3 py-2 bg-white dark:bg-surface-inverted/60"
                >
                  <span className="font-medium">@{r.addressee.username}</span>
                  <BrandButton
                    variant="outline"
                    size="sm"
                    onClick={() => cancelOrRemove(r.id)}
                  >
                    Cancel
                  </BrandButton>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <CardTitle>Friends</CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <p className="text-sm text-textc-muted">No friends yet.</p>
          ) : (
            <ul className="space-y-2">
              {friends.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between rounded-md border borderc px-3 py-2 bg-white dark:bg-surface-inverted/60"
                >
                  <span className="font-medium">@{f.other.username}</span>
                  <BrandButton
                    variant="outline"
                    size="sm"
                    onClick={() => cancelOrRemove(f.id)}
                  >
                    Remove
                  </BrandButton>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";
import AddScoreForm from "@/components/AddScoreForm";
import JdqScoreSummary from "@/components/JdqScoreSummary";
import JvqScoreSummary from "@/components/JvqScoreSummary";
import ContactThreads from "@/components/ContactThreads";
import ProfileForm from "@/components/ProfileFormClient";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Card view toggles
  const [showAddScoreForm, setShowAddScoreForm] = useState(false);
  const [showJdqScores, setShowJdqScores] = useState(false);
  const [showJvqScores, setShowJvqScores] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      // Get Supabase user (session)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth"); // Not logged in
        return;
      }
      setEmail(user.email ?? "");

      // Fetch username from "profiles"
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      setUsername(profile?.username ?? null);
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  // Show a loading spinner if needed
  if (loading) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  // Display name logic
  const displayName =
    (username && username.trim()) ||
    (email ? email.split("@")[0] : "") ||
    "Player";

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">
        {displayName}, welcome to your profile
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left section */}
        <div className="space-y-4">
          {showAddScoreForm ? (
            <AddScoreForm onScoreSubmitted={() => setShowAddScoreForm(false)} />
          ) : showJdqScores ? (
            <JdqScoreSummary onBack={() => setShowJdqScores(false)} />
          ) : showJvqScores ? (
            <JvqScoreSummary onBack={() => setShowJvqScores(false)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setShowAddScoreForm(true)}
                className="bg-white p-6 rounded shadow-md hover:shadow-lg transition cursor-pointer text-center"
              >
                <h3 className="text-xl font-bold mb-2">Add Your Score</h3>
                <p className="text-gray-600">
                  Submit a new quiz result to track your progress.
                </p>
              </div>
              <div
                onClick={() => setShowJdqScores(true)}
                className="bg-white p-6 rounded shadow-md hover:shadow-lg transition cursor-pointer text-center"
              >
                <h3 className="text-xl font-bold mb-2">See Your JDQ Scores</h3>
                <p className="text-gray-600">
                  View your JDQ averages and leaderboard placements.
                </p>
              </div>
              <div
                onClick={() => setShowJvqScores(true)}
                className="bg-white p-6 rounded shadow-md hover:shadow-lg transition cursor-pointer text-center"
              >
                <h3 className="text-xl font-bold mb-2">See Your JVQ Scores</h3>
                <p className="text-gray-600">
                  View your JVQ averages and leaderboard placements.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right section (Profile update) */}
        <div className="bg-white p-4 rounded shadow-md">
          <h2 className="text-2xl font-bold mb-4">Update Profile</h2>
          <h3 className="text-lg font-semibold mb-4">
            Update details if required (leave current password blank to keep it
            unchanged)
          </h3>
          <ProfileForm />
        </div>
      </div>

      {/* Replies */}
      <div className="mt-10">
        <ContactThreads />
      </div>
    </div>
  );
}

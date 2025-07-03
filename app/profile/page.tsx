// app/profile/page.tsx (or wherever your Profile lives)
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase/config";
import { fetchUsername } from "@/utils/fetchUsername";
import ProfileForm from "@/components/profileForm";
import AddScoreForm from "@/components/AddScoreForm";
import JdqScoreSummary from "@/components/JdqScoreSummary";
import JvqScoreSummary from "@/components/JvqScoreSummary";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddScoreForm, setShowAddScoreForm] = useState(false);
  const [showJdqScores, setShowJdqScores] = useState(false);
  const [showJvqScores, setShowJvqScores] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setEmail(user.email || "");
        try {
          const name = await fetchUsername(user.uid);
          setUsername(name);
        } catch {
          setUsername("Player");
        }
      } else {
        router.push("/sign-in");
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">
        {username || "User"}, welcome to your profile
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

        {/* Right section */}
        <div className="bg-white p-4 rounded shadow-md">
          <h2 className="text-2xl font-bold mb-4">Update Profile</h2>
          <h3 className="text-lg font-semibold mb-4">
            Update details if required (leave current password blank to keep it
            unchanged)
          </h3>

          <ProfileForm
            email={email}
            username={username}
            currentPassword={currentPassword}
            setEmail={setEmail}
            setUsername={setUsername}
            setCurrentPassword={setCurrentPassword}
            setError={setError}
            setSuccess={setSuccess}
          />

          {success && <p className="text-green-500 mt-4">{success}</p>}
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/app/firebase/config";

interface Score {
  quizDate: string;
  score: number;
  tiebreaker: number;
}

export default function Profile() {
  const [scores, setScores] = useState<Score[]>([]);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [allTimeAverage, setAllTimeAverage] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setEmail(user.email || "");
        fetchUsername(user.uid);
        fetchScores(user.uid);
      } else {
        router.push("/sign-in");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUsername = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUsername(userDoc.data().username);
      }
    } catch (error) {
      console.error("Error fetching username:", error);
      setError("Failed to fetch username. Please try again.");
    }
  };

  const fetchScores = async (uid: string) => {
    try {
      const scoresQuery = query(
        collection(db, "scores"),
        where("uid", "==", uid),
        orderBy("quizDate", "desc")
      );
      const scoresSnapshot = await getDocs(scoresQuery);
      const scoresData = scoresSnapshot.docs.map((doc) => ({
        quizDate: new Date(doc.data().quizDate).toLocaleDateString("en-GB"),
        score: doc.data().score,
        tiebreaker: doc.data().tiebreaker,
      }));
      setScores(scoresData);
      calculateAverages(scoresData);
    } catch (error) {
      console.error("Error fetching scores:", error);
      setError("Failed to fetch scores. Please try again.");
    }
  };

  const calculateAverages = (scores: Score[]) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const weeklyScores = scores.filter(
      (score) =>
        new Date(score.quizDate.split("/").reverse().join("-")) >= startOfWeek
    );
    const monthlyScores = scores.filter(
      (score) =>
        new Date(score.quizDate.split("/").reverse().join("-")) >= startOfMonth
    );
    const allTimeScores = scores;

    setWeeklyAverage(calculateAverage(weeklyScores));
    setMonthlyAverage(calculateAverage(monthlyScores));
    setAllTimeAverage(calculateAverage(allTimeScores));
  };

  const calculateAverage = (scores: Score[]) => {
    if (scores.length === 0) return 0;
    const totalScore = scores.reduce((sum, score) => sum + score.score, 0);
    return parseFloat((totalScore / scores.length).toFixed(2));
  };

  const reauthenticate = async (currentPassword: string) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }
    const credential = EmailAuthProvider.credential(
      user.email || "",
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await reauthenticate(currentPassword);

      const user = auth.currentUser;
      if (!user) {
        setError("User not authenticated");
        return;
      }

      if (email !== user.email) {
        await updateEmail(user, email);
      }

      if (password) {
        await updatePassword(user, password);
      }

      // Update Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        email: email,
        username: username,
      });

      // Update username in scores collection
      const scoresQuery = query(
        collection(db, "scores"),
        where("uid", "==", user.uid)
      );
      const scoresSnapshot = await getDocs(scoresQuery);
      const batch = writeBatch(db);
      scoresSnapshot.docs.forEach((scoreDoc) => {
        batch.update(scoreDoc.ref, { username: username });
      });
      await batch.commit();

      setError("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">
        {username}, welcome to your profile
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow-md">
          <h2 className="text-2xl font-bold mb-4">{username}&apos;s Scores</h2>
          <table className="min-w-full bg-white border-collapse">
            <thead>
              <tr>
                <th className="py-2 border border-gray-300">Date</th>
                <th className="py-2 border border-gray-300">Score</th>
                <th className="py-2 border border-gray-300">Tiebreaker</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <tr key={index} className="text-center">
                  <td className="py-2 border border-gray-300">
                    {score.quizDate}
                  </td>
                  <td className="py-2 border border-gray-300">{score.score}</td>
                  <td className="py-2 border border-gray-300">
                    {score.tiebreaker}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="text-xl font-bold mt-4">Averages</h3>
          <p>Weekly Average: {weeklyAverage}</p>
          <p>Monthly Average: {monthlyAverage}</p>
          <p>All Time Average: {allTimeAverage}</p>
        </div>
        <div className="bg-white p-4 rounded shadow-md">
          <h2 className="text-2xl font-bold mb-4">Update Profile</h2>
          <h3 className="text-lg font-semibold mb-4">
            Update details if required
          </h3>
          <form onSubmit={handleUpdateProfile}>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="username"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="currentPassword"
              >
                Enter Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password"
              >
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
            >
              Update Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { db, app } from "@/app/firebase/config";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

export default function ContactPage() {
  // Track the user and auth state
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [username, setUsername] = useState<string>("");
  const [usernameLoading, setUsernameLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  // Load Firebase user when component mounts
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch username from Firestore after user loads
  useEffect(() => {
    const fetchUsername = async () => {
      if (user) {
        setUsernameLoading(true);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().username) {
            setUsername(userDoc.data().username);
          } else if (user.displayName) {
            setUsername(user.displayName);
          } else if (user.email) {
            setUsername(user.email.split("@")[0]);
          } else {
            setUsername("");
          }
        } catch {
          setUsername(
            user.displayName || (user.email ? user.email.split("@")[0] : "")
          );
        } finally {
          setUsernameLoading(false);
        }
      }
    };
    fetchUsername();
  }, [user]);

  // Show loading state while auth or username loads
  if (user === undefined || (user && usernameLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 via-purple-500 to-purple-300 py-12 px-4">
        <div className="bg-white/80 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold text-purple-700 mb-2">
            Contact Us
          </h2>
          <p className="text-purple-800 mb-4">Checking login status…</p>
        </div>
      </div>
    );
  }

  // Not logged in? Show sign-in prompt
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 via-purple-500 to-purple-300 py-12 px-4">
        <div className="bg-white/80 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold text-purple-700 mb-2">
            Contact Us
          </h2>
          <p className="text-purple-800 mb-4">
            You must be logged in to send a message.
          </p>
          <a href="/login" className="text-purple-700 underline font-semibold">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const email = user.email || "";

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      await addDoc(collection(db, "contactMessages"), {
        uid: user.uid,
        username,
        email,
        message,
        created: serverTimestamp(),
      });
      setMessage("");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  // Render the contact form for logged-in users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 via-purple-500 to-purple-300 py-12 px-4">
      <div className="bg-white/80 rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-3xl font-extrabold text-purple-700 mb-2 text-center">
          Contact Us
        </h1>
        <p className="text-center text-purple-800 mb-6">
          Found an issue? Have a suggestion? Need something correcting? Let us
          know! <br />
          (You must be logged in to send a message.)
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            name="username"
            type="text"
            value={username}
            disabled
            className="w-full px-4 py-3 bg-gray-100 border border-purple-300 text-purple-900 rounded-lg"
          />
          <input
            name="email"
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-3 bg-gray-100 border border-purple-300 text-purple-900 rounded-lg"
          />
          <textarea
            name="message"
            rows={4}
            placeholder="Start with your name, so we know who we are talking to! Then type your message!"
            className="w-full px-4 py-3 bg-white border border-purple-300 text-purple-900 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 focus:outline-none"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            className="w-full py-3 bg-purple-700 hover:bg-yellow-400 hover:text-purple-800 text-white font-bold rounded-lg shadow-md transition"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending..." : "Send Message"}
          </button>
        </form>
        {status === "sent" && (
          <p className="mt-4 text-center text-green-600 font-semibold">
            Thank you! Your message has been sent.
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 text-center text-red-600 font-semibold">
            Please write a message before sending.
          </p>
        )}
      </div>
    </div>
  );
}

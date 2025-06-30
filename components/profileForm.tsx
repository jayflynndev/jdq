import { useState } from "react";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  doc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/app/firebase/config";

interface ProfileFormProps {
  email: string;
  username: string;
  currentPassword: string;
  setEmail: (email: string) => void;
  setUsername: (username: string) => void;
  setCurrentPassword: (password: string) => void;
  setError: (error: string) => void;
  setSuccess: (message: string) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  email,
  username,
  currentPassword,
  setEmail,
  setUsername,
  setCurrentPassword,
  setError,
  setSuccess,
}) => {
  const [password, setPassword] = useState("");

  const reauthenticate = async (currentPassword: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
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

      // ✅ Check for unique username
      const usernameQuery = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      const usernameSnapshot = await getDocs(usernameQuery);
      const isUsernameTaken =
        usernameSnapshot.docs.length > 0 &&
        usernameSnapshot.docs[0].id !== user.uid;

      if (isUsernameTaken) {
        setSuccess("");
        setError("Username is already taken. Please choose another.");
        return;
      }

      if (email !== user.email) {
        await updateEmail(user, email);
      }

      if (password) {
        await updatePassword(user, password);
      }

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        email,
        username,
      });

      const scoresQuery = query(
        collection(db, "scores"),
        where("uid", "==", user.uid)
      );
      const scoresSnapshot = await getDocs(scoresQuery);
      const batch = writeBatch(db);
      scoresSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { username });
      });
      await batch.commit();

      setError("");
      setSuccess("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      setSuccess("");
      setError("Failed to update profile. Please try again.");
    }
  };

  return (
    <form onSubmit={handleUpdateProfile}>
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
  );
};

export default ProfileForm;

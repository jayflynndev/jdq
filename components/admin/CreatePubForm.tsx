"use client";
import { useState } from "react";
import { db } from "@/app/firebase/config";
import { collection, addDoc } from "firebase/firestore";

interface Props {
  onCreated?: () => void; // Call this after pub is created
  onClose?: () => void; // Optional: for modals etc.
}

export default function CreatePubForm({ onCreated, onClose }: Props) {
  const [name, setName] = useState("");
  const [maxTeams, setMaxTeams] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await addDoc(collection(db, "pubs"), {
        name,
        maxTeams,
        createdAt: new Date(),
      });
      setName("");
      setMaxTeams(10);
      if (onCreated) onCreated();
      if (onClose) onClose();
    } catch {
      setError("Failed to create pub.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-3 text-purple-800">Add a New Pub</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 font-semibold">Pub Name</label>
        <input
          className="w-full border rounded p-2 mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <label className="block mb-2 font-semibold">Maximum Teams</label>
        <input
          type="number"
          min={1}
          max={100}
          className="w-full border rounded p-2 mb-4"
          value={maxTeams}
          onChange={(e) => setMaxTeams(Number(e.target.value))}
        />
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Pub"}
          </button>
          {onClose && (
            <button
              type="button"
              className="bg-gray-300 px-6 py-2 rounded-xl font-bold text-gray-700 hover:bg-gray-400"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

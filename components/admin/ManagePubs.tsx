"use client";
import { useState, useEffect } from "react";
import { db } from "@/app/firebase/config";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import CreatePubForm from "./CreatePubForm";

type Pub = {
  id: string;
  name: string;
  maxTeams: number;
};

export default function ManagePubs() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Realtime fetch of pubs from Firestore
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, "pubs"), (snap) => {
      setPubs(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Pub[]
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  // Delete pub from Firestore
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this pub?")) return;
    await deleteDoc(doc(db, "pubs", id));
    // No need to manually update state—onSnapshot will auto-refresh the list
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-purple-700">Pubs</h2>
        <button
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition"
          onClick={() => setShowForm(true)}
        >
          <FaPlus className="mr-2" /> Add Pub
        </button>
      </div>
      {/* Add Pub Form */}
      {showForm && (
        <CreatePubForm
          onCreated={() => setShowForm(false)}
          onClose={() => setShowForm(false)}
        />
      )}
      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading pubs…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pubs.map((pub) => (
            <div
              key={pub.id}
              className="bg-purple-50 rounded-xl p-4 flex flex-col gap-2 shadow"
            >
              <div className="font-bold text-purple-900 text-lg">
                {pub.name}
              </div>
              <div className="text-gray-700 text-sm mb-2">
                Max Teams: <span className="font-semibold">{pub.maxTeams}</span>
              </div>
              <div className="flex gap-3 mt-auto">
                <button
                  className="flex items-center px-3 py-1 rounded bg-yellow-400 text-black hover:bg-yellow-300 transition"
                  // onClick={() => ...} // Edit handler for later
                  disabled
                >
                  <FaEdit className="mr-1" /> Edit
                </button>
                <button
                  className="flex items-center px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
                  onClick={() => handleDelete(pub.id)}
                >
                  <FaTrash className="mr-1" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {pubs.length === 0 && !loading && (
        <div className="text-gray-400 py-12 text-center">
          No pubs in the database yet.
        </div>
      )}
    </div>
  );
}

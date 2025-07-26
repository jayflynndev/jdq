"use client";
import { useState, useEffect } from "react";
import { db } from "@/app/firebase/config";
import { collection, addDoc, getDocs, doc, setDoc } from "firebase/firestore";
import { FaPlus } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface Props {
  onCreated: () => void;
  onClose: () => void;
}

type Pub = { id: string; name: string; maxTeams: number };

export default function CreateQuizForm({ onCreated, onClose }: Props) {
  // Quiz fields
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [livestreamUrl, setLivestreamUrl] = useState("");
  const [parts, setParts] = useState([
    { name: "Part 1", rounds: [{ roundName: "Round 1", numQuestions: 10 }] },
  ]);
  // Pubs
  const [allPubs, setAllPubs] = useState<Pub[]>([]);
  const [selectedPubIds, setSelectedPubIds] = useState<string[]>([]);
  const [loadingPubs, setLoadingPubs] = useState(true);
  // Modal
  const [showAddPub, setShowAddPub] = useState(false);
  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch pubs on mount (and after new pub is added)
  const loadPubs = async () => {
    setLoadingPubs(true);
    const snap = await getDocs(collection(db, "pubs"));
    setAllPubs(
      snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Pub[]
    );
    setLoadingPubs(false);
  };
  useEffect(() => {
    loadPubs();
  }, []);

  // --- Quiz PARTS and ROUNDS logic (same as before) ---
  const addPart = () => {
    setParts((prev) => [
      ...prev,
      {
        name: `Part ${prev.length + 1}`,
        rounds: [{ roundName: "Round 1", numQuestions: 10 }],
      },
    ]);
  };
  const removePart = (i: number) =>
    setParts(parts.length > 1 ? parts.filter((_, idx) => idx !== i) : parts);

  const handleRoundChange = (
    pIdx: number,
    rIdx: number,
    key: "roundName" | "numQuestions",
    val: string
  ) => {
    setParts((prev) =>
      prev.map((part, partIdx) =>
        partIdx === pIdx
          ? {
              ...part,
              rounds: part.rounds.map((round, roundIdx) =>
                roundIdx === rIdx
                  ? {
                      ...round,
                      [key]: key === "numQuestions" ? Number(val) : val,
                    }
                  : round
              ),
            }
          : part
      )
    );
  };
  const addRound = (pIdx: number) => {
    setParts((prev) =>
      prev.map((part, idx) =>
        idx === pIdx
          ? {
              ...part,
              rounds: [
                ...part.rounds,
                {
                  roundName: `Round ${part.rounds.length + 1}`,
                  numQuestions: 10,
                },
              ],
            }
          : part
      )
    );
  };
  const removeRound = (pIdx: number, rIdx: number) => {
    setParts((prev) =>
      prev.map((part, idx) =>
        idx === pIdx && part.rounds.length > 1
          ? { ...part, rounds: part.rounds.filter((_, i) => i !== rIdx) }
          : part
      )
    );
  };

  // --- Handle Quiz Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (selectedPubIds.length === 0) {
      setError("Please select at least one pub for this quiz.");
      setLoading(false);
      return;
    }
    try {
      // Get the new quiz doc ref and ID
      const docRef = await addDoc(collection(db, "liveQuizzes"), {
        title,
        startTime,
        livestreamUrl,
        parts,
        status: "waiting",
        pubIds: selectedPubIds,
      });
      for (const pubId of selectedPubIds) {
        const pub = allPubs.find((p) => p.id === pubId);
        if (pub) {
          // Create a pub doc under liveQuizzes/{quizId}/pubs/{pubId}
          await setDoc(doc(db, "liveQuizzes", docRef.id, "pubs", pub.id), {
            pubId: pub.id,
            name: pub.name,
            maxTeams: pub.maxTeams,
            members: [], // Start empty!
          });
        }
      }
      // Redirect to the quiz admin/dashboard page
      router.push(`/admin/live-quiz/${docRef.id}`);
      if (onCreated) onCreated();
    } catch {
      setError("Failed to create quiz. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Inline Add Pub Modal ---
  function AddPubModal({
    onAdded,
    onClose,
  }: {
    onAdded: () => void;
    onClose: () => void;
  }) {
    const [name, setName] = useState("");
    const [maxTeams, setMaxTeams] = useState(10);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const handlePubSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErr(null);
      setSaving(true);
      try {
        await addDoc(collection(db, "pubs"), {
          name,
          maxTeams,
          createdAt: new Date(),
        });
        onAdded();
        setName("");
        setMaxTeams(10);
        onClose();
      } catch {
        setErr("Failed to add pub.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full">
          <h3 className="text-xl font-bold mb-4 text-purple-800">Add a Pub</h3>
          <form onSubmit={handlePubSubmit}>
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
              required
            />
            {err && <div className="text-red-600 mb-2">{err}</div>}
            <div className="flex gap-4 mt-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700"
                disabled={saving}
              >
                {saving ? "Adding..." : "Add Pub"}
              </button>
              <button
                type="button"
                className="bg-gray-300 px-6 py-2 rounded-xl font-bold text-gray-700 hover:bg-gray-400"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-purple-800 mb-4">
        Create a New Quiz
      </h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 font-semibold">Quiz Title</label>
        <input
          className="w-full border rounded p-2 mb-4"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <label className="block mb-2 font-semibold">Start Time</label>
        <input
          className="w-full border rounded p-2 mb-4"
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
        <label className="block mb-2 font-semibold">Livestream URL</label>
        <input
          className="w-full border rounded p-2 mb-4"
          value={livestreamUrl}
          onChange={(e) => setLivestreamUrl(e.target.value)}
          placeholder="https://youtube.com/..."
        />
        {/* PARTS & ROUNDS */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Parts & Rounds</label>
          {parts.map((part, pIdx) => (
            <div key={pIdx} className="border rounded-lg p-4 mb-4 bg-purple-50">
              <div className="flex items-center justify-between mb-2">
                <input
                  className="font-bold text-lg border-b-2 border-purple-300 bg-transparent w-48"
                  value={part.name}
                  onChange={(e) =>
                    setParts((prev) =>
                      prev.map((p, idx) =>
                        idx === pIdx ? { ...p, name: e.target.value } : p
                      )
                    )
                  }
                  required
                />
                {parts.length > 1 && (
                  <button
                    type="button"
                    className="text-red-500 text-2xl"
                    onClick={() => removePart(pIdx)}
                    title="Remove part"
                  >
                    &times;
                  </button>
                )}
              </div>
              {part.rounds.map((round, rIdx) => (
                <div key={rIdx} className="flex gap-2 mb-2 items-center">
                  <input
                    className="border rounded p-2 flex-1"
                    placeholder="Round Name"
                    value={round.roundName}
                    onChange={(e) =>
                      handleRoundChange(pIdx, rIdx, "roundName", e.target.value)
                    }
                    required
                  />
                  <input
                    className="border rounded p-2 w-24"
                    type="number"
                    min={1}
                    max={50}
                    placeholder="Questions"
                    value={round.numQuestions}
                    onChange={(e) =>
                      handleRoundChange(
                        pIdx,
                        rIdx,
                        "numQuestions",
                        e.target.value
                      )
                    }
                    required
                  />
                  {part.rounds.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 px-2"
                      onClick={() => removeRound(pIdx, rIdx)}
                      title="Remove round"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="bg-purple-200 hover:bg-purple-300 text-purple-800 px-3 py-1 rounded mt-2"
                onClick={() => addRound(pIdx)}
              >
                + Add Round
              </button>
            </div>
          ))}
          <button
            type="button"
            className="bg-green-200 hover:bg-green-300 text-green-800 px-3 py-1 rounded mt-2"
            onClick={addPart}
          >
            + Add Part
          </button>
        </div>
        {/* PUBS SECTION */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">
            Available Pubs for This Quiz
          </label>
          {loadingPubs ? (
            <div className="text-gray-500">Loading pubs…</div>
          ) : allPubs.length === 0 ? (
            <div className="text-gray-400">
              No pubs found.{" "}
              <button
                type="button"
                className="underline text-purple-700 font-semibold"
                onClick={() => setShowAddPub(true)}
              >
                Add a pub now
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 items-center">
              {allPubs.map((pub) => (
                <label key={pub.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedPubIds.includes(pub.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPubIds((prev) => [...prev, pub.id]);
                      } else {
                        setSelectedPubIds((prev) =>
                          prev.filter((id) => id !== pub.id)
                        );
                      }
                    }}
                  />
                  <span>{pub.name}</span>
                </label>
              ))}
              <button
                type="button"
                className="ml-2 flex items-center text-sm bg-purple-100 px-2 py-1 rounded hover:bg-purple-200"
                onClick={() => setShowAddPub(true)}
              >
                <FaPlus className="mr-1" /> Add Pub
              </button>
            </div>
          )}
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Quiz"}
          </button>
          <button
            type="button"
            className="bg-gray-300 px-6 py-2 rounded-xl font-bold text-gray-700 hover:bg-gray-400"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
      {/* --- Modal for adding pub --- */}
      {showAddPub && (
        <AddPubModal
          onAdded={() => loadPubs()}
          onClose={() => setShowAddPub(false)}
        />
      )}
    </div>
  );
}

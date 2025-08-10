"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import { supabase } from "@/supabaseClient";

export default function AddQuizPage() {
  const router = useRouter();

  const [quizDay, setQuizDay] = useState("");
  const [quizDate, setQuizDate] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [questions, setQuestions] = useState(
    Array(5)
      .fill("")
      .map(() => Array(10).fill(""))
  );
  type ImageUpload = { label: string; file: File | null };
  const [imageUploads, setImageUploads] = useState<{
    part1: ImageUpload[];
    part2: ImageUpload[];
  }>({
    part1: [],
    part2: [],
  });
  const [uploading, setUploading] = useState(false);
  const [part1Code, setPart1Code] = useState("");
  const [part2Code, setPart2Code] = useState("");

  // Handle round question input
  const handleQuestionChange = (
    roundIndex: number,
    qIndex: number,
    value: string
  ) => {
    const updated = [...questions];
    updated[roundIndex][qIndex] = value;
    setQuestions(updated);
  };

  // Handle images UI
  const handleAddImageField = (part: "part1" | "part2") => {
    setImageUploads((prev) => ({
      ...prev,
      [part]: [...prev[part], { label: "", file: null }],
    }));
  };

  const handleImageChange = (
    part: "part1" | "part2",
    index: number,
    key: "label" | "file",
    value: string | File | null
  ) => {
    const updated = [...imageUploads[part]];
    if (key === "label") {
      (updated[index] as ImageUpload).label = value as string;
    } else if (key === "file") {
      (updated[index] as ImageUpload).file = value as File | null;
    }
    setImageUploads((prev) => ({ ...prev, [part]: updated }));
  };

  const handleRemoveImageField = (part: "part1" | "part2", index: number) => {
    const updated = [...imageUploads[part]];
    updated.splice(index, 1);
    setImageUploads((prev) => ({ ...prev, [part]: updated }));
  };

  // Upload an image to Supabase Storage and return its URL
  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const filePath = `quiz-images/${uuid()}-${file.name}`;
    const { error } = await supabase.storage
      .from("quiz-images")
      .upload(filePath, file, { upsert: true });
    if (error) throw error;
    // Get the public URL for the image
    const { data: urlData } = supabase.storage
      .from("quiz-images")
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  // Main submit handler
  const handleSubmit = async () => {
    setUploading(true);

    try {
      // Upload images for both parts and keep label with URL
      const uploadImages = async (images: ImageUpload[]) => {
        const uploaded = await Promise.all(
          images.map(async ({ label, file }) => {
            if (!file) return null;
            const url = await uploadImageToSupabase(file);
            return { label, url };
          })
        );
        return uploaded.filter(Boolean);
      };

      const part1Images = await uploadImages(imageUploads.part1);
      const part2Images = await uploadImages(imageUploads.part2);

      const formattedRounds = questions.map((qSet, index) => ({
        round: index + 1,
        questions: qSet,
      }));

      // Build the Supabase payload
      const payload = {
        quiz_day: quizDay,
        quiz_date: quizDate,
        youtube_url: youtubeUrl,
        thumbnail_url: thumbnailUrl,
        access_codes: {
          part1: part1Code,
          part2: part2Code,
        },
        parts: {
          part1: {
            rounds: formattedRounds.slice(0, 3),
            images: part1Images,
          },
          part2: {
            rounds: formattedRounds.slice(3, 5),
            images: part2Images,
          },
        },
        // created_at: default handled by Supabase if default now()
      };

      const { error } = await supabase.from("quizzes").insert([payload]);
      if (error) throw error;

      alert("Quiz saved successfully!");
      router.push("/admin");
    } catch (err) {
      console.error(err);
      alert("Failed to save quiz.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">Add New Quiz</h1>

      <div className="space-y-4 mb-8">
        <input
          className="w-full p-2 rounded border"
          type="text"
          placeholder="Quiz Day"
          value={quizDay}
          onChange={(e) => setQuizDay(e.target.value)}
        />
        <input
          className="w-full p-2 rounded border"
          type="date"
          value={quizDate}
          onChange={(e) => setQuizDate(e.target.value)}
        />
        <input
          className="w-full p-2 rounded border"
          type="url"
          placeholder="YouTube URL"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
        />
        <input
          className="w-full p-2 rounded border"
          type="url"
          placeholder="Thumbnail URL (e.g. YouTube maxresdefault.jpg)"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
        />
        <input
          className="w-full p-2 rounded border"
          type="text"
          placeholder="Access Code for Part 1"
          value={part1Code}
          onChange={(e) => setPart1Code(e.target.value)}
        />
        <input
          className="w-full p-2 rounded border"
          type="text"
          placeholder="Access Code for Part 2"
          value={part2Code}
          onChange={(e) => setPart2Code(e.target.value)}
        />
      </div>

      {/* Rounds */}
      {[...Array(5)].map((_, roundIdx) => (
        <div key={roundIdx} className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            Round {roundIdx + 1} ({roundIdx < 3 ? "Part 1" : "Part 2"})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[...Array(10)].map((_, qIdx) => (
              <input
                key={qIdx}
                className="p-2 border rounded"
                placeholder={`Question ${qIdx + 1}`}
                value={questions[roundIdx][qIdx]}
                onChange={(e) =>
                  handleQuestionChange(roundIdx, qIdx, e.target.value)
                }
              />
            ))}
          </div>
        </div>
      ))}

      {/* Images Uploads */}
      {(["part1", "part2"] as const).map((part) => (
        <div key={part} className="mb-10">
          <h3 className="text-lg font-bold text-yellow-300 mb-2">
            Any Images ({part.toUpperCase()})
          </h3>
          <button
            className="bg-blue-600 text-white px-4 py-1 rounded mb-4"
            onClick={() => handleAddImageField(part)}
          >
            + Add Image
          </button>

          {imageUploads[part].map((img, index) => (
            <div key={index} className="flex gap-2 items-center mb-2">
              <input
                type="text"
                className="p-2 border rounded flex-1"
                placeholder="Round / Question"
                value={img.label}
                onChange={(e) =>
                  handleImageChange(part, index, "label", e.target.value)
                }
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageChange(
                    part,
                    index,
                    "file",
                    e.target.files?.[0] || null
                  )
                }
              />
              <button
                onClick={() => handleRemoveImageField(part, index)}
                className="text-red-500 font-bold text-xl"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-500 disabled:opacity-50"
        disabled={uploading}
      >
        {uploading ? "Saving..." : "Save Quiz"}
      </button>
    </div>
  );
}

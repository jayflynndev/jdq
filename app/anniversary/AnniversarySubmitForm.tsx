"use client";

import { useState } from "react";

type FormState = {
  name: string;

  category: string;
  question: string;
  answer: string;
  notes: string;
  website: string; // honeypot
};

const initialState: FormState = {
  name: "",

  category: "",
  question: "",
  answer: "",
  notes: "",
  website: "",
};

export default function AnniversarySubmitForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/anniversary-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(data?.error || "Something went wrong.");
      }

      window.location.href = "/?submitted=1";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit your question.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Name or nickname
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          maxLength={100}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none ring-0 transition focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="category" className="mb-2 block text-sm font-medium">
          Category (optional)
        </label>
        <input
          id="category"
          name="category"
          type="text"
          value={form.category}
          onChange={handleChange}
          maxLength={100}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none ring-0 transition focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950"
          placeholder="e.g. Sport, TV, Places"
        />
      </div>

      <div>
        <label htmlFor="question" className="mb-2 block text-sm font-medium">
          Question
        </label>
        <textarea
          id="question"
          name="question"
          value={form.question}
          onChange={handleChange}
          required
          rows={4}
          maxLength={500}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none ring-0 transition focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950"
          placeholder="Enter your question here"
        />
      </div>

      <div>
        <label htmlFor="answer" className="mb-2 block text-sm font-medium">
          Answer
        </label>
        <textarea
          id="answer"
          name="answer"
          value={form.answer}
          onChange={handleChange}
          required
          rows={3}
          maxLength={300}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none ring-0 transition focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950"
          placeholder="Enter the correct answer"
        />
      </div>

      <div>
        <label htmlFor="notes" className="mb-2 block text-sm font-medium">
          Extra notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          maxLength={500}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none ring-0 transition focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950"
          placeholder="Anything else I should know?"
        />
      </div>

      {/* Honeypot field */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          value={form.website}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Submit question"}
      </button>
    </form>
  );
}

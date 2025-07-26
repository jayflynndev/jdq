import React from "react";

function getYoutubeEmbedUrl(url: string): string {
  if (!url) return "";
  // If already an embed URL, return as is
  if (url.includes("youtube.com/embed/")) return url;

  // Extract video ID from typical URLs
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url; // fallback (could handle other providers, etc)
}

export const LivestreamEmbed: React.FC<{ url: string }> = ({ url }) => {
  const embedUrl = getYoutubeEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="bg-gray-100 text-gray-500 rounded-lg p-6 text-center">
        No livestream available.
      </div>
    );
  }

  return (
    <div className="relative pb-[56.25%] h-0 w-full rounded-xl overflow-hidden border border-purple-200 mb-6">
      <iframe
        src={embedUrl}
        title="Quiz Livestream"
        className="absolute top-0 left-0 w-full h-full"
        allowFullScreen
      ></iframe>
    </div>
  );
};

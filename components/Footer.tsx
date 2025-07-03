import React from "react";
import { FaYoutube, FaInstagram } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gradient-to-t from-primary-900 to-primary-200 p-4">
      <div className="container mx-auto text-center text-yellow-700 flex flex-col items-center">
        <p>
          Find more quizzes at the socials below, and don&apos;t forget to
          follow as well!
        </p>
        <div className="flex space-x-4 mt-2">
          <a
            href="https://www.youtube.com/@jaysvirtualquiz"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaYoutube size={24} />
          </a>
          <a
            href="https://www.instagram.com/thevirtualpubquiz/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaInstagram size={24} />
          </a>
        </div>
        <p className="mt-4">&copy; {currentYear} JDQ - Jay&apos;s Daily Quiz</p>
      </div>
    </footer>
  );
}

import React from "react";
import { FaYoutube, FaInstagram } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-t from-purple-900 to-purple-500 text-white mt-12">
      <div className="max-w-7xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-3">
        {/* Brand / Mission */}
        <div>
          <h3 className="font-heading text-xl mb-3">Jay’s Quiz Hub</h3>
          <p className="text-sm text-purple-100">
            Live quizzes, daily challenges, leaderboards, and a thriving
            community of quizzers. Play along, log your scores, and climb the
            rankings!
          </p>
        </div>

        {/* Navigation / Trust Links */}
        <div>
          <h4 className="font-heading text-lg mb-3">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h4 className="font-heading text-lg mb-3">Follow</h4>
          <div className="flex space-x-4">
            <a
              href="https://www.youtube.com/@jaysvirtualquiz"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="hover:text-red-400"
            >
              <FaYoutube size={28} />
            </a>
            <a
              href="https://www.instagram.com/thevirtualpubquiz/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-pink-400"
            >
              <FaInstagram size={28} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-purple-700 text-center text-xs py-4 text-purple-200">
        © {currentYear} Jay’s Quiz Hub — All Rights Reserved
      </div>
    </footer>
  );
}

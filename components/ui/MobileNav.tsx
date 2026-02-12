"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdMenu, MdClose } from "react-icons/md";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function MobileNav({ links }: { links: NavLink[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="qhl-btn-secondary fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full p-0 shadow-2xl md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <MdClose className="text-2xl mx-auto" />
        ) : (
          <MdMenu className="text-2xl mx-auto" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 transform transition-transform duration-300 md:hidden ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="qhl-card mx-4 mb-4 p-2 rounded-t-3xl">
          <div className="grid grid-cols-3 gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-4 transition-all ${
                    isActive
                      ? "bg-yellow-400/20 text-yellow-400"
                      : "text-violet-100/80 hover:bg-violet-300/10"
                  }`}
                >
                  <span className="text-2xl">{link.icon}</span>
                  <span className="text-xs font-semibold">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Navigation - Optional */}
      <nav className="hidden md:block qhl-card p-4 mb-6">
        <div className="flex gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all ${
                  isActive
                    ? "bg-yellow-400/20 text-yellow-400"
                    : "text-violet-100/80 hover:bg-violet-300/10"
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span className="font-semibold">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

"use client";
import { useState, useEffect } from "react";
import { GiPodiumWinner, GiHamburgerMenu } from "react-icons/gi";
import { MdOutlineClose } from "react-icons/md";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/app/firebase/config";
import MenuItems from "./MenuItems";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user);
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
      setUser(null); // Ensure the user state is updated
      setIsOpen(false); // Close the mobile menu
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleMenuItemClick = () => {
    setIsOpen(false); // Close the mobile menu
  };

  return (
    <header className="w-full">
      <nav className="sticky flex top-0 p-2 bg-gradient-to-t from-primary-900 to-primary-200 z-50">
        <div className="flex items-center p-2 gap-2">
          <GiPodiumWinner className="text-yellow-400 text-5xl" />
          <div className="font-bold text-2xl text-primary-100">
            Jay&apos;s Quiz Hub
          </div>
        </div>
        {/* Mobile Menu Button */}
        {!isOpen && (
          <div
            className="block lg:hidden ml-auto pr-4 my-auto cursor-pointer"
            onClick={toggleMenu}
          >
            <GiHamburgerMenu className="text-5xl text-primary" />
          </div>
        )}
        {/* Mobile Menu */}
        <div
          className={`lg:hidden fixed top-0 left-0 w-full h-full bg-gradient-to-t from-primary-200 to-primary-900 bg-opacity-90 z-60 transition-transform transform ${
            isOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="flex justify-end p-4">
            <MdOutlineClose
              className="text-5xl text-white cursor-pointer"
              onClick={toggleMenu}
            />
          </div>
          <div className="flex flex-col items-center mt-8 space-y-4">
            <MenuItems title="Home" href="/" onClick={handleMenuItemClick} />
            <MenuItems
              title="Quiz Recap"
              href="/quiz-recap"
              onClick={handleMenuItemClick}
            />
            <MenuItems title="JDQ" href="/jdq" onClick={handleMenuItemClick} />
            <MenuItems
              title="Leader Boards"
              href="/lb-select"
              onClick={handleMenuItemClick}
            />
            {user ? (
              <>
                <MenuItems
                  title="Add Score & Profile"
                  href="/profile"
                  onClick={handleMenuItemClick}
                />
                <MenuItems
                  title="Sign Out"
                  href="/"
                  onClick={() => {
                    handleSignOut();
                    handleMenuItemClick();
                  }}
                />
              </>
            ) : (
              <MenuItems
                title="Sign In"
                href="/sign-in"
                onClick={handleMenuItemClick}
              />
            )}
          </div>
        </div>
        {/* Desktop Menu */}
        <div className="hidden lg:flex flex-1 items-center justify-end">
          <MenuItems title="Home" href="/" />
          <MenuItems
            title="Quiz Recap"
            href="/quiz-recap"
            onClick={handleMenuItemClick}
          />
          <MenuItems title="JDQ" href="jdq" />
          <MenuItems title="Leader Boards" href="/lb-select" />

          {user ? (
            <>
              <MenuItems title="Add Score & Profile" href="/profile" />
              <MenuItems title="Sign Out" href="/" onClick={handleSignOut} />
            </>
          ) : (
            <MenuItems title="Sign In" href="/sign-in" />
          )}
        </div>
      </nav>
    </header>
  );
}

"use client";
import { useState, useEffect } from "react";
import { GiPodiumWinner, GiHamburgerMenu } from "react-icons/gi";
import { MdOutlineClose } from "react-icons/md";
import { supabase } from "@/supabaseClient";
import MenuItems from "./MenuItems";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let ignore = false;

    // Helper to fetch admin status
    const fetchAdmin = async (uid: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", uid)
        .single();
      if (!ignore) setIsAdmin(!!data?.is_admin);
    };

    // Initial fetch
    supabase.auth.getUser().then(({ data }) => {
      if (!ignore) setUser(data?.user || null);
      if (data?.user) fetchAdmin(data.user.id);
      else if (!ignore) setIsAdmin(false);
    });

    // Auth state change
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!ignore) setUser(session?.user || null);
        if (session?.user) fetchAdmin(session.user.id);
        else if (!ignore) setIsAdmin(false);
      }
    );

    return () => {
      ignore = true;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const toggleMenu = () => setIsOpen((v) => !v);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setIsOpen(false);
  };

  const handleMenuItemClick = () => setIsOpen(false);

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
            {!isAdmin && (
              <MenuItems
                title="JDQ"
                href="/jdq"
                onClick={handleMenuItemClick}
              />
            )}
            <MenuItems
              title="Leader Boards"
              href="/lb-select"
              onClick={handleMenuItemClick}
            />
            {user ? (
              <>
                {isAdmin && (
                  <MenuItems
                    title="Admin"
                    href="/admin"
                    onClick={handleMenuItemClick}
                  />
                )}
                {!isAdmin && (
                  <MenuItems
                    title="Add Score & Profile"
                    href="/profile"
                    onClick={handleMenuItemClick}
                  />
                )}
                {!isAdmin && (
                  <MenuItems
                    title="Contact Us"
                    href="/contact"
                    onClick={handleMenuItemClick}
                  />
                )}
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
                href="/auth"
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
          {!isAdmin && <MenuItems title="JDQ" href="/jdq" />}
          <MenuItems title="Leader Boards" href="/lb-select" />

          {user ? (
            <>
              {isAdmin && <MenuItems title="Admin" href="/admin" />}
              {!isAdmin && (
                <MenuItems title="Add Score & Profile" href="/profile" />
              )}
              {!isAdmin && <MenuItems title="Contact Us!" href="/contact" />}
              <MenuItems title="Sign Out" href="/" onClick={handleSignOut} />
            </>
          ) : (
            <MenuItems title="Sign In" href="/auth" />
          )}
        </div>
      </nav>
    </header>
  );
}

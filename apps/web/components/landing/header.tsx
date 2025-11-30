"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Brain, Github, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

const navItems = [
  {
    name: "Features",
    link: "#features",
  },
  {
    name: "Team",
    link: "#team",
  },
  {
    name: "GitHub",
    link: "https://github.com/3xCaffeine/total-recall",
    icon: <Github className="size-4" />,
  },
];

function Logo() {
  return (
    <Link href="/" className="relative z-20 flex items-center gap-2.5 px-2 py-1">
      <div className="flex size-8 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
        <Brain className="size-4" />
      </div>
      <span className="font-medium text-black dark:text-white">Total Recall</span>
    </Link>
  );
}

function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="size-9" />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`relative size-9 flex items-center justify-center rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${className}`}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="size-5" />
      ) : (
        <Moon className="size-5" />
      )}
    </button>
  );
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <Logo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NavbarButton variant="secondary" href="/login">
              Sign In
            </NavbarButton>
            <NavbarButton variant="dark" href="/login">
              Get Started
            </NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <Logo />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4 pt-4">
              <NavbarButton
                variant="secondary"
                href="/login"
                className="w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </NavbarButton>
              <NavbarButton
                variant="dark"
                href="/login"
                className="w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Get Started
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}

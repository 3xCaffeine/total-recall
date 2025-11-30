"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Github } from "lucide-react";
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

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <Logo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
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
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
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

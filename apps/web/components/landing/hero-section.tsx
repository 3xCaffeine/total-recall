"use client";

import Link from "next/link";
import { Brain, ArrowRight, Calendar, Sparkles, Shield, MessageSquare, Timer, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { HoverEffect } from "@/components/ui/card-hover-effect";

const features = [
  {
    title: "Calendar Sync",
    description:
      "Connect your Google Calendar and manage events seamlessly. View, create, and edit events directly from Total Recall. Never miss an important meeting or deadline again.",
    icon: <Calendar className="size-8 text-primary" />,
    link: "#",
  },
  {
    title: "Smart Journal",
    description:
      "Capture thoughts with AI-powered insights and organization. Your journal entries are analyzed to surface patterns, connections, and actionable insights from your daily reflections.",
    icon: <Brain className="size-8 text-primary" />,
    link: "#",
  },
  {
    title: "Knowledge Graph",
    description:
      "Visualize connections between your ideas and memories. See how your thoughts, notes, and events interconnect in a beautiful, interactive graph that evolves with you.",
    icon: <Sparkles className="size-8 text-primary" />,
    link: "#",
  },
  {
    title: "Focus Timer",
    description:
      "Stay productive with built-in pomodoro sessions. Track your focus time, take mindful breaks, and build consistent work habits with ambient weather backgrounds.",
    icon: <Timer className="size-8 text-primary" />,
    link: "#",
  },
  {
    title: "AI Chat",
    description:
      "Ask questions about your notes and get instant answers. Chat with your second brain to recall information, find connections, and generate insights from your personal knowledge base.",
    icon: <MessageSquare className="size-8 text-primary" />,
    link: "#",
  },
  {
    title: "Private & Secure",
    description:
      "Your data stays yours. Encrypted and protected. We believe your thoughts and memories are deeply personal—that's why security and privacy are at the core of everything we build.",
    icon: <Shield className="size-8 text-primary" />,
    link: "#",
  },
];

const teamMembers = [
  {
    name: "Shopno Banerjee",
    role: "Creator",
    linkedin: "https://www.linkedin.com/in/shopno-banerjee/",
    image: "/shopno.jpeg",
  },
  {
    name: "Vaibhav Singh",
    role: "Creator",
    linkedin: "https://www.linkedin.com/in/monkeplication/",
    image: "/vaibhav.jpeg",
  },
  {
    name: "V. Vinayak",
    role: "Creator",
    linkedin: "https://www.linkedin.com/in/v-vinayak/",
    image: "/vinayak.jpeg",
  },
  {
    name: "Shourya Merchant",
    role: "Creator",
    linkedin: "https://www.linkedin.com/in/shourya-merchant/",
    image: "/merchant.jpeg",
  },
];

export function HeroSection() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-auto w-full flex-col items-start justify-start overflow-hidden">
        <BackgroundRippleEffect rows={6} />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-2xl px-6 text-center pt-24">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm backdrop-blur-sm">
            <Brain className="size-4 text-primary" />
            <span className="text-muted-foreground">Your second brain</span>
          </div>

          <h1 className="mb-6 text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
            Never forget
            <br />
            <span className="text-muted-foreground">a thing</span>
          </h1>

          <p className="mx-auto mb-10 max-w-md text-lg text-muted-foreground">
            Journal your thoughts. Manage your time.
            <br />
            All in one place.
          </p>

          <Link href="/login">
            <Button size="lg" className="h-12 gap-2 px-8 text-base">
              Get Started
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full mt-24">
        <div className="mx-auto max-w-full px-6">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need
            </h2>
            <p className="mx-auto max-w-md text-muted-foreground">
              Simple tools to help you remember and organize your life.
            </p>
          </div>
        </div>
        <HoverEffect items={features} />
      </section>

      {/* Team Section */}
      <section id="team" className="border-t border-border/40 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built by
          </h2>
          <p className="mb-12 text-muted-foreground">
            A small team passionate about productivity and memory.
          </p>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {teamMembers.map((member) => (
              <TeamMember
                key={member.name}
                name={member.name}
                role={member.role}
                linkedin={member.linkedin}
                image={member.image}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function TeamMember({ name, role, linkedin, image }: { name: string; role: string; linkedin: string; image: string }) {
  return (
    <a
      href={linkedin}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-3 transition-transform hover:-translate-y-1"
    >
      <div className="relative overflow-hidden rounded-full bg-muted transition-colors group-hover:bg-primary/10">
        <Avatar className="size-24">
          <AvatarImage src={image} alt={name} className="object-fill" />
          <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-background shadow-sm">
          <Linkedin className="size-3 text-muted-foreground group-hover:text-primary" />
        </div>
      </div>
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
      </div>
    </a>
  );
}

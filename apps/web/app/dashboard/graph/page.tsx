"use client";

import dynamic from "next/dynamic";
import { JournalHeader } from "@/components/journal";

// Dynamic import to avoid SSR issues with sigma.js
const KnowledgeGraphVisualizer = dynamic(
  () =>
    import("@/components/graph/knowledge-graph-visualizer").then(
      (mod) => mod.KnowledgeGraphVisualizer
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-64 h-64 rounded-full bg-muted animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse absolute top-4 right-4" />
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse absolute bottom-8 left-2" />
            <div className="w-20 h-20 rounded-full bg-muted animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse absolute top-8 left-8" />
            <div className="w-14 h-14 rounded-full bg-muted animate-pulse absolute bottom-4 right-8" />
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">
            Loading knowledge graph...
          </p>
        </div>
      </div>
    ),
  }
);

export default function GraphPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <JournalHeader title="Knowledge Graph" />

      {/* Main Graph Area - Full screen */}
      <main className="flex-1 overflow-hidden">
        <KnowledgeGraphVisualizer className="w-full h-full" />
      </main>
    </div>
  );
}

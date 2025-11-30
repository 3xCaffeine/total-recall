import { NextResponse } from "next/server";

// Types for graph data
export interface GraphNode {
  id: string;
  name: string;
  type: 'JournalEntry' | 'JournalChunk' | 'Concept' | 'Entity' | 'Project' | 'Task' | 'Person' | 'Tag';
  val: number;
  color?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  metadata?: Record<string, unknown>;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'HAS_CHUNK' | 'MENTIONS_ENTITY' | 'CONTAINS_TASK' | 'PART_OF_PROJECT' | 'RELATED_TO';
  relationshipType?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Sample data for demonstration - replace with actual database queries
const sampleGraphData: GraphData = {
  nodes: [
    // Journal Entries
    {
      id: "entry_1",
      name: "My Day at the AI Conference",
      type: "JournalEntry",
      val: 12,
      metadata: { date: "2024-11-28", wordCount: 1500 }
    },
    {
      id: "entry_2",
      name: "Learning React Server Components",
      type: "JournalEntry",
      val: 10,
      metadata: { date: "2024-11-27", wordCount: 1200 }
    },
    {
      id: "entry_3",
      name: "Planning Q4 Goals",
      type: "JournalEntry",
      val: 8,
      metadata: { date: "2024-11-26", wordCount: 800 }
    },
    {
      id: "entry_4",
      name: "Coffee Chat with Sarah",
      type: "JournalEntry",
      val: 6,
      metadata: { date: "2024-11-25", wordCount: 600 }
    },
    {
      id: "entry_5",
      name: "Deep Work Session on Graph Viz",
      type: "JournalEntry",
      val: 9,
      metadata: { date: "2024-11-24", wordCount: 950 }
    },

    // Journal Chunks
    {
      id: "chunk_1",
      name: "AI keynote highlights",
      type: "JournalChunk",
      val: 4,
    },
    {
      id: "chunk_2",
      name: "RSC performance insights",
      type: "JournalChunk",
      val: 4,
    },
    {
      id: "chunk_3",
      name: "Q4 OKR definitions",
      type: "JournalChunk",
      val: 4,
    },

    // Concepts
    {
      id: "concept_ai",
      name: "Artificial Intelligence",
      type: "Concept",
      val: 15,
    },
    {
      id: "concept_ml",
      name: "Machine Learning",
      type: "Concept",
      val: 12,
    },
    {
      id: "concept_llm",
      name: "Large Language Models",
      type: "Concept",
      val: 10,
    },
    {
      id: "concept_react",
      name: "React",
      type: "Concept",
      val: 11,
    },
    {
      id: "concept_nextjs",
      name: "Next.js",
      type: "Concept",
      val: 9,
    },
    {
      id: "concept_productivity",
      name: "Productivity",
      type: "Concept",
      val: 8,
    },

    // Entities
    {
      id: "entity_openai",
      name: "OpenAI",
      type: "Entity",
      val: 8,
    },
    {
      id: "entity_vercel",
      name: "Vercel",
      type: "Entity",
      val: 7,
    },

    // Projects
    {
      id: "project_total_recall",
      name: "Total Recall App",
      type: "Project",
      val: 14,
      metadata: { status: "active", progress: 65 }
    },
    {
      id: "project_blog",
      name: "Personal Blog",
      type: "Project",
      val: 8,
      metadata: { status: "active", progress: 30 }
    },

    // Tasks
    {
      id: "task_1",
      name: "Implement graph visualization",
      type: "Task",
      val: 7,
      status: "IN_PROGRESS",
    },
    {
      id: "task_2",
      name: "Write blog post about AI conference",
      type: "Task",
      val: 5,
      status: "OPEN",
    },
    {
      id: "task_3",
      name: "Review Q4 OKRs with team",
      type: "Task",
      val: 6,
      status: "COMPLETED",
    },
    {
      id: "task_4",
      name: "Update portfolio website",
      type: "Task",
      val: 4,
      status: "OPEN",
    },

    // People
    {
      id: "person_sarah",
      name: "Sarah Chen",
      type: "Person",
      val: 7,
      metadata: { relationship: "colleague" }
    },
    {
      id: "person_alex",
      name: "Alex Rivera",
      type: "Person",
      val: 6,
      metadata: { relationship: "mentor" }
    },

    // Tags
    {
      id: "tag_tech",
      name: "#technology",
      type: "Tag",
      val: 10,
    },
    {
      id: "tag_learning",
      name: "#learning",
      type: "Tag",
      val: 8,
    },
    {
      id: "tag_work",
      name: "#work",
      type: "Tag",
      val: 9,
    },
    {
      id: "tag_ideas",
      name: "#ideas",
      type: "Tag",
      val: 6,
    },
  ],
  links: [
    // Entry 1 connections (AI Conference)
    { source: "entry_1", target: "chunk_1", type: "HAS_CHUNK" },
    { source: "entry_1", target: "concept_ai", type: "MENTIONS_ENTITY" },
    { source: "entry_1", target: "concept_ml", type: "MENTIONS_ENTITY" },
    { source: "entry_1", target: "concept_llm", type: "MENTIONS_ENTITY" },
    { source: "entry_1", target: "entity_openai", type: "MENTIONS_ENTITY" },
    { source: "entry_1", target: "task_2", type: "CONTAINS_TASK" },
    { source: "entry_1", target: "tag_tech", type: "RELATED_TO" },
    { source: "entry_1", target: "tag_learning", type: "RELATED_TO" },

    // Entry 2 connections (React Server Components)
    { source: "entry_2", target: "chunk_2", type: "HAS_CHUNK" },
    { source: "entry_2", target: "concept_react", type: "MENTIONS_ENTITY" },
    { source: "entry_2", target: "concept_nextjs", type: "MENTIONS_ENTITY" },
    { source: "entry_2", target: "entity_vercel", type: "MENTIONS_ENTITY" },
    { source: "entry_2", target: "project_total_recall", type: "PART_OF_PROJECT" },
    { source: "entry_2", target: "tag_tech", type: "RELATED_TO" },

    // Entry 3 connections (Q4 Goals)
    { source: "entry_3", target: "chunk_3", type: "HAS_CHUNK" },
    { source: "entry_3", target: "concept_productivity", type: "MENTIONS_ENTITY" },
    { source: "entry_3", target: "task_3", type: "CONTAINS_TASK" },
    { source: "entry_3", target: "tag_work", type: "RELATED_TO" },
    { source: "entry_3", target: "person_alex", type: "MENTIONS_ENTITY" },

    // Entry 4 connections (Coffee Chat)
    { source: "entry_4", target: "person_sarah", type: "MENTIONS_ENTITY" },
    { source: "entry_4", target: "concept_ai", type: "MENTIONS_ENTITY" },
    { source: "entry_4", target: "tag_work", type: "RELATED_TO" },

    // Entry 5 connections (Graph Viz)
    { source: "entry_5", target: "project_total_recall", type: "PART_OF_PROJECT" },
    { source: "entry_5", target: "task_1", type: "CONTAINS_TASK" },
    { source: "entry_5", target: "concept_react", type: "MENTIONS_ENTITY" },
    { source: "entry_5", target: "tag_ideas", type: "RELATED_TO" },

    // Concept relationships
    { source: "concept_ai", target: "concept_ml", type: "RELATED_TO" },
    { source: "concept_ml", target: "concept_llm", type: "RELATED_TO" },
    { source: "concept_react", target: "concept_nextjs", type: "RELATED_TO" },

    // Project-Task relationships
    { source: "project_total_recall", target: "task_1", type: "CONTAINS_TASK" },
    { source: "project_blog", target: "task_2", type: "CONTAINS_TASK" },
    { source: "project_blog", target: "task_4", type: "CONTAINS_TASK" },

    // Entity relationships
    { source: "entity_openai", target: "concept_llm", type: "RELATED_TO" },
    { source: "entity_vercel", target: "concept_nextjs", type: "RELATED_TO" },

    // Person relationships
    { source: "person_sarah", target: "concept_ai", type: "RELATED_TO" },
    { source: "person_alex", target: "concept_productivity", type: "RELATED_TO" },
  ],
};

export async function GET() {
  try {
    // TODO: Replace with actual database query
    // This is sample data for demonstration
    
    // Simulate network delay for realistic loading state
    // await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(sampleGraphData);
  } catch (error) {
    console.error("Error fetching graph data:", error);
    return NextResponse.json(
      { error: "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}

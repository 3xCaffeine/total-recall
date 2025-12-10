import { NextResponse } from "next/server";

// Types for graph data
export interface GraphNode {
  id: string;
  name: string;
  type: 'JournalEntry' | 'JournalChunk' | 'Concept' | 'Entity' | 'Project' | 'Task' | 'Person' | 'Tag' | 'Event';
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

export async function GET() {
  try {
    // Fetch data from backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/v1/graph/`);
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }
    
    const backendData = await response.json();
    
    // Transform backend data to frontend format
    const transformedNodes: GraphNode[] = backendData.nodes.map((node: any) => {
      let name = '';
      let val = 5; // default value
      let color: string | undefined;
      let status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | undefined;
      
      // Determine name based on type and metadata
      switch (node.type) {
        case 'JournalEntry':
          name = node.metadata?.title || node.metadata?.content?.substring(0, 50) + '...' || 'Journal Entry';
          val = 12;
          break;
        case 'Entity':
          name = node.metadata?.name || 'Unknown Entity';
          val = 8;
          break;
        case 'Todo':
          name = node.metadata?.task || 'Task';
          val = 7;
          status = node.metadata?.priority === 'must_do' ? 'OPEN' : 'IN_PROGRESS';
          break;
        case 'Event':
          name = node.metadata?.title || 'Event';
          val = 9;
          break;
        default:
          name = node.label || node.type;
          val = 5;
      }
      
      return {
        id: node.id,
        name,
        type: mapBackendTypeToFrontend(node.type),
        val,
        color,
        status,
        metadata: node.metadata,
      };
    });
    
    const transformedLinks: GraphLink[] = backendData.edges.map((edge: any) => ({
      source: edge.source,
      target: edge.target,
      type: mapEdgeType(edge.type),
      relationshipType: edge.properties?.type || edge.type,
    }));
    
    return NextResponse.json({
      nodes: transformedNodes,
      links: transformedLinks,
    });
  } catch (error) {
    console.error("Error fetching graph data:", error);
    return NextResponse.json(
      { error: "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}

// Helper function to map backend types to frontend types
function mapBackendTypeToFrontend(backendType: string): GraphNode['type'] {
  switch (backendType) {
    case 'JournalEntry':
      return 'JournalEntry';
    case 'Entity':
      return 'Entity';
    case 'Todo':
      return 'Task';
    case 'Event':
      return 'Event';
    default:
      return 'Concept'; // fallback
  }
}

// Helper function to map edge types
function mapEdgeType(edgeType: string): GraphLink['type'] {
  switch (edgeType) {
    case 'HAS_ENTITY':
      return 'MENTIONS_ENTITY';
    case 'HAS_TODO':
      return 'CONTAINS_TASK';
    case 'HAS_EVENT':
      return 'MENTIONS_ENTITY'; // Events are related to entities
    case 'RELATED_TO':
      return 'RELATED_TO';
    default:
      return 'RELATED_TO';
  }
}

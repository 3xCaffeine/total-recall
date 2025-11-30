"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Graph from "graphology";
import {
  SigmaContainer,
  useRegisterEvents,
  useSigma,
  useLoadGraph,
  ControlsContainer,
  ZoomControl,
  FullScreenControl,
} from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { GraphControls } from "./graph-controls";
import { NodeDetailPanel } from "./node-detail-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

// Types
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

// Color mappings for node types
const NODE_COLORS_LIGHT: Record<GraphNode['type'], string> = {
  JournalEntry: '#3B82F6',   // Vibrant blue
  JournalChunk: '#9CA3AF',   // Gray
  Concept: '#F87171',        // Soft coral
  Entity: '#FB923C',         // Orange
  Project: '#34D399',        // Green
  Task: '#FBBF24',           // Yellow
  Person: '#F472B6',         // Pink
  Tag: '#A78BFA',            // Purple
};

const NODE_COLORS_DARK: Record<GraphNode['type'], string> = {
  JournalEntry: '#60A5FA',   // Brighter blue
  JournalChunk: '#6B7280',   // Gray
  Concept: '#FCA5A5',        // Lighter coral
  Entity: '#FDBA74',         // Lighter orange
  Project: '#6EE7B7',        // Lighter green
  Task: '#FDE047',           // Brighter yellow
  Person: '#F9A8D4',         // Lighter pink
  Tag: '#C4B5FD',            // Lighter purple
};

// Graph events handler component
function GraphEvents({
  onNodeClick,
  onNodeHover,
  hoveredNode,
  selectedNode,
}: {
  onNodeClick: (nodeId: string | null) => void;
  onNodeHover: (nodeId: string | null) => void;
  hoveredNode: string | null;
  selectedNode: string | null;
}) {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();

  useEffect(() => {
    registerEvents({
      clickNode: (event) => {
        onNodeClick(event.node);
      },
      clickStage: () => {
        onNodeClick(null);
      },
      enterNode: (event) => {
        onNodeHover(event.node);
      },
      leaveNode: () => {
        onNodeHover(null);
      },
    });
  }, [registerEvents, onNodeClick, onNodeHover]);

  // Update node rendering based on hover/selection
  useEffect(() => {
    const graph = sigma.getGraph();

    graph.forEachNode((node) => {
      const nodeAttrs = graph.getNodeAttributes(node);
      const isHighlighted = node === hoveredNode || node === selectedNode;
      const isConnected = hoveredNode
        ? graph.hasEdge(hoveredNode, node) || graph.hasEdge(node, hoveredNode) || node === hoveredNode
        : true;

      graph.setNodeAttribute(node, "highlighted", isHighlighted);
      
      // Dim unconnected nodes when hovering
      if (hoveredNode) {
        graph.setNodeAttribute(
          node,
          "color",
          isConnected ? nodeAttrs.originalColor : `${nodeAttrs.originalColor}40`
        );
      } else {
        graph.setNodeAttribute(node, "color", nodeAttrs.originalColor);
      }
    });

    // Update edges
    graph.forEachEdge((edge) => {
      const source = graph.source(edge);
      const target = graph.target(edge);
      const isConnected = hoveredNode
        ? source === hoveredNode || target === hoveredNode
        : true;

      graph.setEdgeAttribute(
        edge,
        "color",
        isConnected ? graph.getEdgeAttribute(edge, "originalColor") : "#00000010"
      );
    });

    sigma.refresh();
  }, [sigma, hoveredNode, selectedNode]);

  return null;
}

// Graph loader component
function GraphLoader({
  data,
  isDarkMode,
}: {
  data: GraphData;
  isDarkMode: boolean;
}) {
  const loadGraph = useLoadGraph();
  const colors = isDarkMode ? NODE_COLORS_DARK : NODE_COLORS_LIGHT;
  const edgeColor = isDarkMode ? "#4B5563" : "#D1D5DB";

  useEffect(() => {
    const graph = new Graph();

    // Add nodes
    data.nodes.forEach((node, index) => {
      const color = colors[node.type];
      const angle = (2 * Math.PI * index) / data.nodes.length;
      const radius = 100 + Math.random() * 50;

      graph.addNode(node.id, {
        x: Math.cos(angle) * radius + Math.random() * 20,
        y: Math.sin(angle) * radius + Math.random() * 20,
        size: Math.max(8, Math.min(20, node.val * 1.5)),
        label: node.name,
        color: color,
        originalColor: color,
        nodeType: node.type,
        status: node.status,
        metadata: node.metadata,
        val: node.val,
      });
    });

    // Add edges
    data.links.forEach((link) => {
      if (graph.hasNode(link.source) && graph.hasNode(link.target)) {
        try {
          graph.addEdge(link.source, link.target, {
            size: 1,
            color: edgeColor,
            originalColor: edgeColor,
            edgeType: link.type,
            relationshipType: link.relationshipType,
          });
        } catch {
          // Edge might already exist
        }
      }
    });

    loadGraph(graph);
  }, [loadGraph, data, colors, edgeColor]);

  return null;
}

// Loading skeleton
function GraphSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Skeleton className="w-64 h-64 rounded-full" />
          <Skeleton className="w-16 h-16 rounded-full absolute top-4 right-4" />
          <Skeleton className="w-12 h-12 rounded-full absolute bottom-8 left-2" />
          <Skeleton className="w-20 h-20 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <Skeleton className="w-10 h-10 rounded-full absolute top-8 left-8" />
          <Skeleton className="w-14 h-14 rounded-full absolute bottom-4 right-8" />
        </div>
        <p className="text-muted-foreground text-sm animate-pulse">Loading knowledge graph...</p>
      </div>
    </div>
  );
}

// Error state
function GraphError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">Failed to load graph</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          There was an error loading your knowledge graph. Please try again.
        </p>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}

// Main component
export function KnowledgeGraphVisualizer({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [activeFilters, setActiveFilters] = useState<GraphNode['type'][]>([
    'JournalEntry', 'JournalChunk', 'Concept', 'Entity', 'Project', 'Task', 'Person', 'Tag'
  ]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch graph data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/graph-data');
      if (!response.ok) throw new Error('Failed to fetch');
      const graphData = await response.json();
      setData(graphData);
    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data based on active filters and search
  const filteredData = useMemo(() => {
    if (!data) return null;

    const searchLower = searchQuery.toLowerCase();
    const filteredNodes = data.nodes.filter((node) => {
      const matchesFilter = activeFilters.includes(node.type);
      const matchesSearch = searchQuery === "" || node.name.toLowerCase().includes(searchLower);
      return matchesFilter && matchesSearch;
    });

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = data.links.filter(
      (link) => filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [data, activeFilters, searchQuery]);

  // Get selected node data
  const selectedNodeData = useMemo(() => {
    if (!selectedNode || !data) return null;
    return data.nodes.find((n) => n.id === selectedNode) || null;
  }, [selectedNode, data]);

  // Get connections for selected node
  const selectedNodeConnections = useMemo(() => {
    if (!selectedNode || !data) return { incoming: [], outgoing: [] };
    
    const incoming = data.links
      .filter((l) => l.target === selectedNode)
      .map((l) => ({
        ...l,
        node: data.nodes.find((n) => n.id === l.source),
      }));
    
    const outgoing = data.links
      .filter((l) => l.source === selectedNode)
      .map((l) => ({
        ...l,
        node: data.nodes.find((n) => n.id === l.target),
      }));

    return { incoming, outgoing };
  }, [selectedNode, data]);

  // Sigma settings
  const sigmaSettings = useMemo(
    () => ({
      defaultNodeColor: isDarkMode ? "#60A5FA" : "#3B82F6",
      defaultEdgeColor: isDarkMode ? "#4B5563" : "#D1D5DB",
      labelColor: { color: isDarkMode ? "#E5E7EB" : "#374151" },
      labelFont: "Inter, system-ui, sans-serif",
      labelSize: 12,
      labelWeight: "500",
      labelDensity: 0.5,
      labelGridCellSize: 100,
      renderLabels: showLabels,
      renderEdgeLabels: false,
      enableEdgeEvents: true,
      nodeProgramClasses: {},
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
      defaultEdgeType: "line",
      zIndex: true,
    }),
    [isDarkMode, showLabels]
  );

  if (loading) {
    return <GraphSkeleton />;
  }

  if (error) {
    return <GraphError onRetry={fetchData} />;
  }

  if (!filteredData || filteredData.nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <p className="text-muted-foreground">No nodes to display</p>
          {searchQuery && (
            <Button
              variant="link"
              onClick={() => setSearchQuery("")}
              className="mt-2"
            >
              Clear search
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <SigmaContainer
        className="w-full h-full"
        style={{
          backgroundColor: isDarkMode ? "#111827" : "#F9FAFB",
        }}
        settings={sigmaSettings}
      >
        <GraphLoader data={filteredData} isDarkMode={isDarkMode} />
        <GraphEvents
          onNodeClick={setSelectedNode}
          onNodeHover={setHoveredNode}
          hoveredNode={hoveredNode}
          selectedNode={selectedNode}
        />
        
        <ControlsContainer position="bottom-left" className="!bg-transparent !shadow-none">
          <ZoomControl className="!bg-background/80 !backdrop-blur-sm !border !rounded-lg !shadow-md" />
          <FullScreenControl className="!bg-background/80 !backdrop-blur-sm !border !rounded-lg !shadow-md !mt-2" />
        </ControlsContainer>
      </SigmaContainer>

      {/* Graph Controls */}
      <GraphControls
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(!showLabels)}
        activeFilters={activeFilters}
        onFilterChange={setActiveFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        nodeTypes={data?.nodes.map((n) => n.type) || []}
      />

      {/* Node Detail Panel */}
      <NodeDetailPanel
        node={selectedNodeData}
        connections={selectedNodeConnections}
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

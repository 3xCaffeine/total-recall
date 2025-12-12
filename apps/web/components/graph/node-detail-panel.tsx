"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  FileText,
  Lightbulb,
  Building2,
  FolderKanban,
  CheckSquare,
  User,
  Tag,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Edit,
  Trash2,
  Link as LinkIcon,
  Circle,
  CircleDot,
  CheckCircle2,
  Calendar,
  LucideIcon,
} from "lucide-react";

import type { GraphNode, GraphLink } from "./knowledge-graph-visualizer";

// Color mappings
const NODE_COLORS_LIGHT: Record<GraphNode['type'], string> = {
  JournalEntry: '#3B82F6',
  JournalChunk: '#9CA3AF',
  Concept: '#F87171',
  Entity: '#FB923C',
  Project: '#34D399',
  Task: '#FBBF24',
  Person: '#F472B6',
  Tag: '#A78BFA',
  Event: '#10B981',
};

const NODE_COLORS_DARK: Record<GraphNode['type'], string> = {
  JournalEntry: '#60A5FA',
  JournalChunk: '#6B7280',
  Concept: '#FCA5A5',
  Entity: '#FDBA74',
  Project: '#6EE7B7',
  Task: '#FDE047',
  Person: '#F9A8D4',
  Tag: '#C4B5FD',
  Event: '#34D399',
};

// Icons for node types
const NODE_ICONS: Record<GraphNode['type'], LucideIcon> = {
  JournalEntry: BookOpen,
  JournalChunk: FileText,
  Concept: Lightbulb,
  Entity: Building2,
  Project: FolderKanban,
  Task: CheckSquare,
  Person: User,
  Tag: Tag,
  Event: Calendar,
};

// Task status icons
const TASK_STATUS_ICONS = {
  OPEN: Circle,
  IN_PROGRESS: CircleDot,
  COMPLETED: CheckCircle2,
};

const TASK_STATUS_COLORS = {
  OPEN: "text-yellow-500",
  IN_PROGRESS: "text-blue-500",
  COMPLETED: "text-green-500",
};

interface ConnectionWithNode extends GraphLink {
  node?: GraphNode;
}

interface NodeDetailPanelProps {
  node: GraphNode | null;
  connections: {
    incoming: ConnectionWithNode[];
    outgoing: ConnectionWithNode[];
  };
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

function formatRelationshipType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function NodeDetailPanel({
  node,
  connections,
  isOpen,
  onClose,
  isDarkMode,
}: NodeDetailPanelProps) {
  if (!node) return null;

  const colors = isDarkMode ? NODE_COLORS_DARK : NODE_COLORS_LIGHT;
  const nodeColor = colors[node.type];
  const NodeIcon = NODE_ICONS[node.type];
  const TaskStatusIcon = node.status ? TASK_STATUS_ICONS[node.status] : null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-hidden flex flex-col bg-background/95 p-0">
        <div className="px-5 pt-5 pb-3">
        <SheetHeader className="space-y-4">
          {/* Node Icon and Type Badge */}
          <div className="flex items-start justify-between gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border border-border/60 bg-muted/50"
              style={{ backgroundColor: `${nodeColor}20` }}
            >
              <NodeIcon className="w-6 h-6" color={nodeColor} />
            </div>
            <Badge
              variant="outline"
              className="font-medium tracking-tight"
              style={{
                borderColor: nodeColor,
                color: nodeColor,
              }}
            >
              {node.type}
            </Badge>
          </div>

          {/* Node Name */}
          <SheetTitle className="text-2xl font-semibold leading-tight pr-8 tracking-tight">
            {node.name}
          </SheetTitle>

          {/* Task Status (if applicable) */}
          {node.type === 'Task' && node.status && TaskStatusIcon && (
            <div className="flex items-center gap-2">
              <TaskStatusIcon
                className={`w-4 h-4 ${TASK_STATUS_COLORS[node.status]}`}
              />
              <span className="text-sm text-muted-foreground">
                {node.status.replace('_', ' ')}
              </span>
            </div>
          )}

          <SheetDescription className="text-sm text-muted-foreground leading-relaxed">
            {node.type === 'JournalEntry' && node.metadata?.date ? (
              <span>
                Created on{' '}
                {new Date(String(node.metadata.date)).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            ) : null}
            {node.type === 'Project' && node.metadata?.progress !== undefined ? (
              <span>Progress: {Number(node.metadata.progress)}%</span>
            ) : null}
            {node.type === 'Person' && node.metadata?.relationship ? (
              <span className="capitalize">{String(node.metadata.relationship)}</span>
            ) : null}
          </SheetDescription>
        </SheetHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-5 pb-6">
          {/* Journal entries keep a focused metadata block; other nodes stay minimal */}
          {node.type === 'JournalEntry' && node.metadata && Object.keys(node.metadata).length > 0 && (
            <div className="mt-1 mb-6 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.12em]">Journal entry</h4>
              <div className="rounded-xl border border-border/70 bg-card/70 p-4 space-y-3">
                {node.metadata.title && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Title</p>
                    <p className="text-sm font-medium leading-relaxed text-foreground/90">
                      {String(node.metadata.title)}
                    </p>
                  </div>
                )}
                {node.metadata.content && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Content</p>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {String(node.metadata.content)}
                    </p>
                  </div>
                )}
                {node.metadata.date && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium leading-relaxed text-foreground/90">
                      {new Date(String(node.metadata.date)).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Connections Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Connections ({connections.incoming.length + connections.outgoing.length})
            </h4>

            {/* Incoming Connections */}
            {connections.incoming.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <ArrowLeft className="w-3 h-3" />
                  Incoming ({connections.incoming.length})
                </h5>
                <div className="space-y-1">
                  {connections.incoming.map((conn, idx) => {
                    const ConnIcon = conn.node ? NODE_ICONS[conn.node.type] : LinkIcon;
                    const connColor = conn.node ? colors[conn.node.type] : '#888';
                    return (
                      <div
                        key={`in-${idx}`}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
                      >
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${connColor}20` }}
                        >
                          <ConnIcon className="w-3.5 h-3.5" style={{ color: connColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {conn.node?.name || conn.source}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelationshipType(conn.type)}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Outgoing Connections */}
            {connections.outgoing.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3" />
                  Outgoing ({connections.outgoing.length})
                </h5>
                <div className="space-y-1">
                  {connections.outgoing.map((conn, idx) => {
                    const ConnIcon = conn.node ? NODE_ICONS[conn.node.type] : LinkIcon;
                    const connColor = conn.node ? colors[conn.node.type] : '#888';
                    return (
                      <div
                        key={`out-${idx}`}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
                      >
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${connColor}20` }}
                        >
                          <ConnIcon className="w-3.5 h-3.5" style={{ color: connColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {conn.node?.name || conn.target}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelationshipType(conn.type)}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {connections.incoming.length === 0 && connections.outgoing.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No connections found
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-2">
            <LinkIcon className="w-4 h-4" />
            Link
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

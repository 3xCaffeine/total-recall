"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  Tags,
  X,
  BookOpen,
  FileText,
  Lightbulb,
  Building2,
  FolderKanban,
  CheckSquare,
  User,
  Tag,
  ChevronDown,
  ChevronUp,
  LucideIcon,
} from "lucide-react";

import type { GraphNode } from "./knowledge-graph-visualizer";

// Color mappings
const NODE_COLORS: Record<GraphNode['type'], string> = {
  JournalEntry: '#3B82F6',
  JournalChunk: '#9CA3AF',
  Concept: '#F87171',
  Entity: '#FB923C',
  Project: '#34D399',
  Task: '#FBBF24',
  Person: '#F472B6',
  Tag: '#A78BFA',
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
};

const NODE_TYPE_LABELS: Record<GraphNode['type'], string> = {
  JournalEntry: 'Journal Entries',
  JournalChunk: 'Chunks',
  Concept: 'Concepts',
  Entity: 'Entities',
  Project: 'Projects',
  Task: 'Tasks',
  Person: 'People',
  Tag: 'Tags',
};

interface GraphControlsProps {
  showLabels: boolean;
  onToggleLabels: () => void;
  activeFilters: GraphNode['type'][];
  onFilterChange: (filters: GraphNode['type'][]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  nodeTypes: GraphNode['type'][];
}

export function GraphControls({
  showLabels,
  onToggleLabels,
  activeFilters,
  onFilterChange,
  searchQuery,
  onSearchChange,
  nodeTypes,
}: GraphControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Get unique node types
  const uniqueTypes = Array.from(new Set(nodeTypes)) as GraphNode['type'][];

  const toggleFilter = (type: GraphNode['type']) => {
    if (activeFilters.includes(type)) {
      onFilterChange(activeFilters.filter((f) => f !== type));
    } else {
      onFilterChange([...activeFilters, type]);
    }
  };

  const selectAll = () => {
    onFilterChange([...uniqueTypes]);
  };

  const clearAll = () => {
    onFilterChange([]);
  };

  const activeFilterCount = activeFilters.length;
  const isAllSelected = activeFilterCount === uniqueTypes.length;

  return (
    <Card
      className={cn(
        "absolute top-4 right-4 z-10",
        "bg-background/80 backdrop-blur-md border shadow-lg",
        "transition-all duration-200 ease-in-out",
        isExpanded ? "w-72" : "w-auto"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Controls</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 pr-8 h-9 text-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => onSearchChange("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Labels Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-labels" className="text-sm cursor-pointer">
              Show Labels
            </Label>
            <Switch
              id="show-labels"
              checked={showLabels}
              onCheckedChange={onToggleLabels}
            />
          </div>

          <Separator />

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Tags className="w-3 h-3" />
                Filter by Type
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide" : "Show"}
                {!isAllSelected && (
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="space-y-2">
                {/* Quick actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={selectAll}
                    disabled={isAllSelected}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={clearAll}
                    disabled={activeFilterCount === 0}
                  >
                    Clear All
                  </Button>
                </div>

                {/* Type checkboxes */}
                <div className="grid grid-cols-2 gap-1.5">
                  {uniqueTypes.map((type) => {
                    const Icon = NODE_ICONS[type];
                    const color = NODE_COLORS[type];
                    const isActive = activeFilters.includes(type);

                    return (
                      <button
                        key={type}
                        onClick={() => toggleFilter(type)}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs",
                          "transition-colors duration-150",
                          "border",
                          isActive
                            ? "bg-primary/10 border-primary/30"
                            : "bg-transparent border-transparent hover:bg-muted/50"
                        )}
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isActive ? `${color}30` : `${color}15`,
                          }}
                        >
                          <Icon
                            className="w-2.5 h-2.5"
                            color={isActive ? color : `${color}80`}
                          />
                        </div>
                        <span
                          className={cn(
                            "truncate",
                            isActive ? "font-medium" : "text-muted-foreground"
                          )}
                        >
                          {NODE_TYPE_LABELS[type]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Summary */}
          {!showFilters && !isAllSelected && activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1">
              {activeFilters.slice(0, 3).map((type) => {
                const Icon = NODE_ICONS[type];
                const color = NODE_COLORS[type];
                return (
                  <Badge
                    key={type}
                    variant="outline"
                    className="h-5 text-[10px] gap-1 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleFilter(type)}
                  >
                    <Icon className="w-2.5 h-2.5" color={color} />
                    {NODE_TYPE_LABELS[type]}
                    <X className="w-2.5 h-2.5 ml-0.5" />
                  </Badge>
                );
              })}
              {activeFilterCount > 3 && (
                <Badge variant="secondary" className="h-5 text-[10px]">
                  +{activeFilterCount - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

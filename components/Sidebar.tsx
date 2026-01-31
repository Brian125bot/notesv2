"use client";

import { useState } from "react";
import { Lightbulb, Archive, Trash2, Tag, ChevronDown, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LabelManager } from "./labels/LabelManager";
import { LabelFilter } from "./labels/LabelFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SidebarProps {
  isOpen: boolean;
  currentView: "notes" | "archive" | "trash" | "labels";
  selectedLabelId: string | null;
  onViewChange: (view: "notes" | "archive" | "trash") => void;
  onLabelSelect: (labelId: string | null) => void;
  onLabelsChange?: () => void;
}

const menuItems = [
  { id: "notes" as const, label: "Notes", icon: Lightbulb },
  { id: "archive" as const, label: "Archive", icon: Archive },
];

export function Sidebar({
  isOpen,
  currentView,
  selectedLabelId,
  onViewChange,
  onLabelSelect,
  onLabelsChange,
}: SidebarProps) {
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [labelsExpanded, setLabelsExpanded] = useState(true);

  return (
    <>
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-200 z-20 ${
          isOpen ? "w-64" : "w-0 sm:w-16"
        } overflow-hidden`}
      >
        <ScrollArea className="h-full">
          <nav className="p-2">
            {/* Main menu */}
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id && !selectedLabelId;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    onLabelSelect(null);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-colors ${
                    isActive
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  } ${!isOpen && "sm:justify-center"}`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" fill={isActive ? "currentColor" : "none"} />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}

            {/* Labels section */}
            {isOpen && (
              <div className="mt-6">
                <button
                  onClick={() => setLabelsExpanded(!labelsExpanded)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  <span>Labels</span>
                  {labelsExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {labelsExpanded && (
                  <div className="mt-2 px-2">
                    <LabelFilter
                      selectedLabelId={selectedLabelId}
                      onSelectLabel={onLabelSelect}
                    />

                    <button
                      onClick={() => setShowLabelManager(true)}
                      className="w-full flex items-center gap-3 px-4 py-2 mt-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Tag className="h-4 w-4" />
                      Manage labels
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </ScrollArea>
      </aside>

      {/* Label Manager Dialog */}
      <Dialog open={showLabelManager} onOpenChange={setShowLabelManager}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Labels</DialogTitle>
          </DialogHeader>
          <LabelManager onLabelsChange={onLabelsChange} />
        </DialogContent>
      </Dialog>
    </>
  );
}

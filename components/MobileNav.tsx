"use client";

import { Lightbulb, Archive, Plus, Tag, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  currentView: "notes" | "archive" | "labels";
  onViewChange: (view: "notes" | "archive" | "labels") => void;
  onCreateNote: () => void;
}

export function MobileNav({ currentView, onViewChange, onCreateNote }: MobileNavProps) {
  const navItems = [
    { id: "notes" as const, label: "Notes", icon: Lightbulb },
    { id: "archive" as const, label: "Archive", icon: Archive },
    { id: "labels" as const, label: "Labels", icon: Tag },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={onCreateNote}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-amber-500 hover:bg-amber-600 z-40 sm:hidden"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 sm:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isActive ? "text-amber-500" : "text-gray-500"
                }`}
              >
                <Icon className="h-5 w-5" fill={isActive ? "currentColor" : "none"} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Safe area spacer for iOS */}
      <style jsx global>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </>
  );
}

"use client";

import { useState, useRef } from "react";
import { Menu, Search, RefreshCw, Wifi, WifiOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SyncStatus } from "./SyncStatus";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./search/SearchBar";
import type { User as UserType } from "better-auth";
import type { Note } from "@/types";

interface HeaderProps {
  user?: UserType | null;
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  syncError: string | null;
  onMenuClick: () => void;
  onRefresh: () => void;
  onRetrySync?: () => void;
  onLogout: () => void;
  onNoteSelect: (note: Note) => void;
}

export function Header({
  user,
  isOnline,
  isSyncing,
  pendingCount,
  lastSyncTime,
  syncError,
  onMenuClick,
  onRefresh,
  onRetrySync,
  onLogout,
  onNoteSelect,
}: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
                </svg>
              </div>
              <span className="text-xl font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
                Notes
              </span>
            </div>
          </div>

          {/* Search section */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <div
              className="relative cursor-pointer"
              onClick={() => setShowSearch(true)}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <div className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-gray-500 dark:text-gray-400">
                Search your notes
              </div>
            </div>
          </div>

          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 text-gray-600 dark:text-gray-300"
            onClick={() => setShowSearch(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-10 w-10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={onRefresh}
            >
              <RefreshCw className={`h-5 w-5 ${isSyncing ? "animate-spin" : ""}`} />
            </Button>

            {/* Sync Status */}
            <div className="hidden sm:block">
              <SyncStatus
                isOnline={isOnline}
                isSyncing={isSyncing}
                pendingCount={pendingCount}
                lastSyncTime={lastSyncTime}
                error={syncError}
                onRetry={onRetrySync}
              />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="flex flex-col items-start">
                  <span className="font-medium">{user?.name || "Guest"}</span>
                  <span className="text-sm text-gray-500">{user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Search</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSearch(false)}>
                ✕
              </Button>
            </div>
            <SearchBar
              onNoteSelect={(note) => {
                onNoteSelect(note);
                setShowSearch(false);
              }}
              onClose={() => setShowSearch(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

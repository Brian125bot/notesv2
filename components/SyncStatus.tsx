"use client";

import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SyncStatusProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  error: string | null;
  onRetry?: () => void;
}

export function SyncStatus({
  isOnline,
  isSyncing,
  pendingCount,
  lastSyncTime,
  error,
  onRetry,
}: SyncStatusProps) {
  // Format last sync time
  const formatLastSync = () => {
    if (!lastSyncTime) return "Never synced";

    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Get status icon and color
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: CloudOff,
        color: "text-red-500",
        bgColor: "bg-red-50",
        label: "Offline",
        description: "Changes saved locally",
      };
    }

    if (error) {
      return {
        icon: AlertCircle,
        color: "text-amber-500",
        bgColor: "bg-amber-50",
        label: "Sync Error",
        description: error,
      };
    }

    if (isSyncing) {
      return {
        icon: RefreshCw,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        label: "Syncing...",
        description: "Sending changes to server",
      };
    }

    if (pendingCount > 0) {
      return {
        icon: Cloud,
        color: "text-amber-500",
        bgColor: "bg-amber-50",
        label: `${pendingCount} pending`,
        description: "Waiting to sync",
      };
    }

    return {
      icon: Check,
      color: "text-green-500",
      bgColor: "bg-green-50",
      label: "Synced",
      description: `Last sync: ${formatLastSync()}`,
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-2 px-2 ${config.bgColor} hover:opacity-80`}
            onClick={error ? onRetry : undefined}
          >
            <Icon
              className={`h-4 w-4 ${config.color} ${
                isSyncing ? "animate-spin" : ""
              }`}
            />
            <span className={`text-xs ${config.color}`}>{config.label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-sm font-medium">{config.description}</p>
          {error && onRetry && (
            <p className="text-xs text-amber-600 mt-1">Click to retry</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact sync indicator for note cards
 */
export function NoteSyncIndicator({
  status,
}: {
  status: "synced" | "pending" | "error" | undefined;
}) {
  if (status === "pending") {
    return (
      <div className="absolute top-2 left-2">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="absolute top-2 left-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
      </div>
    );
  }

  return null;
}

/**
 * Offline banner shown when user goes offline
 */
export function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-100 border-t border-amber-200 px-4 py-2 z-50">
      <div className="flex items-center justify-center gap-2 text-amber-800">
        <CloudOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          You&apos;re offline. Changes will sync when you reconnect.
        </span>
      </div>
    </div>
  );
}

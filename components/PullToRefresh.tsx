"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  threshold?: number;
  maxPull?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPull = 120,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  useEffect(() => {
    // Only enable on touch devices
    if (typeof window === "undefined" || !("ontouchstart" in window)) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isAtTop() || isRefreshing) return;
      startY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop() || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && !isPulling) {
        setIsPulling(true);
      }

      if (isPulling) {
        // Apply resistance
        const resistedPull = Math.min(diff * 0.5, maxPull);
        setPullDistance(resistedPull);

        if (resistedPull > 0) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setIsPulling(false);
          setPullDistance(0);
        }
      } else {
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPulling, pullDistance, isRefreshing, maxPull, threshold, isAtTop, onRefresh]);

  // Calculate rotation based on pull distance
  const rotation = Math.min((pullDistance / threshold) * 360, 360);
  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center pointer-events-none"
        style={{
          height: `${pullDistance}px`,
          opacity,
          transform: `translateY(${pullDistance > 0 ? 0 : -100}px)`,
        }}
      >
        <div className="flex flex-col items-center">
          <RefreshCw
            className={`h-6 w-6 text-amber-500 ${isRefreshing ? "animate-spin" : ""}`}
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          />
          <span className="text-xs text-gray-500 mt-1">
            {isRefreshing ? "Syncing..." : pullDistance >= threshold ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}

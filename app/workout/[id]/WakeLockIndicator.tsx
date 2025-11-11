"use client"

import { useWakeLock } from "./useWakeLock"

/**
 * Visual indicator showing if screen wake lock is active
 * Shows a small badge when the lock is successfully acquired
 */
export function WakeLockIndicator({ enabled }: { enabled: boolean }) {
  const { isSupported, isActive } = useWakeLock(enabled)

  if (!enabled || !isSupported) return null

  return (
    <div
      className="fixed top-2 left-2 z-50 px-2 py-1 rounded-full text-[10px] font-mono transition-opacity"
      style={{
        backgroundColor: isActive ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 0, 0, 0.2)",
        color: isActive ? "#00ff00" : "#ff0000",
        border: `1px solid ${isActive ? "#00ff00" : "#ff0000"}`,
        opacity: 0.6,
      }}
    >
      {isActive ? "🔒 awake" : "💤 sleep"}
    </div>
  )
}


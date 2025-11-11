"use client"

import { useEffect, useRef } from "react"

/**
 * Hook for timers that continue working in background
 * Uses timestamps instead of intervals to prevent drift when app is backgrounded
 */
export function useBackgroundTimer(
  isActive: boolean,
  onTick: (elapsed: number) => void,
  intervalMs: number = 1000
) {
  const startTimeRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isActive) {
      startTimeRef.current = null
      lastTickRef.current = 0
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      return
    }

    // Set start time when timer becomes active
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now()
      lastTickRef.current = 0
    }

    const tick = () => {
      if (!startTimeRef.current) return

      const now = Date.now()
      const elapsed = Math.floor((now - startTimeRef.current) / intervalMs)

      // Only call onTick if we've crossed an interval boundary
      if (elapsed > lastTickRef.current) {
        lastTickRef.current = elapsed
        onTick(elapsed)
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [isActive, intervalMs, onTick])
}


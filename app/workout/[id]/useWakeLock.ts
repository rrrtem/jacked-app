"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Hook to keep screen awake during workout
 * Uses Screen Wake Lock API to prevent screen from sleeping
 */
export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    // Check if Wake Lock API is supported
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      setIsSupported(true)
    }
  }, [])

  useEffect(() => {
    if (!isSupported || !enabled) {
      return
    }

    const requestWakeLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen")
        setIsActive(true)
        console.log("Screen Wake Lock acquired")

        wakeLockRef.current.addEventListener("release", () => {
          console.log("Screen Wake Lock released")
          setIsActive(false)
        })
      } catch (err) {
        console.error("Error acquiring Wake Lock:", err)
        setIsActive(false)
      }
    }

    // Request wake lock
    requestWakeLock()

    // Re-request wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && enabled) {
        requestWakeLock()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null
          setIsActive(false)
        })
      }
    }
  }, [isSupported, enabled])

  return { isSupported, isActive }
}


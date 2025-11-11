"use client"

import { useEffect, useRef, useState } from "react"
import NoSleep from "nosleep.js"

/**
 * Component that prevents screen from sleeping
 * Uses NoSleep.js library which has multiple fallback strategies for iOS
 */
export function KeepAwake({ enabled }: { enabled: boolean }) {
  const noSleepRef = useRef<NoSleep | null>(null)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  // Initialize NoSleep instance
  useEffect(() => {
    if (typeof window === "undefined") return
    
    try {
      noSleepRef.current = new NoSleep()
      console.log("✅ NoSleep initialized")
    } catch (err) {
      console.error("❌ Failed to initialize NoSleep:", err)
    }

    return () => {
      if (noSleepRef.current?.isEnabled) {
        noSleepRef.current.disable()
      }
    }
  }, [])

  // Enable/disable NoSleep based on enabled prop
  useEffect(() => {
    if (!noSleepRef.current) return

    if (enabled && !noSleepRef.current.isEnabled) {
      // Try to enable immediately (might fail without user interaction)
      noSleepRef.current.enable()
        .then(() => {
          console.log("✅ NoSleep enabled successfully")
        })
        .catch((err) => {
          console.log("⚠️ NoSleep enable failed, waiting for user interaction:", err.message)
        })
    } else if (!enabled && noSleepRef.current.isEnabled) {
      noSleepRef.current.disable()
      console.log("⏸️ NoSleep disabled")
    }
  }, [enabled])

  // Enable NoSleep on first user interaction
  useEffect(() => {
    if (!enabled || hasUserInteracted || !noSleepRef.current) return

    const enableOnInteraction = () => {
      if (!noSleepRef.current) return

      noSleepRef.current.enable()
        .then(() => {
          console.log("✅ NoSleep enabled on user interaction")
          setHasUserInteracted(true)
        })
        .catch((err) => {
          console.error("❌ Failed to enable NoSleep on interaction:", err)
        })
    }

    // Listen for ANY user interaction
    const events = ['touchstart', 'touchend', 'click', 'keydown', 'mousedown']
    events.forEach(event => {
      document.addEventListener(event, enableOnInteraction, { once: true, passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, enableOnInteraction)
      })
    }
  }, [enabled, hasUserInteracted])

  // Handle visibility change
  useEffect(() => {
    if (!enabled || !noSleepRef.current) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && noSleepRef.current && !noSleepRef.current.isEnabled) {
        noSleepRef.current.enable()
          .then(() => {
            console.log("✅ NoSleep re-enabled after visibility change")
          })
          .catch((err) => console.log("⚠️ Failed to re-enable NoSleep:", err.message))
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled])

  return null
}


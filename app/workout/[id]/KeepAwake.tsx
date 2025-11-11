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
  const [isActive, setIsActive] = useState(false)
  const [lastCheck, setLastCheck] = useState<string>("")
  const [error, setError] = useState<string>("")

  // Initialize NoSleep instance
  useEffect(() => {
    if (typeof window === "undefined") return
    
    try {
      noSleepRef.current = new NoSleep()
      console.log("✅ NoSleep initialized")
    } catch (err) {
      console.error("❌ Failed to initialize NoSleep:", err)
      setError("Init failed")
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
          setIsActive(true)
          setLastCheck(new Date().toLocaleTimeString())
        })
        .catch((err) => {
          console.log("⚠️ NoSleep enable failed, waiting for user interaction:", err.message)
          setError("Need tap")
        })
    } else if (!enabled && noSleepRef.current.isEnabled) {
      noSleepRef.current.disable()
      setIsActive(false)
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
          setIsActive(true)
          setLastCheck(new Date().toLocaleTimeString())
          setError("")
        })
        .catch((err) => {
          console.error("❌ Failed to enable NoSleep on interaction:", err)
          setError("Failed to enable")
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
            setIsActive(true)
            setLastCheck(new Date().toLocaleTimeString())
          })
          .catch((err) => console.log("⚠️ Failed to re-enable NoSleep:", err.message))
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled])

  // Periodic status check
  useEffect(() => {
    if (!enabled || !noSleepRef.current) return

    const checkStatus = setInterval(() => {
      if (noSleepRef.current?.isEnabled) {
        setLastCheck(new Date().toLocaleTimeString())
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(checkStatus)
  }, [enabled])

  return (
    <>
      {/* Debug indicator - shows NoSleep status */}
      {enabled && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            fontFamily: "monospace",
            fontWeight: "bold",
            zIndex: 9999,
            backgroundColor: isActive 
              ? "rgba(0, 255, 0, 0.15)" 
              : hasUserInteracted 
                ? "rgba(255, 165, 0, 0.15)"
                : "rgba(255, 0, 0, 0.15)",
            color: isActive 
              ? "#00ff00" 
              : hasUserInteracted 
                ? "#ffa500"
                : "#ff0000",
            border: `1px solid ${isActive ? "#00ff00" : hasUserInteracted ? "#ffa500" : "#ff0000"}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            pointerEvents: "none",
          }}
        >
          {isActive ? (
            <>🔒 AWAKE {lastCheck && `(${lastCheck})`}</>
          ) : error ? (
            <>❌ {error.toUpperCase()}</>
          ) : hasUserInteracted ? (
            <>⚠️ PAUSED - TAP AGAIN</>
          ) : (
            <>❌ TAP SCREEN TO START</>
          )}
        </div>
      )}
    </>
  )
}


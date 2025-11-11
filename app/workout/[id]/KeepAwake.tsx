"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Component that prevents screen from sleeping by playing an invisible video
 * This is a fallback/reliable solution that works on all iOS versions
 */
export function KeepAwake({ enabled }: { enabled: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [lastCheck, setLastCheck] = useState<string>("")

  // Aggressive video start on mount and when enabled
  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current

    if (enabled) {
      // Try to start immediately
      const attemptPlay = () => {
        video.play()
          .then(() => {
            console.log("✅ KeepAwake: Video started successfully")
          })
          .catch((err) => {
            console.log("⚠️ KeepAwake: Video play failed, will retry on interaction:", err.message)
          })
      }

      attemptPlay()
      
      // Also try after a short delay
      const timeout = setTimeout(attemptPlay, 100)
      
      return () => clearTimeout(timeout)
    } else {
      video.pause()
      console.log("⏸️ KeepAwake: Video paused")
    }
  }, [enabled])

  // Ensure video starts on ANY user interaction (iOS requirement)
  useEffect(() => {
    if (!enabled || hasUserInteracted) return

    const startVideoOnInteraction = () => {
      if (videoRef.current) {
        videoRef.current.play()
          .then(() => {
            console.log("✅ KeepAwake: Video started on user interaction")
            setHasUserInteracted(true)
          })
          .catch((err) => {
            console.log("❌ KeepAwake: Failed to start video on interaction:", err.message)
          })
      }
    }

    // Listen for ANY user interaction
    const events = ['touchstart', 'touchend', 'click', 'keydown', 'mousedown']
    events.forEach(event => {
      document.addEventListener(event, startVideoOnInteraction, { once: true, passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, startVideoOnInteraction)
      })
    }
  }, [enabled, hasUserInteracted])

  // Handle visibility change - restart video when page becomes visible
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && videoRef.current) {
        videoRef.current.play()
          .then(() => console.log("✅ KeepAwake: Video restarted after visibility change"))
          .catch((err) => console.log("⚠️ KeepAwake: Failed to restart video:", err.message))
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled])

  // Keep video alive with periodic checks
  useEffect(() => {
    if (!enabled) return

    const keepAlive = setInterval(() => {
      if (videoRef.current && videoRef.current.paused) {
        console.log("🔄 KeepAwake: Video paused, restarting...")
        videoRef.current.play().catch((err) => {
          console.log("⚠️ KeepAwake: Periodic restart failed:", err.message)
        })
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(keepAlive)
  }, [enabled])

  // Minimal 1-second black video encoded as base64 (very small file)
  // This is a 1x1 pixel, 1 second, silent video
  const videoDataUrl = "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTYgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAA2mWIhAA3//728P4FNjuZQQmiHCN2QAAAAwAAAwAAJgn0IQBBk2AAALQAAAMAAAMAACoCAA+CAAAARkGaJGxDP/6eEAAAHEAAAAKgAAAACKhgAAAP4PIAAA0wFIQBDcAA//v+95dv74//8SAjCYhAAPz/AL4AvsC+AAA="

  return (
    <>
      <video
        ref={videoRef}
        src={videoDataUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        // @ts-ignore - webkit prefix for older iOS
        webkit-playsinline="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
        aria-hidden="true"
        onPlay={() => {
          console.log("🎬 KeepAwake: Video playing")
          setIsPlaying(true)
          setLastCheck(new Date().toLocaleTimeString())
        }}
        onPause={() => {
          console.log("⏸️ KeepAwake: Video paused")
          setIsPlaying(false)
        }}
        onEnded={() => {
          console.log("🔁 KeepAwake: Video ended (should loop)")
        }}
      />
      
      {/* Debug indicator - shows video status */}
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
            backgroundColor: isPlaying 
              ? "rgba(0, 255, 0, 0.15)" 
              : hasUserInteracted 
                ? "rgba(255, 165, 0, 0.15)"
                : "rgba(255, 0, 0, 0.15)",
            color: isPlaying 
              ? "#00ff00" 
              : hasUserInteracted 
                ? "#ffa500"
                : "#ff0000",
            border: `1px solid ${isPlaying ? "#00ff00" : hasUserInteracted ? "#ffa500" : "#ff0000"}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            pointerEvents: "none",
          }}
        >
          {isPlaying ? (
            <>🔒 AWAKE {lastCheck && `(${lastCheck})`}</>
          ) : hasUserInteracted ? (
            <>⚠️ PAUSED - TAP SCREEN</>
          ) : (
            <>❌ WAITING - TAP SCREEN</>
          )}
        </div>
      )}
    </>
  )
}


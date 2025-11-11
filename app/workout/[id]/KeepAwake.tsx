"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Component that prevents screen from sleeping by playing an invisible video
 * This is a fallback/reliable solution that works on all iOS versions
 */
export function KeepAwake({ enabled }: { enabled: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  // Try to start video when enabled changes
  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current

    if (enabled) {
      // Start playing the video
      video.play().catch((err) => {
        console.log("Video play failed (expected on first load):", err)
      })
    } else {
      // Stop the video
      video.pause()
    }
  }, [enabled])

  // Ensure video starts on first user interaction (iOS requirement)
  useEffect(() => {
    if (!enabled || hasUserInteracted) return

    const startVideoOnInteraction = () => {
      if (videoRef.current) {
        videoRef.current.play().catch((err) => {
          console.log("Video play on interaction failed:", err)
        })
        setHasUserInteracted(true)
      }
    }

    // Listen for any user interaction
    const events = ['touchstart', 'click', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, startVideoOnInteraction, { once: true })
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
        videoRef.current.play().catch((err) => {
          console.log("Video restart failed:", err)
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled])

  // Minimal 1-second black video encoded as base64 (very small file)
  // This is a 1x1 pixel, 1 second, silent video
  const videoDataUrl = "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTYgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAA2mWIhAA3//728P4FNjuZQQmiHCN2QAAAAwAAAwAAJgn0IQBBk2AAALQAAAMAAAMAACoCAA+CAAAARkGaJGxDP/6eEAAAHEAAAAKgAAAACKhgAAAP4PIAAA0wFIQBDcAA//v+95dv74//8SAjCYhAAPz/AL4AvsC+AAA="

  return (
    <video
      ref={videoRef}
      src={videoDataUrl}
      loop
      muted
      playsInline
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
    />
  )
}


"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

function getSafeRedirect(target?: string) {
  if (!target) return "/"

  try {
    const decoded = decodeURIComponent(target)
    if (decoded.startsWith("/")) {
      return decoded
    }
  } catch {
    // ignore malformed url
  }

  return "/"
}

function AuthCallbackContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending")
  const [message, setMessage] = useState("Confirming login...")

  const redirectTarget = useMemo(() => {
    const raw = params.get("redirectTo")
    return getSafeRedirect(raw ?? undefined)
  }, [params])

  useEffect(() => {
    let isActive = true
    const supabase = createClient()

    const handleError = (text: string) => {
      if (!isActive) return
      setStatus("error")
      setMessage(text)
      router.replace(`/login?error=${encodeURIComponent(text)}&redirectTo=${encodeURIComponent(redirectTarget)}`)
    }

    const finalize = () => {
      if (!isActive) return
      setStatus("success")
      setMessage("Done! Redirecting...")
      router.replace(redirectTarget)
    }

    if (typeof window === "undefined") {
      handleError("Authorization is not available in the current environment.")
      return
    }

    const authError = params.get("error") ?? params.get("error_description")
    if (authError) {
      handleError(authError)
      return
    }

    const process = async () => {
      setStatus("pending")
      setMessage("Confirming login...")

      try {
        // Проверяем наличие ошибок в URL
        const error = params.get("error")
        const errorDescription = params.get("error_description")
        
        if (error || errorDescription) {
          console.error("[AuthCallback] URL error:", error, errorDescription)
          handleError(errorDescription || error || "Authentication failed")
          return
        }

        // Для implicit flow токены обрабатываются автоматически из URL hash
        // Ждем небольшое время, чтобы Supabase успел обработать токены
        await new Promise(resolve => setTimeout(resolve, 500))

        // Проверяем есть ли активная сессия
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (!isActive) return

        if (sessionError) {
          console.error("[AuthCallback] session error:", sessionError)
          handleError(sessionError.message || "Failed to get session")
          return
        }

        if (!sessionData.session) {
          console.error("[AuthCallback] no session found")
          handleError("Session not found. Please request a new magic link.")
          return
        }

        console.log("[AuthCallback] session confirmed:", sessionData.session.user.email)
        finalize()
      } catch (err) {
        console.error("[AuthCallback] unexpected error:", err)
        if (!isActive) return
        handleError("Failed to confirm session. Please try again.")
      }
    }

    process()

    return () => {
      isActive = false
    }
  }, [params, redirectTarget, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffffff] px-6">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="flex justify-center">
          <Loader2
            className={`w-10 h-10 text-[#000000] ${status === "pending" ? "animate-spin" : ""}`}
          />
        </div>
        <div className="text-[18px] leading-[130%] text-[#000000]">{message}</div>
        {status === "error" && (
          <div className="text-[14px] leading-[130%] text-[rgba(0,0,0,0.6)]">
            If the problem persists, request the link again or choose another login method.
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#ffffff] px-6">
          <div className="flex items-center gap-3 text-[16px] leading-[140%] text-[rgba(0,0,0,0.6)]">
            <Loader2 className="w-5 h-5 animate-spin text-[#000000]" />
            Preparing authorization page...
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}


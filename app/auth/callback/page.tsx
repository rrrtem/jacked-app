"use client"

import { useEffect, useMemo, useState } from "react"
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

export default function AuthCallback() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending")
  const [message, setMessage] = useState("Подтверждаем вход...")

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
      setMessage("Готово! Перенаправляем...")
      router.replace(redirectTarget)
    }

    if (typeof window === "undefined") {
      handleError("Авторизация недоступна в текущей среде.")
      return
    }

    const authError = params.get("error") ?? params.get("error_description")
    if (authError) {
      handleError(authError)
      return
    }

    const process = async () => {
      setStatus("pending")
      setMessage("Подтверждаем вход...")

      try {
        const { data, error } = await (supabase.auth as any).getSessionFromUrl({
          storeSession: true,
        })

        if (!isActive) return

        if (error) {
          console.error("[AuthCallback] getSessionFromUrl error:", error)
          handleError(error.message ?? "Не удалось подтвердить сессию. Попробуйте снова.")
          return
        }

        if (!data.session) {
          handleError("Сессия не найдена. Отправьте ссылку ещё раз.")
          return
        }

        supabase.auth.startAutoRefresh()
        finalize()
      } catch (err) {
        console.error("[AuthCallback] unexpected error:", err)
        handleError("Не удалось подтвердить сессию. Попробуйте снова.")
      }
    }

    process()

    return () => {
      isActive = false
      supabase.auth.stopAutoRefresh()
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
            Если проблема повторяется, запросите ссылку заново или выберите другой способ входа.
          </div>
        )}
      </div>
    </div>
  )
}


"use client"

import { FormEvent, Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

const SAVED_EMAIL_KEY = "jacked_saved_email"

function LoginForm() {
  const params = useSearchParams()
  const redirectTo = params.get("redirectTo") ?? "/"
  const initialErrorMessage = params.get("error")

  const [email, setEmail] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  // Загружаем сохраненный email при монтировании
  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY)
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  // Сохраняем email в localStorage при каждом изменении
  useEffect(() => {
    if (email) {
      localStorage.setItem(SAVED_EMAIL_KEY, email)
    }
  }, [email])

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email) {
      setErrorMessage("please enter your email address.")
      setStatusMessage(null)
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      setStatusMessage(null)

      // Используем NEXT_PUBLIC_SITE_URL если задан, иначе текущий origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        throw error
      }

      setStatusMessage("magic link sent! check your email.")
    } catch (error) {
      console.error(error)
      setErrorMessage("failed to send magic link. please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#ffffff] flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4">
        {errorMessage && (
          <div className="rounded-[16px] bg-[rgba(255,47,0,0.08)] border border-[rgba(255,47,0,0.3)] px-4 py-3 text-[14px] leading-[140%] text-[#ff2f00]">
            {errorMessage}
          </div>
        )}

        {statusMessage && (
          <div className="rounded-[16px] bg-[rgba(0,0,0,0.05)] border border-[rgba(0,0,0,0.1)] px-4 py-3 text-[14px] leading-[140%] text-[#000000]">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-[24px] border border-[rgba(0,0,0,0.1)] bg-[#f8f8f8] px-4 py-4 text-[16px] leading-[120%] text-[#000000] outline-none"
            autoComplete="email"
            required
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full rounded-[60px] bg-[#000000] text-[#ffffff] py-4 text-[16px] leading-[120%] font-normal flex items-center justify-center gap-2 transition-opacity ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                sending magic link...
              </>
            ) : (
              "get magic link"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
          <Loader2 className="w-6 h-6 animate-spin text-[#000000]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}


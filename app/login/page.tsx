"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Mail, LogIn, ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const params = useSearchParams()

  const redirectTo = params.get("redirectTo") ?? "/"
  const initialErrorMessage = params.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage)
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email) {
      setErrorMessage("Введите адрес электронной почты.")
      setStatusMessage(null)
      return
    }

    try {
      setIsEmailSubmitting(true)
      setErrorMessage(null)
      setStatusMessage(null)

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        throw error
      }

      setStatusMessage("Мы отправили Magic Link на вашу почту. Проверьте почтовый ящик.")
    } catch (error) {
      console.error(error)
      setErrorMessage("Не удалось отправить письмо. Попробуйте ещё раз.")
    } finally {
      setIsEmailSubmitting(false)
    }
  }

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email || !password) {
      setErrorMessage("Укажите и почту, и пароль.")
      setStatusMessage(null)
      return
    }

    try {
      setIsPasswordSubmitting(true)
      setErrorMessage(null)
      setStatusMessage(null)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      router.push(redirectTo)
      router.refresh()
    } catch (error) {
      console.error(error)
      setErrorMessage("Не удалось авторизоваться. Проверьте почту/пароль и попробуйте снова.")
    } finally {
      setIsPasswordSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleRedirecting(true)
      setErrorMessage(null)
      setStatusMessage(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error(error)
      setErrorMessage("Не удалось перенаправить в Google. Проверьте настройки OAuth в Supabase.")
      setIsGoogleRedirecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col">
      <header className="px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[14px] leading-[120%] text-[rgba(0,0,0,0.6)] hover:text-[#000000] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          на главную
        </Link>
      </header>

      <main className="flex-1 flex justify-center items-center px-6 pb-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-[32px] leading-[120%] font-normal text-[#000000] mb-2">Вход в аккаунт</h1>
            <p className="text-[16px] leading-[150%] text-[rgba(0,0,0,0.6)]">
              Используйте Google или получите Magic Link на почту. Если у вас уже есть пароль, авторизуйтесь через форму ниже.
            </p>
          </div>

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

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleRedirecting}
              className={`w-full rounded-[60px] border border-[rgba(0,0,0,0.1)] bg-[#ffffff] py-4 text-[16px] leading-[120%] text-[#000000] font-normal flex items-center justify-center gap-2 transition-opacity ${
                isGoogleRedirecting ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
              }`}
            >
              {isGoogleRedirecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Перенаправляем в Google...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Войти через Google
                </>
              )}
            </button>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div className="rounded-[24px] border border-[rgba(0,0,0,0.1)] bg-[#f8f8f8] px-4 py-3 flex items-center gap-3">
                <Mail className="w-5 h-5 text-[rgba(0,0,0,0.4)]" />
                <input
                  type="email"
                  placeholder="почта@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="flex-1 bg-transparent outline-none text-[16px] leading-[120%] text-[#000000]"
                  autoComplete="email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isEmailSubmitting}
                className={`w-full rounded-[60px] bg-[#000000] text-[#ffffff] py-4 text-[16px] leading-[120%] font-normal flex items-center justify-center gap-2 transition-opacity ${
                  isEmailSubmitting ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
                }`}
              >
                {isEmailSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Отправляем Magic Link...
                  </>
                ) : (
                  "Получить Magic Link"
                )}
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <details className="group rounded-[24px] border border-[rgba(0,0,0,0.1)] bg-[#ffffff]">
              <summary className="cursor-pointer list-none rounded-[24px] px-4 py-3 text-[14px] leading-[120%] text-[rgba(0,0,0,0.6)] group-open:text-[#000000]">
                Есть пароль? Войти классическим способом
              </summary>
              <form onSubmit={handlePasswordLogin} className="px-4 pb-4 space-y-3">
                <div className="rounded-[16px] border border-[rgba(0,0,0,0.1)] px-3 py-2">
                  <label className="block text-[12px] leading-[120%] text-[rgba(0,0,0,0.4)] mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-transparent outline-none text-[14px] leading-[120%] text-[#000000]"
                    autoComplete="email"
                  />
                </div>

                <div className="rounded-[16px] border border-[rgba(0,0,0,0.1)] px-3 py-2">
                  <label className="block text-[12px] leading-[120%] text-[rgba(0,0,0,0.4)] mb-1">Пароль</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full bg-transparent outline-none text-[14px] leading-[120%] text-[#000000]"
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPasswordSubmitting}
                  className={`w-full rounded-[60px] bg-[#000000] text-[#ffffff] py-3 text-[16px] leading-[120%] font-normal flex items-center justify-center gap-2 transition-opacity ${
                    isPasswordSubmitting ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
                  }`}
                >
                  {isPasswordSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Входим...
                    </>
                  ) : (
                    "Войти"
                  )}
                </button>
              </form>
            </details>
          </div>
        </div>
      </main>
    </div>
  )
}


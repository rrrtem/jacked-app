"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { X, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { PROGRESSION_CONFIG_LIST } from "@/lib/progression/configs"

type UserSettings = {
  name: string | null
  email: string | null
  progression_config: string | null
  training_preferences: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    name: null,
    email: null,
    progression_config: 'standard-linear',
    training_preferences: null,
  })
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const supabase = createClient()

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        setError(null)

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (!session?.user) {
          router.replace("/login")
          return
        }

        // Load user data from database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("name, email, progression_config, training_preferences")
          .eq("id", session.user.id)
          .single()

        if (userError && userError.code !== 'PGRST116') throw userError

        if (userData) {
          setSettings({
            name: userData.name,
            email: userData.email,
            progression_config: userData.progression_config || 'standard-linear',
            training_preferences: userData.training_preferences,
          })
        } else {
          // No user record yet, use defaults
          setSettings({
            name: session.user.user_metadata?.name || null,
            email: session.user.email || null,
            progression_config: 'standard-linear',
            training_preferences: null,
          })
        }
      } catch (err) {
        console.error("Error loading settings:", err)
        setError("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [router, supabase])

  // Save settings (with optional override values)
  const handleSave = async (overrideSettings?: Partial<UserSettings>) => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        router.replace("/login")
        return
      }

      // Merge current settings with any overrides
      const settingsToSave = { ...settings, ...overrideSettings }

      // Upsert user settings
      const { error: updateError } = await supabase
        .from("users")
        .upsert(
          {
            id: session.user.id,
            name: settingsToSave.name,
            email: settingsToSave.email,
            progression_config: settingsToSave.progression_config,
            training_preferences: settingsToSave.training_preferences,
          },
          {
            onConflict: "id",
          }
        )

      if (updateError) {
        console.error("Supabase error:", updateError)
        throw updateError
      }

      setSuccessMessage("saved")
      
      // Clear success message after 1.5 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 1500)
    } catch (err: any) {
      console.error("Error saving settings:", err)
      const errorMessage = err?.message || "Failed to save settings"
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      
      // Clear local storage
      localStorage.clear()
      
      router.replace("/login")
    } catch (err) {
      console.error("Error logging out:", err)
      setError("Failed to logout")
    }
  }

  return (
    <div className="min-h-screen bg-[#ffffff] flex justify-center p-[10px]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[32px] leading-[120%] font-normal text-[#000000]">settings</h1>
          <Link href="/">
            <button className="p-2" aria-label="Close">
              <X className="w-6 h-6 text-[#000000]" />
            </button>
          </Link>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 rounded-lg border border-[#ff2f00]/20 bg-[#ff2f00]/10 px-4 py-3 text-[14px] leading-[140%] text-[#ff2f00]">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg border border-[#000000]/20 bg-[#000000]/5 px-4 py-3 text-[14px] leading-[140%] text-[#000000]">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.4)]">
            loading...
          </div>
        ) : (
          <div className="space-y-8 mb-[80px]">
            {/* Profile Section */}
            <section>
              <div className="space-y-[5px]">
                <input
                  type="text"
                  value={settings.name || ""}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  onBlur={() => handleSave()}
                  placeholder="your name"
                  className="w-full bg-transparent text-[20px] leading-[120%] text-[#000000] placeholder:text-[rgba(0,0,0,0.3)] outline-none p-0 m-0"
                />

                <div className="text-[20px] leading-[120%] text-[#000000]">
                  {settings.email || ""}
                </div>
              </div>
            </section>

            {/* Progression Logic Section */}
            <section>
              <h2 className="text-[20px] leading-[120%] font-normal text-[#000000] mb-2">
                progression logic
              </h2>
              <p className="text-[14px] leading-[140%] text-[rgba(0,0,0,0.5)] mb-4">
                affects ai suggested workout inputs
              </p>
              
              <div className="space-y-2">
                {/* Only show standard-linear for now */}
                {PROGRESSION_CONFIG_LIST.filter(config => config.id === 'standard-linear').map((config) => (
                  <button
                    key={config.id}
                    onClick={() => {
                      const newSettings = { ...settings, progression_config: config.id }
                      setSettings(newSettings)
                      handleSave({ progression_config: config.id })
                    }}
                    className={`
                      w-full text-left px-4 py-3 rounded-[12px] transition-all
                      ${
                        settings.progression_config === config.id
                          ? "bg-[#000000] text-[#ffffff]"
                          : "bg-[#f7f7f7] text-[#000000] hover:bg-[#e0e0e0]"
                      }
                    `}
                  >
                    <div className="text-[16px] leading-[120%] font-normal lowercase">
                      {config.name}
                    </div>
                    <div
                      className={`text-[12px] leading-[140%] mt-1 ${
                        settings.progression_config === config.id
                          ? "text-[rgba(255,255,255,0.7)]"
                          : "text-[rgba(0,0,0,0.5)]"
                      }`}
                    >
                      {config.description}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Training Preferences Section */}
            <section>
              <h2 className="text-[20px] leading-[120%] font-normal text-[#000000] mb-2">
                training preferences
              </h2>
              <p className="text-[14px] leading-[140%] text-[rgba(0,0,0,0.5)] mb-4">
                describe your training approach, goals, and any preferences
              </p>
              
              <textarea
                value={settings.training_preferences || ""}
                onChange={(e) => setSettings({ ...settings, training_preferences: e.target.value })}
                onBlur={() => handleSave()}
                placeholder="e.g., i focus on strength training with heavy compound movements. i prefer 3-4 workouts per week with 1-2 rest days in between. i'm working on increasing my squat and deadlift..."
                rows={6}
                className="w-full bg-[#f7f7f7] rounded-[12px] px-4 py-3 text-[16px] leading-[140%] text-[#000000] placeholder:text-[rgba(0,0,0,0.3)] outline-none focus:ring-2 focus:ring-[#000000] resize-none"
              />
            </section>

            {/* Logout Section */}
            <section className="pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[12px] bg-[#ff2f00] text-[#ffffff] hover:opacity-90 transition-opacity"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-[16px] leading-[120%]">logout</span>
              </button>
            </section>
          </div>
        )}

      </div>
    </div>
  )
}


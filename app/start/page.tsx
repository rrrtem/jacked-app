"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { X, Sparkles, Mic, Plus, Trash2 } from "lucide-react"

export default function StartWorkout() {
  const [showAdjustOverlay, setShowAdjustOverlay] = useState(false)
  const [inputText, setInputText] = useState("")
  const [activePreset, setActivePreset] = useState("default")
  const [presets, setPresets] = useState([
    {
      id: "default",
      icon: <Sparkles className="w-6 h-6" />,
      label: null,
      exercises: [
        { id: 1, name: "warm up", sets: null },
        { id: 2, name: "deadlift", sets: 3 },
        { id: 3, name: "bench press", sets: 3 },
      ],
    },
    {
      id: "d1",
      label: "d1",
      exercises: [
        { id: 4, name: "warm up", sets: null },
        { id: 5, name: "squat", sets: 4 },
        { id: 6, name: "leg press", sets: 3 },
      ],
    },
    {
      id: "d2",
      label: "d2",
      exercises: [
        { id: 7, name: "warm up", sets: null },
        { id: 8, name: "overhead press", sets: 3 },
        { id: 9, name: "lateral raise", sets: 3 },
      ],
    },
    {
      id: "d3",
      label: "d3",
      exercises: [
        { id: 10, name: "warm up", sets: null },
        { id: 11, name: "pull ups", sets: 3 },
        { id: 12, name: "barbell row", sets: 4 },
      ],
    },
    {
      id: "custom",
      icon: <span className="text-[20px]">🏋️</span>,
      exercises: [
        { id: 13, name: "warm up", sets: null },
        { id: 14, name: "dips", sets: 3 },
        { id: 15, name: "push ups", sets: 3 },
      ],
    },
  ])
  const [isAddingPreset, setIsAddingPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [swipedExerciseId, setSwipedExerciseId] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [swipeDistance, setSwipeDistance] = useState(0)

  const activePresetData = presets.find((p) => p.id === activePreset)

  const handleAddPreset = () => {
    if (newPresetName.trim()) {
      const newPreset = {
        id: `preset-${Date.now()}`,
        label: newPresetName.trim(),
        exercises: [{ id: Date.now(), name: "warm up", sets: null }],
      }
      setPresets([...presets, newPreset])
      setActivePreset(newPreset.id)
      setNewPresetName("")
      setIsAddingPreset(false)
    }
  }

  const handleDeleteExercise = (exerciseId: number) => {
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === activePreset
          ? {
              ...preset,
              exercises: preset.exercises.filter((ex) => ex.id !== exerciseId),
            }
          : preset,
      ),
    )
    setSwipedExerciseId(null)
    setSwipeDistance(0)
  }

  const handleTouchStart = (e: React.TouchEvent, exerciseId: number) => {
    setTouchStart(e.touches[0].clientX)
    setSwipedExerciseId(exerciseId)
  }

  const handleTouchMove = (e: React.TouchEvent, exerciseId: number) => {
    if (touchStart === null) return

    const touchCurrent = e.touches[0].clientX
    const diff = touchStart - touchCurrent

    // Only allow left swipe (positive diff), max 80px
    if (diff > 0) {
      setSwipeDistance(Math.min(diff, 80))
    }
  }

  const handleTouchEnd = (e: React.TouchEvent, exerciseId: number) => {
    if (touchStart === null) return

    // If swiped more than 60px (reaching trash icon), delete
    if (swipeDistance > 60) {
      handleDeleteExercise(exerciseId)
    } else {
      // Otherwise reset
      setSwipeDistance(0)
      setSwipedExerciseId(null)
    }

    setTouchStart(null)
  }

  return (
    <div className="min-h-screen bg-[#ffffff] flex justify-center p-[10px] relative">
      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[32px] leading-[120%] font-normal text-[#000000]">new workout</h1>
          <Link href="/">
            <button className="p-2" aria-label="Close">
              <X className="w-6 h-6 text-[#000000]" />
            </button>
          </Link>
        </div>

        {/* Preset Icons */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setActivePreset(preset.id)}
              className={`
                flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center
                ${preset.id === activePreset ? "bg-[#000000] text-[#ffffff]" : "bg-[rgba(0,0,0,0.05)] text-[#000000]"}
                hover:opacity-80 transition-opacity
              `}
            >
              {preset.icon || <span className="text-[20px] leading-[120%] opacity-30">{preset.label}</span>}
            </button>
          ))}

          {isAddingPreset ? (
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPreset()
                if (e.key === "Escape") {
                  setIsAddingPreset(false)
                  setNewPresetName("")
                }
              }}
              onBlur={handleAddPreset}
              placeholder="name"
              autoFocus
              className="flex-shrink-0 w-14 h-14 rounded-full bg-[rgba(0,0,0,0.05)] text-[#000000] text-center text-[14px] outline-none border-2 border-[#000000]"
            />
          ) : (
            <button
              onClick={() => setIsAddingPreset(true)}
              className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center bg-[rgba(0,0,0,0.05)] text-[#000000] hover:opacity-80 transition-opacity"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Exercise List */}
        <div className="space-y-0 mb-[200px] border-t border-[rgba(0,0,0,0.1)]">
          {activePresetData?.exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="relative overflow-hidden"
              onTouchStart={(e) => handleTouchStart(e, exercise.id)}
              onTouchMove={(e) => handleTouchMove(e, exercise.id)}
              onTouchEnd={(e) => handleTouchEnd(e, exercise.id)}
            >
              <div
                className="flex items-center justify-between py-5 border-b border-[rgba(0,0,0,0.1)] bg-[#ffffff] transition-transform"
                style={{
                  transform: swipedExerciseId === exercise.id ? `translateX(-${swipeDistance}px)` : "translateX(0)",
                }}
              >
                <span className="text-[20px] leading-[120%] text-[#000000]">{exercise.name}</span>
                {exercise.sets && <span className="text-[20px] leading-[120%] text-[#000000]">×{exercise.sets}</span>}
              </div>

              {swipedExerciseId === exercise.id && (
                <div
                  className="absolute right-0 top-0 h-full w-20 bg-[#ff2f00] flex items-center justify-center"
                  onClick={() => handleDeleteExercise(exercise.id)}
                >
                  <Trash2 className="w-6 h-6 text-[#ffffff]" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="fixed bottom-[10px] left-0 right-0 flex justify-center pointer-events-none z-50">
          <div className="w-full max-w-md px-[10px] pointer-events-auto">
            <div
              className="absolute inset-x-0 bottom-0 h-[200px] -z-10"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
              }}
            />

            <div className="space-y-3">
              <button
                className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.02)] transition-colors"
                onClick={() => setShowAdjustOverlay(true)}
              >
                adjust
              </button>
              <button className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.02)] transition-colors">
                save as done
              </button>
              <Link href="/workout/1">
                <button className="w-full bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90 transition-opacity">
                  start
                </button>
              </Link>
            </div>
          </div>
        </div>

        {showAdjustOverlay && (
          <>
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.3)] z-[60]" onClick={() => setShowAdjustOverlay(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[#ffffff] rounded-t-[30px] shadow-2xl animate-slide-up">
              <div className="w-full max-w-md mx-auto p-6">
                <div className="flex items-center gap-2 mb-6 bg-[#f7f7f7] rounded-[20px] px-4 py-3">
                  <span className="text-[#000000] text-[16px]">+</span>
                  <input
                    type="text"
                    placeholder="adjust workout"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent outline-none text-[16px] leading-[120%] text-[#000000] placeholder:text-[rgba(0,0,0,0.3)]"
                  />
                  <button className="p-1">
                    <Mic className="w-5 h-5 text-[rgba(0,0,0,0.5)]" />
                  </button>
                </div>

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setShowAdjustOverlay(false)}
                    className="px-6 py-3 bg-[#000000] text-[#ffffff] rounded-[60px] text-[16px] leading-[120%]"
                  >
                    done
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

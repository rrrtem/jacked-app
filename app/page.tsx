"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { useState, useEffect, useRef } from "react"

function generateContinuousDates(monthsToShow: number, extraWeeksAfterToday = 2) {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const currentDate = today.getDate()

  const allDates = []
  let lastActualDate: Date | null = null

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const workoutDates = [3, 5, 7, 10, 13, 15, 18, 21, 24, 27, 29]

  for (let i = monthsToShow - 1; i >= 0; i--) {
    const monthDate = new Date(currentYear, currentMonth - i, 1)
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day)
      const isToday = year === currentYear && month === currentMonth && day === currentDate
      const isPast = dateObj < today
      const isFuture = dateObj > today
      const hasWorkout = workoutDates.includes(day) && (isPast || isToday)
      const isFirstOfMonth = day === 1

      allDates.push({
        date: day,
        active: hasWorkout,
        today: isToday,
        isFuture,
        isFirstOfMonth,
        monthAbbr: monthNames[month],
        fullDate: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      })

      lastActualDate = dateObj
    }
  }

  const firstDate = new Date(currentYear, currentMonth - (monthsToShow - 1), 1)
  const firstDayOfWeek = firstDate.getDay()
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  for (let i = 0; i < offset; i++) {
    allDates.unshift({ date: null, isEmpty: true })
  }

  const todayIndex = allDates.findIndex((d: any) => d.today)

  if (todayIndex !== -1 && lastActualDate) {
    const todayRow = Math.floor(todayIndex / 7)
    let totalRows = Math.ceil(allDates.length / 7)
    let rowsAfterToday = totalRows - todayRow - 1
    const missingRows = Math.max(0, extraWeeksAfterToday - rowsAfterToday)

    if (missingRows > 0) {
      const daysToAdd = missingRows * 7

      for (let i = 1; i <= daysToAdd; i++) {
        const futureDate = new Date(lastActualDate)
        futureDate.setDate(futureDate.getDate() + i)

        const year = futureDate.getFullYear()
        const month = futureDate.getMonth()
        const day = futureDate.getDate()

        const isToday = year === currentYear && month === currentMonth && day === currentDate
        const isPast = futureDate < today
        const isFuture = futureDate > today
        const hasWorkout = workoutDates.includes(day) && (isPast || isToday)
        const isFirstOfMonth = day === 1

        allDates.push({
          date: day,
          active: hasWorkout,
          today: isToday,
          isFuture,
          isFirstOfMonth,
          monthAbbr: monthNames[month],
          fullDate: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        })
      }

      if (lastActualDate) {
        lastActualDate.setDate(lastActualDate.getDate() + missingRows * 7)
      }

      totalRows = Math.ceil(allDates.length / 7)
      rowsAfterToday = totalRows - todayRow - 1
    }

    const maxRows = todayRow + 1 + extraWeeksAfterToday
    const maxCells = maxRows * 7

    if (allDates.length > maxCells) {
      allDates.splice(maxCells)
    }
  }

  return allDates
}

export default function WorkoutTracker() {
  const [calendarDates, setCalendarDates] = useState<any[]>([])
  const [calendarHeight, setCalendarHeight] = useState<number | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dates = generateContinuousDates(12)
    setCalendarDates(dates)
  }, [])

  useEffect(() => {
    const updateHeight = () => {
      if (!calendarRef.current) return
      const cell = calendarRef.current.querySelector<HTMLElement>("[data-calendar-cell='true']")
      if (!cell) return

      const cellHeight = cell.getBoundingClientRect().height
      if (!cellHeight) return

      const adjustedHeight = Math.floor(cellHeight * 5)
      setCalendarHeight(adjustedHeight)
    }

    updateHeight()
    window.addEventListener("resize", updateHeight)

    return () => {
      window.removeEventListener("resize", updateHeight)
    }
  }, [calendarDates])

  useEffect(() => {
    if (calendarRef.current && calendarDates.length) {
      requestAnimationFrame(() => {
        if (calendarRef.current) {
          calendarRef.current.scrollTop = calendarRef.current.scrollHeight
        }
      })
    }
  }, [calendarDates])

  const daysOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

  const exercises = [
    { id: "deadlift-1", name: "deadlift", sets: "8", weight: "60kg" },
    { id: "bench-press-1", name: "bench press", sets: "8", weight: "40kg" },
    { id: "front-squat-1", name: "front squat", sets: "8", weight: "30kg" },
    { id: "barbell-row-1", name: "barbell row", sets: "8", weight: "50kg" },
    { id: "barbell-curl-1", name: "barbell curl", sets: "10", weight: "20kg" },
    { id: "assisted-pull-ups-1", name: "assisted pull ups", sets: "20", weight: "" },
    { id: "push-ups-1", name: "push ups", sets: "20", weight: "" },
    { id: "dips-1", name: "dips", sets: "8", weight: "" },
  ]

  return (
    <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-[10px]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[32px] leading-[120%] font-normal text-[#000000]">get jacked</h1>
          <button className="p-2" aria-label="Settings">
            <Settings className="w-6 h-6 text-[#000000]" />
          </button>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-7 gap-0 mb-2 sticky top-0 bg-[#ffffff] z-10">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-[10px] leading-[120%] text-[rgba(0,0,0,0.3)] font-normal py-2">
                {day}
              </div>
            ))}
          </div>

          <div
            ref={calendarRef}
            className="overflow-y-auto pr-2 scrollbar-thin"
            style={calendarHeight !== null ? { height: calendarHeight } : undefined}
          >
            <div className="grid grid-cols-7 gap-0">
              {calendarDates.map((item: any, index: number) => {
                if (item.isEmpty) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                return (
                  <Link
                    href={`/history/${item.fullDate}`}
                    key={index}
                    className={`
                      aspect-square flex flex-col items-center justify-center text-[20px] leading-[120%]
                      transition-all duration-200 relative
                      ${item.today ? "bg-[#ff2f00] text-[#ffffff]" : ""}
                      ${item.active && !item.today ? "bg-[#cfe9ff] text-[#000000]" : ""}
                      ${!item.active && !item.today && !item.isFuture ? "text-[#000000]" : ""}
                      ${item.isFuture && !item.today ? "text-[#000000] opacity-20" : ""}
                      ${item.today ? "hover:bg-[#ff4520]" : ""}
                      ${item.active && !item.today ? "hover:bg-[#a8d5ff]" : "hover:bg-[#f7f7f7]"}
                      cursor-pointer
                    `}
                    data-calendar-cell="true"
                  >
                    {item.isFirstOfMonth && <span className="text-[10px] leading-[100%] mb-1">{item.monthAbbr}</span>}
                    <span>{item.date}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Exercise list */}
        <div className="space-y-0 mb-[120px]">
          {exercises.map((exercise, index) => (
            <Link
              key={index}
              href={`/exercise/${exercise.id}`}
              className="flex items-center justify-between py-4 border-b border-[rgba(0,0,0,0.1)] transition-all duration-200 hover:bg-[#f7f7f7] cursor-pointer"
            >
              <span className="text-[20px] leading-[120%] text-[#000000]">{exercise.name}</span>
              <span className="text-[20px] leading-[120%] text-[#000000]">
                {exercise.weight ? `${exercise.sets} × ${exercise.weight}` : exercise.sets}
              </span>
            </Link>
          ))}
        </div>

        {/* New Workout Button */}
        <div className="fixed bottom-[10px] left-0 right-0 flex justify-center pointer-events-none z-50">
          <div className="w-full max-w-md px-[10px] pointer-events-auto">
            <div
              className="absolute inset-x-0 bottom-0 h-[150px] -z-10"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
              }}
            />

            <Link href="/start" className="block">
              <button className="w-full bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90 transition-opacity">
                new workout
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

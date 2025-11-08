"use client";

import { useState } from "react";

interface CalendarProps {
  workoutDates?: string[]; // ISO date strings
  onDateSelect?: (date: string) => void;
}

export function Calendar({ workoutDates = [], onDateSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Заглушка: генерируем простую сетку календаря
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
            )
          }
          className="p-2 hover:opacity-60"
        >
          ←
        </button>
        <h3 className="text-h1">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
            )
          }
          className="p-2 hover:opacity-60"
        >
          →
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((day) => (
          <div key={day} className="text-body opacity-inactive py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {emptyDays.map((i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = `${currentMonth.getFullYear()}-${String(
            currentMonth.getMonth() + 1
          ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasWorkout = workoutDates.includes(dateStr);

          return (
            <button
              key={day}
              onClick={() => onDateSelect?.(dateStr)}
              className={`
                aspect-square rounded-card text-body flex items-center justify-center
                transition-colors hover:border-accent
                ${hasWorkout ? "bg-secondary border border-accent" : "border border-black/10"}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}


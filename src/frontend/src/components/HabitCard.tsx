import { useState } from "react";
import { Edit2, Trash2, Check } from "lucide-react";
import {
  useDeleteHabit,
  useUpdateHabit,
  useHabitCompletions,
  useMarkCompletion,
} from "../hooks/useQueries";
import EditHabitModal from "./EditHabitModal";
import HabitHistoryModal from "./HabitHistoryModal";
import type { Habit } from "../backend";

interface HabitCardProps {
  habit: Habit;
}

function HabitCard({ habit }: HabitCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const deleteHabitMutation = useDeleteHabit();
  const updateHabitMutation = useUpdateHabit();
  const markCompletionMutation = useMarkCompletion();
  const { data: completionData = [] } = useHabitCompletions(habit.id);

  // Generate days for the 2-week grid (previous week + current week up to today)
  const generateDays = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Convert to Monday-based indexing (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
    const mondayBasedDayOfWeek =
      currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

    // Calculate the start of current week (Monday)
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - mondayBasedDayOfWeek);

    // Calculate the start of previous week (Monday of previous week)
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);

    const days: {
      date: string;
      isToday: boolean;
      dayIndex: number;
      week: string;
    }[] = [];

    // Previous week (7 days)
    for (let i = 0; i < 7; i++) {
      const date = new Date(previousWeekStart);
      date.setDate(previousWeekStart.getDate() + i);
      days.push({
        date: date.toISOString().split("T")[0],
        isToday: false,
        dayIndex: i,
        week: "previous",
      });
    }

    // Current week (only up to today)
    for (let i = 0; i <= mondayBasedDayOfWeek; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      const isToday = date.toDateString() === today.toDateString();
      days.push({
        date: date.toISOString().split("T")[0],
        isToday,
        dayIndex: i,
        week: "current",
      });
    }

    return days;
  };

  const days = generateDays();

  // Convert completion data to a Set for quick lookup
  const completions = new Set(
    completionData
      .filter((completion) => completion.completed)
      .map((completion) => completion.date),
  );

  const handleToggleCompletion = async (
    date: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Prevent opening the history modal

    // Always toggle to the opposite state
    const currentlyCompleted = completions.has(date);
    const newCompletedState = !currentlyCompleted;

    // The optimistic update will happen automatically via the mutation's onMutate
    markCompletionMutation.mutate({
      habitId: habit.id,
      date,
      completed: newCompletedState,
    });
  };

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the history modal
    if (window.confirm("Are you sure you want to delete this habit?")) {
      await deleteHabitMutation.mutateAsync(habit.id);
    }
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the history modal
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (name: string, color: string) => {
    await updateHabitMutation.mutateAsync({ id: habit.id, name, color });
    setIsEditModalOpen(false);
  };

  const handleCardClick = () => {
    setIsHistoryModalOpen(true);
  };

  // Helper function to create radial gradient style
  const getCompletedStyle = (color: string) => {
    // Convert hex to RGB for gradient manipulation
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Create lighter center and darker edges
    const lightCenter = `rgba(${r}, ${g}, ${b}, 0.8)`;
    const darkEdge = `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}, 1)`;

    return {
      background: `radial-gradient(circle, ${lightCenter} 0%, ${darkEdge} 100%)`,
    };
  };

  // Helper function to create light background color (similar to tailwind's 50 shade)
  const getLightBackground = (color: string) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Create a very light version (similar to tailwind's 50 shade)
    // Mix with white heavily (about 95% white, 5% color)
    const lightR = Math.round(r * 0.05 + 255 * 0.95);
    const lightG = Math.round(g * 0.05 + 255 * 0.95);
    const lightB = Math.round(b * 0.05 + 255 * 0.95);

    return `rgb(${lightR}, ${lightG}, ${lightB})`;
  };

  // Helper function to get card styling
  const getCardStyle = () => {
    return {
      backgroundColor: getLightBackground(habit.color),
      borderColor: habit.color,
    };
  };

  const getDaySquareStyle = (day: any, isCompleted: boolean) => {
    if (day.isToday) {
      // Today's square styling
      if (isCompleted) {
        // Completed today: radial gradient fill + colored border
        return {
          ...getCompletedStyle(habit.color),
          borderColor: habit.color,
          boxShadow: `0 0 20px ${habit.color}40`,
        };
      } else {
        // Uncompleted today: just colored border, no fill
        return {
          backgroundColor: "transparent",
          borderColor: habit.color,
        };
      }
    } else {
      // Other days
      if (isCompleted) {
        // Completed other days: radial gradient fill, no special border
        return {
          ...getCompletedStyle(habit.color),
          borderColor: "transparent",
        };
      } else {
        // Uncompleted other days: white background with light gray border
        return {
          backgroundColor: "rgb(255, 255, 255)",
          borderColor: "rgb(198, 199, 200)",
        };
      }
    }
  };

  const getDayName = (dayIndex: number) => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return dayNames[dayIndex];
  };

  return (
    <>
      <div
        className="rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border"
        style={{ width: "fit-content", ...getCardStyle() }}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-800 truncate">
              {habit.name}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteHabitMutation.isPending}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className="habit-tracker-grid"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div className="space-y-2">
            {/* Day labels - show labels for all days in the previous week */}
            <div className="flex gap-1 mb-1">
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                <div
                  key={dayIndex}
                  className="w-8 h-4 text-xs text-gray-500 text-center"
                >
                  {getDayName(dayIndex)}
                </div>
              ))}
            </div>

            {/* Previous week (days 0-6) */}
            <div className="flex gap-1">
              {days.slice(0, 7).map((day) => {
                const isCompleted = completions.has(day.date);
                const isClickable = day.isToday;

                return (
                  <button
                    key={day.date}
                    onClick={
                      isClickable
                        ? (e) => handleToggleCompletion(day.date, e)
                        : undefined
                    }
                    disabled={!isClickable}
                    className={`
                      w-8 h-8 rounded-lg border-2 transition-all duration-200 flex items-center justify-center
                      ${
                        day.isToday && isCompleted ? "animate-subtle-pulse" : ""
                      }
                      ${
                        isClickable
                          ? "hover:scale-105 cursor-pointer active:scale-95"
                          : "cursor-default"
                      }
                      disabled:opacity-50
                    `}
                    style={getDaySquareStyle(day, isCompleted)}
                    title={`${day.date} ${isCompleted ? "(completed)" : "(not completed)"} ${day.isToday ? "(today - click to toggle)" : ""}`}
                  >
                    {isCompleted && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Current week (only the days we have) */}
            {days.length > 7 && (
              <div className="flex gap-1">
                {days.slice(7).map((day) => {
                  const isCompleted = completions.has(day.date);
                  const isClickable = day.isToday;

                  return (
                    <button
                      key={day.date}
                      onClick={
                        isClickable
                          ? (e) => handleToggleCompletion(day.date, e)
                          : undefined
                      }
                      disabled={!isClickable}
                      className={`
                        w-8 h-8 rounded-lg border-2 transition-all duration-200 flex items-center justify-center
                        ${
                          day.isToday && isCompleted
                            ? "animate-subtle-pulse"
                            : ""
                        }
                        ${
                          isClickable
                            ? "hover:scale-105 cursor-pointer active:scale-95"
                            : "cursor-default"
                        }
                        disabled:opacity-50
                      `}
                      style={getDaySquareStyle(day, isCompleted)}
                      title={`${day.date} ${isCompleted ? "(completed)" : "(not completed)"} ${day.isToday ? "(today - click to toggle)" : ""}`}
                    >
                      {isCompleted && <Check className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
                {/* Add empty slots to maintain visual alignment */}
                {Array.from({ length: 7 - (days.length - 7) }).map(
                  (_, index) => (
                    <div key={`empty-${index}`} className="w-8 h-8" />
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditHabitModal
          habit={habit}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdate}
          isLoading={updateHabitMutation.isPending}
        />
      )}

      {isHistoryModalOpen && (
        <HabitHistoryModal
          habit={habit}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
    </>
  );
}

export default HabitCard;

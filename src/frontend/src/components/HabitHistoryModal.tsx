import { X, Check } from "lucide-react";
import { useHabitCompletions } from "../hooks/useQueries";
import type { Habit } from "../backend";

interface HabitHistoryModalProps {
  habit: Habit;
  onClose: () => void;
}

interface WeekDay {
  date: string;
  isCurrentMonth: boolean;
  isBeforeToday: boolean;
  isFutureDate: boolean;
  dayOfMonth: number;
  isEmpty: boolean;
}

interface Month {
  monthLabel: string;
  year: number;
  month: number;
  weeks: WeekDay[][];
  isCurrentMonth: boolean;
}

function HabitHistoryModal({ habit, onClose }: HabitHistoryModalProps) {
  const { data: completionData = [], isLoading } = useHabitCompletions(
    habit.id,
  );

  // Generate 6 months of data with proper calendar layout (invisible empty days)
  const generateSixMonthsData = () => {
    const today = new Date();
    const months: Month[] = [];

    // Generate 6 months starting from 5 months ago to current month
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      // Get the first day of the month and last day of the month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Calculate the Sunday of the week containing the first day (standard calendar layout)
      const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Calculate how many days we need to go back to get to the Sunday of the first week
      const daysToGoBack = firstDayOfWeek;
      const startDate = new Date(firstDay);
      startDate.setDate(firstDay.getDate() - daysToGoBack);

      // Calculate how many weeks we need for this month
      const totalDaysInGrid = daysToGoBack + lastDay.getDate();
      const weeksNeeded = Math.ceil(totalDaysInGrid / 7);

      const monthDays: WeekDay[][] = [];

      // Generate the proper number of weeks for this month
      for (let week = 0; week < weeksNeeded; week++) {
        const weekDays: WeekDay[] = [];
        for (let day = 0; day < 7; day++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + week * 7 + day);

          const isCurrentMonth = currentDate.getMonth() === month;
          const isBeforeToday = currentDate <= today;
          const isFutureDate = currentDate > today;

          if (isCurrentMonth && !isFutureDate) {
            // Actual month days that are not in the future
            weekDays.push({
              date: currentDate.toISOString().split("T")[0],
              isCurrentMonth: true,
              isBeforeToday,
              isFutureDate: false,
              dayOfMonth: currentDate.getDate(),
              isEmpty: false,
            });
          } else {
            // Empty placeholder days (invisible but structurally present)
            weekDays.push({
              date: "",
              isCurrentMonth: false,
              isBeforeToday: false,
              isFutureDate: true,
              dayOfMonth: 0,
              isEmpty: true,
            });
          }
        }
        monthDays.push(weekDays);
      }

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      months.push({
        monthLabel: `${monthNames[month]} ${year}`,
        year,
        month,
        weeks: monthDays,
        isCurrentMonth: i === 0,
      });
    }

    return months;
  };

  const monthsData = generateSixMonthsData();

  // Convert completion data to a Set for quick lookup
  const completions = new Set(
    completionData
      .filter((completion) => completion.completed)
      .map((completion) => completion.date),
  );

  // Helper function to create radial gradient style
  const getCompletedStyle = (color: string) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

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

  // Helper function to get modal styling
  const getModalStyle = () => {
    return {
      backgroundColor: getLightBackground(habit.color),
      borderColor: habit.color,
    };
  };

  const getDaySquareStyle = (day: any, isCompleted: boolean) => {
    if (day.isFutureDate) {
      // Future days - very light gray and transparent
      return {
        backgroundColor: "#f9fafb",
        borderColor: "#f3f4f6",
        opacity: 0.2,
      };
    }

    if (!day.isCurrentMonth) {
      // Days from other months but not future - slightly muted
      if (isCompleted) {
        return {
          ...getCompletedStyle(habit.color),
          borderColor: "transparent",
          opacity: 0.6,
        };
      } else {
        return {
          backgroundColor: "#9ca3af",
          borderColor: "#9ca3af",
          opacity: 0.6,
        };
      }
    }

    // Current month days
    if (isCompleted) {
      return {
        ...getCompletedStyle(habit.color),
        borderColor: "transparent",
      };
    } else {
      // Use white background with light gray border for missed days
      return {
        backgroundColor: "rgb(255, 255, 255)",
        borderColor: "rgb(198, 199, 200)",
      };
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="rounded-2xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden border"
        style={getModalStyle()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {habit.name}
              </h2>
              <p className="text-sm text-gray-600">
                6-month completion history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Continuous grid layout for visual continuity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {monthsData.map((monthData, monthIndex) => (
              <div
                key={`${monthData.year}-${monthData.month}`}
                className="flex flex-col items-center"
              >
                {/* Month label */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 text-center">
                    {monthData.monthLabel}
                  </h3>
                </div>

                {/* Month grid - proper calendar layout with invisible empty days */}
                <div className="grid grid-cols-7 gap-1">
                  {monthData.weeks.flat().map((day, dayIndex) => {
                    // Handle empty days (invisible but structurally present)
                    if (day.isEmpty) {
                      return (
                        <div
                          key={`${monthData.year}-${monthData.month}-empty-${dayIndex}`}
                          className="w-8 h-8"
                          style={{
                            backgroundColor: "transparent",
                            border: "none",
                            opacity: 0,
                          }}
                        />
                      );
                    }

                    const isCompleted = completions.has(day.date);

                    return (
                      <div
                        key={`${monthData.year}-${monthData.month}-${dayIndex}`}
                        className="w-8 h-8 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200"
                        style={getDaySquareStyle(day, isCompleted)}
                        title={`${day.date} ${isCompleted ? "(completed)" : "(not completed)"}`}
                      >
                        {isCompleted && !day.isFutureDate && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Visual continuity emphasis */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Each square represents one day. Patterns and streaks become
              visible across months.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HabitHistoryModal;

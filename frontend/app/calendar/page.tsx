"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Circle,
  Plus,
  CalendarDays,
  Menu,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "DOING" | "COMPLETED" | "ON_HOLD";
  priority: "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  projectId?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("accessToken");

  if (
    !token ||
    token === "null" ||
    token === "undefined" ||
    token.trim() === ""
  ) {
    throw new Error("AUTH_REQUIRED");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (
    init.body &&
    !headers.has("Content-Type") &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

const statusStyles: Record<Task["status"], string> = {
  TODO: "bg-[#f1f1ee] text-[#555]",
  DOING: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  ON_HOLD: "bg-orange-50 text-orange-700",
};

const priorityDot: Record<Task["priority"], string> = {
  URGENT: "text-red-600",
  HIGH: "text-orange-500",
  MEDIUM: "text-yellow-500",
  LOW: "text-blue-500",
  NO_PRIORITY: "text-[#aaa]",
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfCalendar(date: Date) {
  const first = startOfMonth(date);
  const day = first.getDay();
  return new Date(first.getFullYear(), first.getMonth(), 1 - day);
}

function endOfCalendar(date: Date) {
  const last = endOfMonth(date);
  const day = last.getDay();
  return new Date(last.getFullYear(), last.getMonth(), last.getDate() + (6 - day));
}

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function taskDateKey(date: string) {
  const value = new Date(date);
  return dateKey(value);
}

function isSameDay(a: Date, b: Date) {
  return dateKey(a) === dateKey(b);
}

function formatDueDate(date: string | null) {
  if (!date) return "No due date";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CalendarPage() {
  const router = useRouter();

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(`${API_URL}/tasks`);

      if (response.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setTasks([]);
        setError("Your session has expired. Please log in again.");
        router.replace("/");
        return;
      }

      if (!response.ok) {
        throw new Error(`TASKS_REQUEST_FAILED_${response.status}`);
      }

      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Calendar task loading failed:", err);

      if (err instanceof Error && err.message === "AUTH_REQUIRED") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setTasks([]);
        setError("Your session has expired. Please log in again.");
        router.replace("/");
        return;
      }

      setError(
        "Unable to load your tasks. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  const calendarDays = useMemo(() => {
    const start = startOfCalendar(currentMonth);
    const end = endOfCalendar(currentMonth);
    const days: Date[] = [];

    const cursor = new Date(start);

    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    for (const task of tasks) {
      if (!task.dueDate) continue;

      const key = taskDateKey(task.dueDate);
      const existing = grouped.get(key) ?? [];
      existing.push(task);
      grouped.set(key, existing);
    }

    return grouped;
  }, [tasks]);

  const selectedTasks = selectedDate
    ? tasksByDate.get(dateKey(selectedDate)) ?? []
    : [];

  const monthTaskCount = tasks.filter((task) => {
    if (!task.dueDate) return false;

    const date = new Date(task.dueDate);

    return (
      date.getFullYear() === currentMonth.getFullYear() &&
      date.getMonth() === currentMonth.getMonth()
    );
  }).length;

  const overdueCount = tasks.filter((task) => {
    if (!task.dueDate || task.status === "COMPLETED") return false;
    return new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
  }).length;

  const today = new Date();

  function previousMonth() {
    setSelectedDate(null);
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  function nextMonth() {
    setSelectedDate(null);
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  function goToday() {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7f5] text-[#191919]">
      <header className="sticky top-0 z-40 border-b border-[#e7e7e4] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:min-h-20 sm:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push("/tasks")}
              className="rounded-xl p-2.5 text-[#666] hover:bg-[#f2f2ef]"
              title="Back to tasks"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">
              <p className="text-[10px] text-[#999] sm:text-xs">Workspace</p>
              <h1 className="truncate text-lg font-semibold sm:text-xl">Calendar</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/tasks")}
              className="hidden items-center gap-2 rounded-xl bg-[#191919] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#303030] sm:flex"
            >
              <Plus size={16} />
              New task
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="rounded-xl border border-[#e5e5e1] p-2.5 text-[#555] hover:bg-[#f2f2ef] sm:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#eeeeeb] bg-white px-4 py-3 sm:hidden">
            <div className="grid gap-1.5">
              {[
                ["/tasks", "Tasks"],
                ["/projects", "Projects"],
                ["/calendar", "Calendar"],
                ["/tasks", "My Tasks"],
                ["/settings", "Settings"],
              ].map(([href, label]) => (
                <button
                  key={`${href}-${label}`}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push(href);
                  }}
                  className={[
                    "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                    label === "Calendar"
                      ? "bg-[#f1f1ee] text-[#191919]"
                      : "text-[#666] hover:bg-[#f5f5f2]",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => router.push("/tasks")}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#191919] px-3 py-2.5 text-sm font-medium text-white"
              >
                <Plus size={16} />
                New task
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#999]">
              Planning
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Task calendar
            </h2>
            <p className="mt-2 text-sm text-[#888]">
              See your scheduled work and upcoming deadlines.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:flex">
            <div className="rounded-xl border border-[#e5e5e1] bg-white px-3 py-2">
              <span className="text-[#999]">This month</span>
              <span className="ml-2 font-semibold">{monthTaskCount}</span>
            </div>
            <div className="rounded-xl border border-[#e5e5e1] bg-white px-3 py-2">
              <span className="text-[#999]">Overdue</span>
              <span className="ml-2 font-semibold text-red-600">{overdueCount}</span>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#e5e5e1] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#eeeeeb] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <div className="flex items-center gap-2">
              <button
                onClick={previousMonth}
                className="rounded-lg border border-[#e5e5e1] p-2 hover:bg-[#f5f5f2]"
                title="Previous month"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                onClick={nextMonth}
                className="rounded-lg border border-[#e5e5e1] p-2 hover:bg-[#f5f5f2]"
                title="Next month"
              >
                <ChevronRight size={17} />
              </button>

              <h3 className="ml-2 min-w-0 text-base font-semibold sm:text-lg">
                {currentMonth.toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
            </div>

            <button
              onClick={goToday}
              className="rounded-lg border border-[#dededb] px-3 py-2 text-xs font-medium text-[#555] hover:bg-[#f5f5f2]"
            >
              Today
            </button>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#ddd] border-t-[#191919]" />
              <p className="mt-3 text-sm text-[#888]">Loading calendar...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <CalendarDays className="mx-auto text-[#aaa]" size={28} />
              <p className="mt-3 text-sm font-medium text-red-600">{error}</p>

              {error !== "Your session has expired. Please log in again." && (
                <p className="mx-auto mt-1 max-w-sm text-xs text-[#999]">
                  You can retry the request without leaving the calendar.
                </p>
              )}

              {error !== "Your session has expired. Please log in again." && (
                <button
                  type="button"
                  onClick={() => void loadTasks()}
                  className="mt-4 rounded-xl bg-[#191919] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#303030]"
                >
                  Try again
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 border-b border-[#eeeeeb]">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="px-1 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-[#999] sm:px-3"
                    >
                      <span className="sm:hidden">{day.charAt(0)}</span>
                      <span className="hidden sm:inline">{day}</span>
                    </div>
                  ),
                )}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const key = dateKey(day);
                  const dayTasks = tasksByDate.get(key) ?? [];
                  const outsideMonth =
                    day.getMonth() !== currentMonth.getMonth();
                  const todayClass = isSameDay(day, today);
                  const selectedClass =
                    selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(day)}
                      className={[
                        "group relative min-h-20 overflow-hidden border-b border-r border-[#eeeeeb] p-1 text-left transition hover:bg-[#fafaf8] sm:min-h-32 sm:p-2.5",
                        outsideMonth ? "bg-[#fafaf8] text-[#bbb]" : "bg-white",
                        selectedClass ? "bg-[#f3f3f0]" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={[
                            "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium sm:h-7 sm:w-7 sm:text-xs",
                            todayClass
                              ? "bg-[#191919] text-white"
                              : outsideMonth
                                ? "text-[#bbb]"
                                : "text-[#555]",
                          ].join(" ")}
                        >
                          {day.getDate()}
                        </span>

                        {dayTasks.length > 0 && (
                          <span className="mr-1 text-[9px] font-semibold text-[#999]">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 space-y-0.5 sm:space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className="truncate rounded-md bg-[#f3f3f0] px-1 py-0.5 text-[9px] font-medium text-[#555] sm:px-1.5 sm:py-1 sm:text-[10px]"
                            title={task.title}
                          >
                            <span className={`mr-1 ${priorityDot[task.priority]}`}>
                              ●
                            </span>
                            {task.title}
                          </div>
                        ))}

                        {dayTasks.length > 3 && (
                          <div className="px-1.5 text-[9px] font-medium text-[#999]">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {selectedDate && (
          <section className="mt-4 rounded-2xl border border-[#e5e5e1] bg-white p-4 shadow-sm sm:mt-5 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#999]">
                  Selected date
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  {selectedDate.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
              </div>

              <span className="text-xs text-[#999]">
                {selectedTasks.length}{" "}
                {selectedTasks.length === 1 ? "task" : "tasks"}
              </span>
            </div>

            {selectedTasks.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-[#dededb] bg-[#fafaf8] p-6 text-center">
                <p className="text-sm text-[#888]">
                  No tasks are due on this date.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {selectedTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => router.push("/tasks")}
                    className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-[#e8e8e4] p-3 text-left transition hover:bg-[#fafaf8]"
                  >
                    <Circle
                      size={15}
                      className={`shrink-0 ${priorityDot[task.priority]}`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {task.title}
                      </p>
                      <p className="mt-1 text-xs text-[#999]">
                        Due {formatDueDate(task.dueDate)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-medium ${statusStyles[task.status]}`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  Search,
  XCircle as XCircleIcon,
  Menu,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type TaskStatus = "TODO" | "DOING" | "COMPLETED" | "ON_HOLD";
type TaskPriority = "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type Label = {
  id: string;
  name: string;
};

type TaskLabel = {
  taskId: string;
  labelId: string;
  label: Label;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  labels?: TaskLabel[];
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

const statusOptions: { key: "ALL" | TaskStatus; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "TODO", label: "To Do" },
  { key: "DOING", label: "Doing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "ON_HOLD", label: "On Hold" },
];

function formatDate(date: string | null) {
  if (!date) return "No due date";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === "COMPLETED") return false;

  const due = new Date(task.dueDate);
  due.setHours(23, 59, 59, 999);

  return due.getTime() < Date.now();
}

function priorityClass(priority: TaskPriority) {
  switch (priority) {
    case "URGENT":
      return "bg-red-50 text-red-700";
    case "HIGH":
      return "bg-orange-50 text-orange-700";
    case "MEDIUM":
      return "bg-yellow-50 text-yellow-700";
    case "LOW":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-[#f1f1ee] text-[#666]";
  }
}

function statusClass(status: TaskStatus) {
  switch (status) {
    case "DOING":
      return "bg-blue-50 text-blue-700";
    case "COMPLETED":
      return "bg-green-50 text-green-700";
    case "ON_HOLD":
      return "bg-orange-50 text-orange-700";
    default:
      return "bg-[#f1f1ee] text-[#666]";
  }
}

function statusLabel(status: TaskStatus) {
  switch (status) {
    case "TODO":
      return "To Do";
    case "DOING":
      return "Doing";
    case "COMPLETED":
      return "Completed";
    case "ON_HOLD":
      return "On Hold";
  }
}

export default function MyTasksPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<{
    id?: string;
    name?: string;
    email?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | TaskStatus>("ALL");
  const [priorityFilter, setPriorityFilter] =
    useState<"ALL" | TaskPriority>("ALL");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    void loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(`${API_URL}/tasks/my`);

      if (response.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setTasks([]);
        setError("Your session has expired. Please sign in again.");
        router.replace("/");
        return;
      }

      if (!response.ok) {
        throw new Error(`MY_TASKS_REQUEST_FAILED_${response.status}`);
      }

      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load My Tasks:", err);

      if (err instanceof Error && err.message === "AUTH_REQUIRED") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setTasks([]);
        setError("Your session has expired. Please sign in again.");
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

  const filteredTasks = useMemo(() => {
    const value = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !value ||
        task.title.toLowerCase().includes(value) ||
        task.description?.toLowerCase().includes(value) ||
        task.priority.toLowerCase().includes(value) ||
        task.labels?.some((item) =>
          item.label.name.toLowerCase().includes(value),
        );

      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "TODO").length,
      doing: tasks.filter((task) => task.status === "DOING").length,
      completed: tasks.filter((task) => task.status === "COMPLETED").length,
      onHold: tasks.filter((task) => task.status === "ON_HOLD").length,
      overdue: tasks.filter(isOverdue).length,
    }),
    [tasks],
  );

  const summaryCards = [
    { label: "Total", count: counts.total, Icon: ListTodo },
    { label: "To Do", count: counts.todo, Icon: Circle },
    { label: "Doing", count: counts.doing, Icon: Clock3 },
    { label: "Completed", count: counts.completed, Icon: CheckCircle2 },
    { label: "On Hold", count: counts.onHold, Icon: Clock3 },
    { label: "Overdue", count: counts.overdue, Icon: CalendarDays },
  ];

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
              <h1 className="truncate text-lg font-semibold sm:text-xl">My Tasks</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/tasks")}
              className="hidden rounded-xl bg-[#191919] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#303030] sm:block"
            >
              Back to Tasks
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
                    label === "My Tasks"
                      ? "bg-[#f1f1ee] text-[#191919]"
                      : "text-[#666] hover:bg-[#f5f5f2]",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/tasks");
                }}
                className="mt-1 flex w-full items-center justify-center rounded-xl bg-[#191919] px-3 py-2.5 text-sm font-medium text-white"
              >
                Back to Tasks
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#999]">
            Personal workspace
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {user?.name ? `${user.name}'s tasks` : "Your tasks"}
          </h2>

          <p className="mt-2 text-sm text-[#888]">
            Tasks assigned to your current account.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2.5 sm:mb-6 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          {summaryCards.map(({ label, count, Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-[#e5e5e1] bg-white p-3.5 shadow-sm sm:p-4"
            >
              <Icon size={17} className="text-[#888]" />
              <p className="mt-3 text-xs text-[#999]">{label}</p>
              <p className="mt-1 text-xl font-semibold">{count}</p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#e5e5e1] bg-white shadow-sm">
          <div className="border-b border-[#eeeeeb] p-3.5 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tasks, priorities or labels..."
                  className="w-full rounded-xl border border-[#dededb] bg-[#fafaf8] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#aaa]"
                />
              </div>

              <select
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(
                    event.target.value as "ALL" | TaskPriority,
                  )
                }
                className="w-full rounded-xl border border-[#dededb] bg-white px-3 py-2.5 text-sm outline-none lg:w-auto lg:min-w-40"
              >
                <option value="ALL">All priorities</option>
                <option value="NO_PRIORITY">No priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:mt-4">
              {statusOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setStatusFilter(option.key)}
                  className={[
                    "shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition",
                    statusFilter === option.key
                      ? "bg-[#191919] text-white"
                      : "bg-[#f1f1ee] text-[#666] hover:bg-[#e9e9e6]",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#ddd] border-t-[#191919]" />
              <p className="mt-3 text-sm font-medium text-[#555]">
                Loading your tasks...
              </p>
              <p className="mt-1 text-xs text-[#aaa]">
                Fetching tasks assigned to your account.
              </p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <XCircleIcon />
              </div>

              <p className="mt-4 text-sm font-medium text-red-600">
                {error}
              </p>

              {error !== "Your session has expired. Please sign in again." && (
                <p className="mx-auto mt-1 max-w-md text-xs text-[#999]">
                  Check your connection and retry without leaving My Tasks.
                </p>
              )}

              {error !== "Your session has expired. Please sign in again." && (
                <button
                  type="button"
                  onClick={() => void loadTasks()}
                  className="mt-4 rounded-xl bg-[#191919] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#303030]"
                >
                  Try again
                </button>
              )}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-16 text-center">
              <ListTodo className="mx-auto text-[#aaa]" size={30} />
              <h3 className="mt-4 text-base font-semibold">
                {tasks.length === 0
                  ? "No tasks assigned to you"
                  : "No matching tasks"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#888]">
                {tasks.length === 0
                  ? "Create a task from the Tasks workspace and it will appear here automatically."
                  : "Try changing the search or filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#eeeeeb]">
              {filteredTasks.map((task) => {
                const overdue = isOverdue(task);

                return (
                  <button
                    key={task.id}
                    onClick={() => router.push("/tasks")}
                    className="flex w-full min-w-0 flex-col gap-3 p-4 text-left transition hover:bg-[#fafaf8] sm:flex-row sm:items-center sm:p-5"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={[
                          "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                          task.status === "COMPLETED"
                            ? "bg-green-500"
                            : task.status === "DOING"
                              ? "bg-blue-500"
                              : task.status === "ON_HOLD"
                                ? "bg-orange-500"
                                : "bg-[#aaa]",
                        ].join(" ")}
                      />

                      <div className="min-w-0">
                        <h3
                          className={[
                            "truncate text-sm font-semibold",
                            task.status === "COMPLETED"
                              ? "text-[#888] line-through"
                              : "text-[#222]",
                          ].join(" ")}
                        >
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-[#999]">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-1 text-[10px] font-medium ${statusClass(task.status)}`}
                          >
                            {statusLabel(task.status)}
                          </span>

                          <span
                            className={`rounded-md px-2 py-1 text-[10px] font-medium ${priorityClass(task.priority)}`}
                          >
                            {task.priority.replaceAll("_", " ")}
                          </span>

                          {task.labels?.map((item) => (
                            <span
                              key={item.labelId}
                              className="rounded-full bg-[#f1f1ee] px-2 py-1 text-[10px] font-medium text-[#666]"
                            >
                              {item.label.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="w-full shrink-0 border-t border-[#eeeeeb] pt-3 text-left sm:w-auto sm:min-w-32 sm:border-t-0 sm:pt-0 sm:text-right">
                      <p
                        className={[
                          "text-xs font-medium",
                          overdue ? "text-red-600" : "text-[#777]",
                        ].join(" ")}
                      >
                        {overdue ? "Overdue" : "Due"}
                      </p>

                      <p className="mt-1 text-xs text-[#999]">
                        {formatDate(task.dueDate)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
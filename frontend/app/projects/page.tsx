"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Folder,
  Menu,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  leadId: string | null;
  tasks?: Task[];
};

type Task = {
  id: string;
  title: string;
  status: "TODO" | "DOING" | "COMPLETED" | "ON_HOLD";
  priority: string;
  dueDate: string | null;
  projectId?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const priorityClass: Record<string, string> = {
  URGENT: "bg-red-50 text-red-700",
  HIGH: "bg-orange-50 text-orange-700",
  MEDIUM: "bg-yellow-50 text-yellow-700",
  LOW: "bg-blue-50 text-blue-700",
  NO_PRIORITY: "bg-[#f1f1ee] text-[#666]",
};

/**
 * Centralized API helper.
 *
 * Every authenticated request from this page goes through this function
 * so the JWT token is automatically attached.
 */
async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No authentication token found. Please log in again.");
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

function formatDate(date: string | null) {
  if (!date) return "No due date";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [projectsResponse, tasksResponse] = await Promise.all([
        apiFetch(`${API_URL}/projects`),
        apiFetch(`${API_URL}/tasks`),
      ]);

      if (!projectsResponse.ok) {
        const errorText = await projectsResponse.text();

        console.error(
          "Projects API error:",
          projectsResponse.status,
          errorText,
        );

        throw new Error("Failed to load projects");
      }

      if (!tasksResponse.ok) {
        const errorText = await tasksResponse.text();

        console.error(
          "Tasks API error:",
          tasksResponse.status,
          errorText,
        );

        throw new Error("Failed to load tasks");
      }

      const projectsData = await projectsResponse.json();
      const tasksData = await tasksResponse.json();

      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error("Failed to load projects/tasks:", error);

      if (
        error instanceof Error &&
        error.message.includes("No authentication token")
      ) {
        setError("Your session has expired. Please log in again.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.replace("/");
        return;
      }

      setError("Unable to load projects. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createProject() {
    const name = newName.trim();

    if (!name) {
      alert("Please enter a project name.");
      return;
    }

    try {
      setCreating(true);

      const response = await apiFetch(`${API_URL}/projects`, {
        method: "POST",
        body: JSON.stringify({
          name,
          priority: "NO_PRIORITY",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Create project API error:",
          response.status,
          errorText,
        );

        throw new Error("Failed to create project");
      }

      const project = await response.json();

      setProjects((current) => [project, ...current]);
      setNewName("");
      setShowCreate(false);
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error &&
        error.message.includes("No authentication token")
      ) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.replace("/");
        return;
      }

      alert("Unable to create project.");
    } finally {
      setCreating(false);
    }
  }

  async function saveProject(id: string) {
    const name = editingName.trim();

    if (!name) {
      alert("Project name cannot be empty.");
      return;
    }

    try {
      setSavingId(id);

      const response = await apiFetch(`${API_URL}/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Update project API error:",
          response.status,
          errorText,
        );

        throw new Error("Failed to update project");
      }

      const updated = await response.json();

      setProjects((current) =>
        current.map((project) =>
          project.id === id
            ? { ...project, ...updated }
            : project,
        ),
      );

      setEditingId(null);
      setEditingName("");
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error &&
        error.message.includes("No authentication token")
      ) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.replace("/");
        return;
      }

      alert("Unable to update project.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteProject(project: Project) {
    if (
      !window.confirm(
        `Delete "${project.name}"? Tasks will remain but their project will be cleared.`,
      )
    ) {
      return;
    }

    try {
      const response = await apiFetch(
        `${API_URL}/projects/${project.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Delete project API error:",
          response.status,
          errorText,
        );

        throw new Error("Failed to delete project");
      }

      setProjects((current) =>
        current.filter((item) => item.id !== project.id),
      );

      setTasks((current) =>
        current.map((task) =>
          task.projectId === project.id
            ? { ...task, projectId: null }
            : task,
        ),
      );
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error &&
        error.message.includes("No authentication token")
      ) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.replace("/");
        return;
      }

      alert("Unable to delete project.");
    }
  }

  const projectStats = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter(
        (task) => task.projectId === project.id,
      );

      const completed = projectTasks.filter(
        (task) => task.status === "COMPLETED",
      ).length;

      const overdue = projectTasks.filter((task) => {
        if (!task.dueDate || task.status === "COMPLETED") {
          return false;
        }

        return new Date(task.dueDate) < new Date();
      }).length;

      return {
        ...project,
        taskCount: projectTasks.length,
        completed,
        overdue,
      };
    });
  }, [projects, tasks]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7f5] text-[#191919]">
      <header className="sticky top-0 z-30 border-b border-[#e7e7e4] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push("/tasks")}
              className="shrink-0 rounded-xl p-2.5 text-[#666] hover:bg-[#f2f2ef]"
              title="Back to tasks"
              aria-label="Back to tasks"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">
              <p className="text-xs text-[#999]">Workspace</p>
              <h1 className="truncate text-lg font-semibold sm:text-xl">
                Projects
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="hidden items-center gap-2 rounded-xl bg-[#191919] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#303030] sm:flex"
            >
              <Plus size={17} />
              New project
            </button>

            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#191919] text-white hover:bg-[#303030] sm:hidden"
              title="New project"
              aria-label="New project"
            >
              <Plus size={18} />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e5e1] text-[#666] hover:bg-[#f2f2ef] lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={19} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#eeeeeb] bg-white px-4 py-3 shadow-sm lg:hidden">
            <nav className="grid gap-1">
              {[
                ["Tasks", "/tasks"],
                ["Projects", "/projects"],
                ["Calendar", "/calendar"],
                ["My Tasks", "/my-tasks"],
                ["Settings", "/settings"],
              ].map(([label, href]) => (
                <button
                  key={href}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push(href);
                  }}
                  className={`w-full rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                    href === "/projects"
                      ? "bg-[#f1f1ee] text-[#191919]"
                      : "text-[#666] hover:bg-[#f7f7f5]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#999]">
            Workspace
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Your projects
          </h2>

          <p className="mt-2 text-sm text-[#888]">
            Create, organize and monitor work across your projects.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#e5e5e1] bg-white p-12 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#ddd] border-t-[#191919]" />

            <p className="mt-3 text-sm font-medium text-[#555]">
              Loading projects...
            </p>

            <p className="mt-1 text-xs text-[#aaa]">
              Fetching your projects and tasks.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-white p-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
              <X size={18} />
            </div>

            <h3 className="mt-4 text-base font-semibold">
              Unable to load projects
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-[#999]">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadData()}
              className="mt-5 rounded-xl bg-[#191919] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#303030]"
            >
              Try again
            </button>
          </div>
        ) : projectStats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d5d5d1] bg-white p-14 text-center">
            <Folder className="mx-auto text-[#999]" size={28} />

            <h3 className="mt-4 text-base font-semibold">
              No projects yet
            </h3>

            <p className="mt-1 text-sm text-[#999]">
              Create your first project to organize your tasks.
            </p>

            <button
              onClick={() => setShowCreate(true)}
              className="mt-5 rounded-xl bg-[#191919] px-4 py-2.5 text-sm font-medium text-white"
            >
              Create project
            </button>
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projectStats.map((project) => {
              const progress =
                project.taskCount === 0
                  ? 0
                  : Math.round(
                      (project.completed / project.taskCount) * 100,
                    );

              return (
                <article
                  key={project.id}
                  className="min-w-0 rounded-2xl border border-[#e5e5e1] bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f1ee]">
                          <Folder size={17} />
                        </div>

                        {editingId === project.id ? (
                          <input
                            autoFocus
                            value={editingName}
                            onChange={(event) =>
                              setEditingName(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                void saveProject(project.id);
                              }

                              if (event.key === "Escape") {
                                setEditingId(null);
                                setEditingName("");
                              }
                            }}
                            className="min-w-0 w-full rounded-lg border border-[#dededb] px-2.5 py-1.5 text-sm font-semibold outline-none"
                          />
                        ) : (
                          <h3 className="truncate text-base font-semibold">
                            {project.name}
                          </h3>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      {editingId === project.id ? (
                        <>
                          <button
                            onClick={() =>
                              void saveProject(project.id)
                            }
                            disabled={savingId === project.id}
                            className="rounded-lg bg-[#191919] px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                          >
                            {savingId === project.id
                              ? "Saving..."
                              : "Save"}
                          </button>

                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingName("");
                            }}
                            className="rounded-lg p-2 text-[#888] hover:bg-[#f3f3f0]"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(project.id);
                              setEditingName(project.name);
                            }}
                            className="rounded-lg p-2 text-[#aaa] hover:bg-[#f3f3f0] hover:text-[#555]"
                            title="Edit project"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={() =>
                              void deleteProject(project)
                            }
                            className="rounded-lg p-2 text-[#aaa] hover:bg-red-50 hover:text-red-600"
                            title="Delete project"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between text-xs text-[#777]">
                    <span>{project.taskCount} tasks</span>
                    <span>{project.completed} completed</span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eeeeeb]">
                    <div
                      className="h-full rounded-full bg-[#191919] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#f7f7f5] p-3">
                      <p className="text-[10px] uppercase tracking-wide text-[#999]">
                        Priority
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-md px-2 py-1 text-[10px] font-medium uppercase ${
                          priorityClass[project.priority] ??
                          priorityClass.NO_PRIORITY
                        }`}
                      >
                        {project.priority.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#f7f7f5] p-3">
                      <p className="text-[10px] uppercase tracking-wide text-[#999]">
                        Due
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-[#555]">
                        <CalendarDays size={12} />
                        {formatDate(project.dueDate)}
                      </p>
                    </div>
                  </div>

                  {project.overdue > 0 && (
                    <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      {project.overdue} overdue{" "}
                      {project.overdue === 1 ? "task" : "tasks"}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !creating
            ) {
              setShowCreate(false);
            }
          }}
        >
          <div className="mx-auto mt-8 w-full max-w-md rounded-2xl bg-white shadow-2xl sm:mt-20">
            <div className="flex items-center justify-between border-b border-[#eeeeeb] px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Create project
                </h2>

                <p className="mt-1 text-sm text-[#888]">
                  Add a project to your workspace.
                </p>
              </div>

              <button
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="rounded-lg p-2 text-[#888] hover:bg-[#f3f3f0]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <label className="mb-2 block text-xs font-semibold text-[#555]">
                Project name
              </label>

              <input
                autoFocus
                value={newName}
                onChange={(event) =>
                  setNewName(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void createProject();
                  }
                }}
                placeholder="e.g. Website Redesign"
                className="w-full rounded-xl border border-[#dededb] px-3.5 py-3 text-sm outline-none focus:border-[#999]"
              />

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowCreate(false)}
                  disabled={creating}
                  className="w-full rounded-xl border border-[#dededb] px-4 py-2.5 text-sm font-medium text-[#555] sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  onClick={() => void createProject()}
                  disabled={creating || !newName.trim()}
                  className="w-full rounded-xl bg-[#191919] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
                >
                  {creating ? "Creating..." : "Create project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
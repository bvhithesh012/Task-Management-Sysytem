"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Circle,
  Folder,
  GripVertical,
  LayoutGrid,
  List,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  User,
  X,
  Trash2,
  Pencil,
} from "lucide-react";

type TaskStatus = "TODO" | "DOING" | "COMPLETED" | "ON_HOLD";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt?: string;
  projectId?: string | null;
  reporterId?: string | null;
};

type Project = {
  id: string;
  name: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  leadId: string | null;
};

type Subtask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  taskId: string;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  taskId: string;
  authorId: string | null;
  author: {
    id: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
  } | null;
};

type Label = {
  id: string;
  name: string;
  createdAt: string;
};

type TaskLabel = {
  taskId: string;
  labelId: string;
  label: Label;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

  return fetch(input, {
    ...init,
    headers,
  });
}


const columns: {
  key: TaskStatus;
  label: string;
}[] = [
  { key: "TODO", label: "To Do" },
  { key: "DOING", label: "Doing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "ON_HOLD", label: "On Hold" },
];

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<"board" | "list">("board");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showProjectsPanel, setShowProjectsPanel] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");
  const [savingProject, setSavingProject] = useState(false);

  const [user, setUser] = useState<{
    name: string;
    email: string;
  } | null>(null);

  // Create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<TaskStatus>("TODO");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newDueDate, setNewDueDate] = useState("");
  const [newProjectId, setNewProjectId] = useState("");
  const [creating, setCreating] = useState(false);

  // Details / Edit
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<TaskStatus>("TODO");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editDueDate, setEditDueDate] = useState("");
  const [editProjectId, setEditProjectId] = useState("");

  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [taskLabels, setTaskLabels] = useState<TaskLabel[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [labelSaving, setLabelSaving] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // Drag and drop
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] =
    useState<TaskStatus | null>(null);
  const [movingTask, setMovingTask] = useState(false);

  useEffect(() => {
    void loadAllLabels();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    loadTasks();
    loadProjects();
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);

      const response = await apiFetch(`${API_URL}/tasks`);

      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await response.json();

      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    try {
      setProjectsLoading(true);

      const response = await apiFetch(`${API_URL}/projects`);

      if (!response.ok) {
        throw new Error("Failed to load projects");
      }

      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setProjectsLoading(false);
    }
  }

  // =========================
  // PROJECTS
  // =========================

  async function createProject() {
    if (!newProjectName.trim()) {
      alert("Please enter a project name.");
      return;
    }

    try {
      setCreatingProject(true);

      const response = await apiFetch(`${API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newProjectName.trim(),
          priority: "NO_PRIORITY",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const createdProject = await response.json();
      setProjects((current) => [createdProject, ...current]);
      setNewProjectName("");
    } catch (error) {
      console.error(error);
      alert("Unable to create project.");
    } finally {
      setCreatingProject(false);
    }
  }

  async function saveProject(projectId: string) {
    if (!editingProjectName.trim()) {
      alert("Project name cannot be empty.");
      return;
    }

    try {
      setSavingProject(true);

      const response = await apiFetch(`${API_URL}/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingProjectName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      const updatedProject = await response.json();

      setProjects((current) =>
        current.map((project) =>
          project.id === updatedProject.id ? updatedProject : project,
        ),
      );

      setEditingProjectId(null);
      setEditingProjectName("");
    } catch (error) {
      console.error(error);
      alert("Unable to update project.");
    } finally {
      setSavingProject(false);
    }
  }

  async function deleteProject(project: Project) {
    const confirmed = window.confirm(
      `Delete "${project.name}"? Tasks assigned to it will remain, but their project will be cleared.`,
    );

    if (!confirmed) return;

    try {
      const response = await apiFetch(`${API_URL}/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
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

      if (projectFilter === project.id) {
        setProjectFilter("ALL");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to delete project.");
    }
  }

  // =========================
  // CREATE
  // =========================

  async function createTask() {
    if (!newTitle.trim()) {
      alert("Please enter a task title.");
      return;
    }

    try {
      setCreating(true);

      const response = await apiFetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          status: newStatus,
          priority: newPriority,
          dueDate: newDueDate
            ? new Date(`${newDueDate}T00:00:00`).toISOString()
            : undefined,
          projectId: newProjectId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const createdTask = await response.json();

      setTasks((current) => [createdTask, ...current]);

      closeCreateModal();
    } catch (error) {
      console.error(error);
      alert("Unable to create task.");
    } finally {
      setCreating(false);
    }
  }

  function closeCreateModal() {
    if (creating) return;

    setShowCreateModal(false);
    setNewTitle("");
    setNewDescription("");
    setNewStatus("TODO");
    setNewPriority("MEDIUM");
    setNewDueDate("");
    setNewProjectId("");
  }

  // =========================
  // OPEN TASK
  // =========================

  function openTask(task: Task) {
    setSelectedTask(task);

    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditStatus(task.status);
    setEditPriority(task.priority);

    setEditDueDate(
      task.dueDate ? task.dueDate.substring(0, 10) : "",
    );
    setEditProjectId(task.projectId ?? "");
    setSubtasks([]);
    setNewSubtaskTitle("");
    setComments([]);
    setNewComment("");
    setEditingCommentId(null);
    setEditingCommentText("");
    setEditing(false);

    void loadSubtasks(task.id);
    void loadTaskLabels(task.id);
    void loadComments(task.id);
  }

  function closeTaskModal() {
    if (saving || deleting) return;

    setSelectedTask(null);
    setEditing(false);
    setSubtasks([]);
    setNewSubtaskTitle("");
    setComments([]);
    setNewComment("");
    setEditingCommentId(null);
    setEditingCommentText("");
  }

  // =========================
  // LABELS
  // =========================

  async function loadAllLabels() {
    try {
      const response = await apiFetch(`${API_URL}/labels`);
      if (!response.ok) throw new Error("Failed to load labels");
      const data = await response.json();
      setAllLabels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load labels:", error);
    }
  }

  async function loadTaskLabels(taskId: string) {
    try {
      setLabelsLoading(true);
      const response = await apiFetch(`${API_URL}/labels/task/${taskId}`);
      if (!response.ok) throw new Error("Failed to load task labels");
      const data = await response.json();
      setTaskLabels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load task labels:", error);
      setTaskLabels([]);
    } finally {
      setLabelsLoading(false);
    }
  }

  async function createAndAssignLabel() {
    const name = newLabelName.trim();
    if (!selectedTask || !name) return;

    try {
      setLabelSaving(true);

      const response = await apiFetch(`${API_URL}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Failed to create label");

      const label: Label = await response.json();

      setAllLabels((current) => {
        const exists = current.some((item) => item.id === label.id);
        return exists
          ? current
          : [...current, label].sort((a, b) =>
              a.name.localeCompare(b.name),
            );
      });

      await assignLabelToTask(label.id);
      setNewLabelName("");
    } catch (error) {
      console.error("Failed to create label:", error);
      alert("Unable to create label.");
    } finally {
      setLabelSaving(false);
    }
  }

  async function assignLabelToTask(labelId: string) {
    if (!selectedTask) return;

    if (taskLabels.some((item) => item.labelId === labelId)) {
      setShowLabelPicker(false);
      return;
    }

    try {
      setLabelSaving(true);

      const response = await apiFetch(
        `${API_URL}/labels/task/${selectedTask.id}/${labelId}`,
        { method: "POST" },
      );

      if (!response.ok) throw new Error("Failed to assign label");

      const assignment: TaskLabel = await response.json();

      setTaskLabels((current) => [...current, assignment]);
      setShowLabelPicker(false);
    } catch (error) {
      console.error("Failed to assign label:", error);
      alert("Unable to assign label.");
    } finally {
      setLabelSaving(false);
    }
  }

  async function removeLabelFromTask(labelId: string) {
    if (!selectedTask) return;

    try {
      setLabelSaving(true);

      const response = await apiFetch(
        `${API_URL}/labels/task/${selectedTask.id}/${labelId}`,
        { method: "DELETE" },
      );

      if (!response.ok) throw new Error("Failed to remove label");

      setTaskLabels((current) =>
        current.filter((item) => item.labelId !== labelId),
      );
    } catch (error) {
      console.error("Failed to remove label:", error);
      alert("Unable to remove label.");
    } finally {
      setLabelSaving(false);
    }
  }

  // =========================
  // SUBTASKS
  // =========================

  async function loadSubtasks(taskId: string) {
    try {
      setSubtasksLoading(true);

      const response = await apiFetch(
        `${API_URL}/subtasks/task/${taskId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load subtasks");
      }

      const data = await response.json();
      setSubtasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load subtasks:", error);
      setSubtasks([]);
    } finally {
      setSubtasksLoading(false);
    }
  }

  async function addSubtask() {
    if (!selectedTask || !newSubtaskTitle.trim()) return;

    try {
      setAddingSubtask(true);

      const response = await apiFetch(
        `${API_URL}/subtasks/task/${selectedTask.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: newSubtaskTitle.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create subtask");
      }

      const createdSubtask = await response.json();

      setSubtasks((current) => [...current, createdSubtask]);
      setNewSubtaskTitle("");
    } catch (error) {
      console.error("Failed to create subtask:", error);
      alert("Unable to add subtask.");
    } finally {
      setAddingSubtask(false);
    }
  }

  async function toggleSubtask(subtask: Subtask) {
    const nextCompleted = !subtask.completed;

    setSubtasks((current) =>
      current.map((item) =>
        item.id === subtask.id
          ? { ...item, completed: nextCompleted }
          : item,
      ),
    );

    try {
      const response = await apiFetch(
        `${API_URL}/subtasks/${subtask.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed: nextCompleted,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update subtask");
      }

      const updatedSubtask = await response.json();

      setSubtasks((current) =>
        current.map((item) =>
          item.id === updatedSubtask.id
            ? updatedSubtask
            : item,
        ),
      );
    } catch (error) {
      console.error("Failed to update subtask:", error);

      setSubtasks((current) =>
        current.map((item) =>
          item.id === subtask.id
            ? { ...item, completed: subtask.completed }
            : item,
        ),
      );

      alert("Unable to update subtask.");
    }
  }

  async function deleteSubtask(subtaskId: string) {
    if (!window.confirm("Delete this subtask?")) return;

    try {
      const response = await apiFetch(
        `${API_URL}/subtasks/${subtaskId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete subtask");
      }

      setSubtasks((current) =>
        current.filter((item) => item.id !== subtaskId),
      );
    } catch (error) {
      console.error("Failed to delete subtask:", error);
      alert("Unable to delete subtask.");
    }
  }

  // =========================
  // UPDATE
  // =========================

  async function loadComments(taskId: string) {
    try {
      setCommentsLoading(true);
      const response = await apiFetch(`${API_URL}/comments/task/${taskId}`);
      if (!response.ok) throw new Error("Failed to load comments");
      const data = await response.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load comments:", error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }

  async function addComment() {
    if (!selectedTask || !newComment.trim()) return;
    try {
      setAddingComment(true);
      const response = await apiFetch(
        `${API_URL}/comments/task/${selectedTask.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newComment.trim() }),
        },
      );
      if (!response.ok) throw new Error("Failed to create comment");
      const createdComment = await response.json();
      setComments((current) => [...current, createdComment]);
      setNewComment("");
    } catch (error) {
      console.error("Failed to create comment:", error);
      alert("Unable to add comment.");
    } finally {
      setAddingComment(false);
    }
  }

  function startEditingComment(comment: Comment) {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditingCommentText("");
  }

  async function saveComment(commentId: string) {
    if (!editingCommentText.trim()) return;
    try {
      const response = await apiFetch(`${API_URL}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingCommentText.trim() }),
      });
      if (!response.ok) throw new Error("Failed to update comment");
      const updatedComment = await response.json();
      setComments((current) =>
        current.map((comment) =>
          comment.id === updatedComment.id ? updatedComment : comment,
        ),
      );
      cancelEditingComment();
    } catch (error) {
      console.error("Failed to update comment:", error);
      alert("Unable to update comment.");
    }
  }

  async function deleteComment(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const response = await apiFetch(`${API_URL}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete comment");
      setComments((current) =>
        current.filter((comment) => comment.id !== commentId),
      );
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Unable to delete comment.");
    }
  }

  async function updateTask() {
    if (!selectedTask) return;

    if (!editTitle.trim()) {
      alert("Task title cannot be empty.");
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch(
        `${API_URL}/tasks/${selectedTask.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            description: editDescription.trim() || null,
            status: editStatus,
            priority: editPriority,
            dueDate: editDueDate
              ? new Date(
                  `${editDueDate}T00:00:00`,
                ).toISOString()
              : null,
            projectId: editProjectId || null,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update error:", errorText);
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();

      setTasks((current) =>
        current.map((task) =>
          task.id === updatedTask.id ? updatedTask : task,
        ),
      );

      setSelectedTask(updatedTask);
      setEditing(false);
    } catch (error) {
      console.error(error);
      alert("Unable to update task.");
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // DELETE
  // =========================

  async function deleteTask() {
    if (!selectedTask) return;

    const confirmed = window.confirm(
      `Delete "${selectedTask.title}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const response = await apiFetch(
        `${API_URL}/tasks/${selectedTask.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks((current) =>
        current.filter(
          (task) => task.id !== selectedTask.id,
        ),
      );

      setSelectedTask(null);
      setEditing(false);
    } catch (error) {
      console.error(error);
      alert("Unable to delete task.");
    } finally {
      setDeleting(false);
    }
  }

  // =========================
  // DRAG & DROP
  // =========================

  function handleDragStart(
    event: React.DragEvent<HTMLElement>,
    taskId: string,
  ) {
    setDraggedTaskId(taskId);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  }

  function handleDragEnd() {
    setDraggedTaskId(null);
    setDragOverStatus(null);
  }

  function handleDragOver(
    event: React.DragEvent<HTMLDivElement>,
    status: TaskStatus,
  ) {
    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    setDragOverStatus(status);
  }

  function handleDragLeave(
    event: React.DragEvent<HTMLDivElement>,
  ) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setDragOverStatus(null);
    }
  }

  async function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
    newStatus: TaskStatus,
  ) {
    event.preventDefault();

    const taskId =
      event.dataTransfer.getData("text/plain") ||
      draggedTaskId;

    setDragOverStatus(null);
    setDraggedTaskId(null);

    if (!taskId) return;

    const task = tasks.find(
      (item) => item.id === taskId,
    );

    if (!task) return;

    if (task.status === newStatus) return;

    const previousStatus = task.status;

    // Optimistic update
    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: newStatus,
            }
          : item,
      ),
    );

    try {
      setMovingTask(true);

      const response = await apiFetch(
        `${API_URL}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Move error:", errorText);
        throw new Error("Failed to move task");
      }

      const updatedTask = await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === updatedTask.id
            ? updatedTask
            : item,
        ),
      );
    } catch (error) {
      console.error("Failed to move task:", error);

      // Restore previous status
      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: previousStatus,
              }
            : item,
        ),
      );

      alert("Unable to move task. Please try again.");
    } finally {
      setMovingTask(false);
    }
  }

  // =========================
  // SEARCH
  // =========================

  const filteredTasks = useMemo(() => {
    const value = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesProject =
        projectFilter === "ALL" ||
        (projectFilter === "NONE" && !task.projectId) ||
        task.projectId === projectFilter;

      const matchesSearch =
        !value ||
        task.title.toLowerCase().includes(value) ||
        task.description?.toLowerCase().includes(value) ||
        task.priority.toLowerCase().includes(value);

      return matchesProject && matchesSearch;
    });
  }, [tasks, search, projectFilter]);

  function tasksForStatus(status: TaskStatus) {
    return filteredTasks.filter(
      (task) => task.status === status,
    );
  }

  function priorityLabel(priority: string) {
    return priority.replaceAll("_", " ");
  }

  function projectName(projectId?: string | null) {
    if (!projectId) return "No project";
    return (
      projects.find((project) => project.id === projectId)?.name ??
      "Unknown project"
    );
  }

  function statusLabel(status: TaskStatus) {
    return (
      columns.find((column) => column.key === status)?.label ??
      status
    );
  }

  function formatDate(date: string | null) {
    if (!date) return "No date";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function priorityClass(priority: string) {
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

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const total = tasks.length;
    const todo = tasks.filter((task) => task.status === "TODO").length;
    const doing = tasks.filter((task) => task.status === "DOING").length;
    const completed = tasks.filter((task) => task.status === "COMPLETED").length;
    const onHold = tasks.filter((task) => task.status === "ON_HOLD").length;

    const overdue = tasks.filter((task) => {
      if (!task.dueDate || task.status === "COMPLETED") return false;
      return new Date(task.dueDate) < now;
    }).length;

    const completionRate =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    const recentTasks = [...tasks]
      .sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime(),
      )
      .slice(0, 5);

    return {
      total,
      todo,
      doing,
      completed,
      onHold,
      overdue,
      completionRate,
      recentTasks,
    };
  }, [tasks]);

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#191919]">
      <div className="flex min-h-screen flex-col lg:flex-row">

        {/* SIDEBAR */}

        <aside className="hidden w-64 shrink-0 border-r border-[#e7e7e4] bg-white lg:flex lg:flex-col">

          <div className="flex h-20 items-center gap-3 border-b border-[#eeeeeb] px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#191919] text-sm font-bold text-white">
              P
            </div>

            <span className="text-lg font-semibold">
              Project
            </span>
          </div>

          <nav className="flex-1 px-3 py-5">

            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#999]">
              Workspace
            </p>

            <button className="flex w-full items-center gap-3 rounded-xl bg-[#f1f1ee] px-3 py-2.5 text-sm font-medium">
              <Check size={17} />
              Tasks
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); router.push("/projects"); }}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#666] hover:bg-[#f5f5f2]"
            >
              <Folder size={17} />
              Projects
              <span className="ml-auto rounded-md bg-[#f1f1ee] px-1.5 py-0.5 text-[10px]">
                {projects.length}
              </span>
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); router.push("/calendar"); }}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#666] hover:bg-[#f5f5f2]"
            >
              <CalendarDays size={17} />
              Calendar
            </button>

            <p className="px-3 pb-2 pt-8 text-[11px] font-semibold uppercase tracking-wider text-[#999]">
              Personal
            </p>

            <button
              onClick={() => { setMobileMenuOpen(false); router.push("/my-tasks"); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#666] hover:bg-[#f5f5f2]"
            >
              <User size={17} />
              My Tasks
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); router.push("/settings"); }}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#666] hover:bg-[#f5f5f2]"
            >
              <Settings size={17} />
              Settings
            </button>

          </nav>

          <div className="border-t border-[#eeeeeb] p-4">
            <div className="flex items-center gap-3 rounded-xl p-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9e9e6]">
                <User size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user?.name || "Guest User"}
                </p>

                <p className="truncate text-xs text-[#888]">
                  {user?.email || "Guest account"}
                </p>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem("accessToken");
                  localStorage.removeItem("user");
                  window.location.href = "/";
                }}
                title="Log out"
                className="rounded-lg p-2 text-[#888] hover:bg-[#f2f2ef]"
              >
                <LogOut size={16} />
              </button>

            </div>
          </div>

        </aside>

        {/* MOBILE NAVIGATION */}

        <div className="lg:hidden">
          <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#e7e7e4] bg-white/95 px-4 backdrop-blur">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#191919] text-sm font-bold text-white">
                P
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Project</p>
                <p className="truncate text-[11px] text-[#999]">Tasks</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileMenuOpen}
              className="rounded-xl p-2.5 text-[#666] hover:bg-[#f2f2ef]"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="fixed inset-x-0 top-16 z-40 border-b border-[#e7e7e4] bg-white p-3 shadow-lg lg:hidden">
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl bg-[#f1f1ee] px-3 py-3 text-sm font-medium"
                >
                  <Check size={17} />
                  Tasks
                </button>

                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); router.push("/projects"); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#666] hover:bg-[#f5f5f2]"
                >
                  <Folder size={17} />
                  Projects
                  <span className="ml-auto rounded-md bg-[#f1f1ee] px-1.5 py-0.5 text-[10px]">
                    {projects.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); router.push("/calendar"); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#666] hover:bg-[#f5f5f2]"
                >
                  <CalendarDays size={17} />
                  Calendar
                </button>

                <div className="my-2 border-t border-[#eeeeeb]" />

                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); router.push("/my-tasks"); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#666] hover:bg-[#f5f5f2]"
                >
                  <User size={17} />
                  My Tasks
                </button>

                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); router.push("/settings"); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#666] hover:bg-[#f5f5f2]"
                >
                  <Settings size={17} />
                  Settings
                </button>

                <div className="my-2 border-t border-[#eeeeeb]" />

                <div className="flex items-center gap-3 rounded-xl bg-[#fafaf8] p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e9e9e6]">
                    <User size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{user?.name || "Guest User"}</p>
                    <p className="truncate text-xs text-[#888]">{user?.email || "Guest account"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("accessToken");
                      localStorage.removeItem("user");
                      window.location.href = "/";
                    }}
                    title="Log out"
                    className="rounded-lg p-2 text-[#888] hover:bg-[#f2f2ef]"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>

        {/* MAIN */}

        <section className="min-w-0 flex-1">

          <header className="hidden h-20 items-center justify-between border-b border-[#e7e7e4] bg-white px-5 sm:px-8 lg:flex">

            <div>
              <p className="text-xs text-[#999]">
                Workspace
              </p>

              <h1 className="text-xl font-semibold">
                Tasks
              </h1>
            </div>

            <div className="flex items-center gap-2">

              {movingTask && (
                <span className="hidden text-xs text-[#888] sm:block">
                  Saving position...
                </span>
              )}

              <button className="rounded-xl p-2.5 text-[#666] hover:bg-[#f4f4f1]">
                <Bell size={18} />
              </button>

              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#191919] text-white">
                <User size={16} />
              </button>

            </div>

          </header>

          <div className="min-w-0 p-4 sm:p-6 lg:p-8">

            {/* DASHBOARD SUMMARY */}

            <section className="mb-8">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#999]">
                    Overview
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Workspace dashboard
                  </h2>
                  <p className="mt-1 text-sm text-[#888]">
                    A quick view of your workload and progress.
                  </p>
                </div>

                <div className="text-sm text-[#777]">
                  {dashboardStats.completionRate}% completed
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  onClick={() => {
                    setSearch("");
                    setProjectFilter("ALL");
                  }}
                  className="group rounded-2xl border border-[#e5e5e1] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#999]">
                      Total tasks
                    </span>
                    <span className="rounded-xl bg-[#f1f1ee] p-2 text-[#555]">
                      <Check size={16} />
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold">
                    {dashboardStats.total}
                  </p>
                  <p className="mt-1 text-xs text-[#999]">
                    Across all projects
                  </p>
                </button>

                <button
                  onClick={() => {
                    setSearch("");
                    setProjectFilter("ALL");
                    setView("board");
                  }}
                  className="group rounded-2xl border border-[#e5e5e1] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#999]">
                      In progress
                    </span>
                    <span className="rounded-xl bg-[#f1f1ee] p-2 text-[#555]">
                      <Circle size={16} />
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold">
                    {dashboardStats.doing}
                  </p>
                  <p className="mt-1 text-xs text-[#999]">
                    {dashboardStats.todo} still to do
                  </p>
                </button>

                <button
                  onClick={() => {
                    setSearch("");
                    setProjectFilter("ALL");
                    setView("board");
                  }}
                  className="group rounded-2xl border border-[#e5e5e1] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#999]">
                      Completed
                    </span>
                    <span className="rounded-xl bg-[#f1f1ee] p-2 text-[#555]">
                      <Check size={16} />
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold">
                    {dashboardStats.completed}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eeeeeb]">
                    <div
                      className="h-full rounded-full bg-[#191919] transition-all"
                      style={{ width: `${dashboardStats.completionRate}%` }}
                    />
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSearch("");
                    setProjectFilter("ALL");
                    setView("list");
                  }}
                  className="group rounded-2xl border border-[#e5e5e1] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#999]">
                      Attention
                    </span>
                    <span className="rounded-xl bg-red-50 p-2 text-red-600">
                      <CalendarDays size={16} />
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold">
                    {dashboardStats.overdue}
                  </p>
                  <p className="mt-1 text-xs text-[#999]">
                    {dashboardStats.onHold} on hold
                  </p>
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-2xl border border-[#e5e5e1] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Task progress</h3>
                      <p className="mt-1 text-xs text-[#999]">
                        Current distribution across your workflow.
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {dashboardStats.completionRate}%
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      ["To Do", dashboardStats.todo],
                      ["Doing", dashboardStats.doing],
                      ["Done", dashboardStats.completed],
                      ["On Hold", dashboardStats.onHold],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-[#f7f7f5] p-3">
                        <p className="text-[11px] text-[#999]">{label}</p>
                        <p className="mt-1 text-lg font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e5e5e1] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Projects</h3>
                      <p className="mt-1 text-xs text-[#999]">
                        Active workspace projects.
                      </p>
                    </div>
                    <Folder size={18} className="text-[#777]" />
                  </div>

                  <p className="mt-5 text-3xl font-semibold">
                    {projects.length}
                  </p>

                  <button
                    onClick={() => setShowProjectsPanel(true)}
                    className="mt-3 text-xs font-medium text-[#555] underline underline-offset-4"
                  >
                    Manage projects
                  </button>
                </div>
              </div>

              {dashboardStats.recentTasks.length > 0 && (
                <div className="mt-4 rounded-2xl border border-[#e5e5e1] bg-white">
                  <div className="flex items-center justify-between border-b border-[#eeeeeb] px-5 py-4">
                    <div>
                      <h3 className="text-sm font-semibold">Recent tasks</h3>
                      <p className="mt-1 text-xs text-[#999]">
                        Your latest task activity.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSearch("");
                        setProjectFilter("ALL");
                        setView("list");
                      }}
                      className="text-xs font-medium text-[#555] hover:underline"
                    >
                      View all
                    </button>
                  </div>

                  <div className="divide-y divide-[#eeeeeb]">
                    {dashboardStats.recentTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => openTask(task)}
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-[#fafaf8]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1f1ee]">
                          {task.status === "COMPLETED" ? (
                            <Check size={15} />
                          ) : (
                            <Circle size={12} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {task.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[#999]">
                            {projectName(task.projectId)} ·{" "}
                            {statusLabel(task.status)}
                          </p>
                        </div>

                        <span
                          className={`hidden rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide sm:inline-flex ${priorityClass(
                            task.priority,
                          )}`}
                        >
                          {priorityLabel(task.priority)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* TOOLBAR */}

            <div className="mb-7 flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

              <div>
                <h2 className="text-2xl font-semibold">
                  All tasks
                </h2>

                <p className="mt-1 text-sm text-[#888]">
                  Organize and track your work.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto">

                <div className="flex w-full items-center gap-2 rounded-xl border border-[#dededb] bg-white px-3 py-2.5 sm:w-auto">

                  <Search
                    size={16}
                    className="text-[#999]"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search tasks..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#aaa] sm:w-40 sm:flex-none"
                  />

                </div>

                <select
                  value={projectFilter}
                  onChange={(event) => setProjectFilter(event.target.value)}
                  className="w-full rounded-xl border border-[#dededb] bg-white px-3 py-2.5 text-sm outline-none sm:w-auto sm:max-w-48"
                >
                  <option value="ALL">All projects</option>
                  <option value="NONE">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowProjectsPanel(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#dededb] bg-white px-3.5 py-2.5 text-sm font-medium text-[#555] hover:bg-[#f7f7f5] sm:w-auto"
                >
                  <Folder size={16} />
                  Projects
                </button>

                <div className="flex w-full rounded-xl border border-[#dededb] bg-white p-1 sm:w-auto">

                  <button
                    onClick={() => setView("board")}
                    className={`rounded-lg p-2 ${
                      view === "board"
                        ? "bg-[#191919] text-white"
                        : "text-[#777]"
                    }`}
                  >
                    <LayoutGrid size={16} />
                  </button>

                  <button
                    onClick={() => setView("list")}
                    className={`rounded-lg p-2 ${
                      view === "list"
                        ? "bg-[#191919] text-white"
                        : "text-[#777]"
                    }`}
                  >
                    <List size={16} />
                  </button>

                </div>

                <button
                  onClick={() =>
                    setShowCreateModal(true)
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#191919] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#303030] sm:w-auto"
                >
                  <Plus size={17} />
                  New task
                </button>

              </div>
            </div>

            {/* LOADING */}

            {loading && (
              <div className="rounded-2xl border border-[#e5e5e1] bg-white p-12 text-center">

                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#ddd] border-t-[#191919]" />

                <p className="mt-3 text-sm text-[#888]">
                  Loading tasks...
                </p>

              </div>
            )}

            {/* BOARD */}

            {!loading && view === "board" && (

              <div className="overflow-x-auto pb-2">
                <div className="grid min-w-[1120px] grid-cols-4 gap-4">

                {columns.map((column) => {

                  const columnTasks =
                    tasksForStatus(column.key);

                  return (
                    <div
                      key={column.key}
                      onDragOver={(event) =>
                        handleDragOver(
                          event,
                          column.key,
                        )
                      }
                      onDragLeave={handleDragLeave}
                      onDrop={(event) =>
                        handleDrop(
                          event,
                          column.key,
                        )
                      }
                      className={`min-h-[420px] rounded-2xl border p-3 transition ${
                        dragOverStatus === column.key
                          ? "border-[#191919] bg-[#e4e4e0] shadow-inner"
                          : "border-[#e5e5e1] bg-[#efefec]"
                      }`}
                    >

                      <div className="mb-3 flex items-center justify-between px-1">

                        <div className="flex items-center gap-2">

                          <Circle
                            size={10}
                            className={
                              column.key === "COMPLETED"
                                ? "fill-[#555] text-[#555]"
                                : "text-[#999]"
                            }
                          />

                          <h3 className="text-sm font-semibold">
                            {column.label}
                          </h3>

                          <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] text-[#888]">
                            {columnTasks.length}
                          </span>

                        </div>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setNewStatus(column.key);
                            setShowCreateModal(true);
                          }}
                          className="rounded-lg p-1.5 text-[#888] hover:bg-white"
                        >
                          <Plus size={16} />
                        </button>

                      </div>

                      <div className="space-y-3">

                        {columnTasks.map((task) => (

                          <article
                            key={task.id}
                            draggable
                            onDragStart={(event) =>
                              handleDragStart(
                                event,
                                task.id,
                              )
                            }
                            onDragEnd={handleDragEnd}
                            onClick={() =>
                              openTask(task)
                            }
                            className={`group cursor-grab rounded-xl border border-[#e3e3df] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing ${
                              draggedTaskId === task.id
                                ? "scale-[0.98] opacity-50"
                                : ""
                            }`}
                          >

                            <div className="mb-3 flex items-start gap-2">

                              <GripVertical
                                size={16}
                                className="mt-0.5 shrink-0 text-[#c4c4c0] opacity-0 transition group-hover:opacity-100"
                              />

                              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">

                                <h4 className="text-sm font-semibold leading-5">
                                  {task.title}
                                </h4>

                                <ChevronDown
                                  size={15}
                                  className="rotate-[-90deg] shrink-0 text-[#aaa]"
                                />

                              </div>

                            </div>

                            {task.description && (
                              <p className="mb-4 line-clamp-2 text-xs leading-5 text-[#888]">
                                {task.description}
                              </p>
                            )}

                            <div className="mb-3 flex items-center gap-1.5 text-[11px] text-[#777]">
                              <Folder size={12} />
                              <span className="truncate">
                                {projectName(task.projectId)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">

                              <span
                                className={`rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${priorityClass(
                                  task.priority,
                                )}`}
                              >
                                {priorityLabel(
                                  task.priority,
                                )}
                              </span>

                              {task.dueDate && (
                                <span className="flex items-center gap-1 text-[11px] text-[#888]">
                                  <CalendarDays size={12} />
                                  {formatDate(
                                    task.dueDate,
                                  )}
                                </span>
                              )}

                            </div>

                          </article>

                        ))}

                        {columnTasks.length === 0 && (
                          <div
                            className={`rounded-xl border border-dashed px-4 py-8 text-center transition ${
                              dragOverStatus === column.key
                                ? "border-[#999] bg-white/60"
                                : "border-[#d5d5d1]"
                            }`}
                          >
                            <p className="text-xs text-[#aaa]">
                              {dragOverStatus === column.key
                                ? "Drop task here"
                                : "No tasks"}
                            </p>
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })}

                </div>
              </div>
            )}

            {/* LIST */}

            {!loading && view === "list" && (

              <div className="min-w-0 overflow-hidden rounded-2xl border border-[#e5e5e1] bg-white">

                <div className="hidden grid-cols-[1fr_130px_130px_130px] border-b border-[#eeeeeb] bg-[#fafaf8] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#999] md:grid">

                  <span>Task</span>
                  <span>Status</span>
                  <span>Priority</span>
                  <span>Due date</span>

                </div>

                {filteredTasks.map((task) => (

                  <div
                    key={task.id}
                    onClick={() =>
                      openTask(task)
                    }
                    className="cursor-pointer border-b border-[#eeeeeb] px-5 py-4 last:border-b-0 hover:bg-[#fafaf8] md:grid md:grid-cols-[1fr_130px_130px_130px_130px] md:items-center"
                  >

                    <div>
                      <p className="text-sm font-medium">
                        {task.title}
                      </p>

                      {task.description && (
                        <p className="mt-1 truncate text-xs text-[#999]">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <span className="mt-2 flex items-center gap-1.5 text-xs text-[#666] md:mt-0">
                      <Folder size={12} />
                      {projectName(task.projectId)}
                    </span>

                    <span className="mt-2 block text-xs text-[#666] md:mt-0">
                      {statusLabel(task.status)}
                    </span>

                    <span className="mt-1 block text-xs text-[#666] md:mt-0">
                      {priorityLabel(task.priority)}
                    </span>

                    <span className="mt-1 block text-xs text-[#888] md:mt-0">
                      {formatDate(task.dueDate)}
                    </span>

                  </div>
                ))}

                {filteredTasks.length === 0 && (
                  <div className="p-12 text-center text-sm text-[#999]">
                    No tasks found.
                  </div>
                )}

              </div>
            )}

          </div>
        </section>
      </div>

      {/* CREATE MODAL */}

      {showCreateModal && (

        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-3 py-3 backdrop-blur-[2px] sm:px-4 sm:py-10"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCreateModal();
            }
          }}
        >

          <div className="mx-auto my-auto w-full max-w-lg max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-5rem)]">

            <div className="flex items-start justify-between border-b border-[#eeeeeb] px-6 py-5">

              <div>
                <h2 className="text-lg font-semibold">
                  Create task
                </h2>

                <p className="mt-1 text-sm text-[#888]">
                  Add a new task to your workspace.
                </p>
              </div>

              <button
                onClick={closeCreateModal}
                className="rounded-lg p-2 text-[#888] hover:bg-[#f3f3f0]"
              >
                <X size={18} />
              </button>

            </div>

            <div className="space-y-5 px-6 py-6">

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#555]">
                  Task title
                </label>

                <input
                  value={newTitle}
                  onChange={(event) =>
                    setNewTitle(
                      event.target.value,
                    )
                  }
                  placeholder="What needs to be done?"
                  className="w-full rounded-xl border border-[#dededb] px-3.5 py-3 text-sm outline-none focus:border-[#999]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#555]">
                  Description
                </label>

                <textarea
                  value={newDescription}
                  onChange={(event) =>
                    setNewDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Add some details..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[#dededb] px-3.5 py-3 text-sm outline-none focus:border-[#999]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#555]">
                    Status
                  </label>

                  <select
                    value={newStatus}
                    onChange={(event) =>
                      setNewStatus(
                        event.target
                          .value as TaskStatus,
                      )
                    }
                    className="w-full rounded-xl border border-[#dededb] bg-white px-3 py-3 text-sm"
                  >
                    <option value="TODO">
                      To Do
                    </option>

                    <option value="DOING">
                      Doing
                    </option>

                    <option value="COMPLETED">
                      Completed
                    </option>

                    <option value="ON_HOLD">
                      On Hold
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#555]">
                    Priority
                  </label>

                  <select
                    value={newPriority}
                    onChange={(event) =>
                      setNewPriority(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-[#dededb] bg-white px-3 py-3 text-sm"
                  >
                    <option value="NO_PRIORITY">
                      No priority
                    </option>

                    <option value="LOW">
                      Low
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="URGENT">
                      Urgent
                    </option>
                  </select>
                </div>

              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#555]">
                  Project
                </label>

                <select
                  value={newProjectId}
                  onChange={(event) => setNewProjectId(event.target.value)}
                  className="w-full rounded-xl border border-[#dededb] bg-white px-3 py-3 text-sm"
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#555]">
                  Due date
                </label>

                <input
                  type="date"
                  value={newDueDate}
                  onChange={(event) =>
                    setNewDueDate(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#dededb] bg-white px-3 py-3 text-sm"
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 border-t border-[#eeeeeb] bg-[#fafaf8] px-6 py-4">

              <button
                onClick={closeCreateModal}
                disabled={creating}
                className="rounded-xl border border-[#dededb] bg-white px-4 py-2.5 text-sm font-medium text-[#555]"
              >
                Cancel
              </button>

              <button
                onClick={createTask}
                disabled={
                  creating ||
                  !newTitle.trim()
                }
                className="rounded-xl bg-[#191919] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {creating
                  ? "Creating..."
                  : "Create task"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* PROJECTS MODAL */}

      {showProjectsPanel && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-3 py-3 backdrop-blur-[2px] sm:px-4 sm:py-10"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowProjectsPanel(false);
              setEditingProjectId(null);
              setEditingProjectName("");
            }
          }}
        >
          <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[85vh]">
            <div className="flex items-start justify-between border-b border-[#eeeeeb] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">Projects</h2>
                <p className="mt-1 text-sm text-[#888]">
                  Create and manage your workspace projects.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowProjectsPanel(false);
                  setEditingProjectId(null);
                  setEditingProjectName("");
                }}
                className="rounded-lg p-2 text-[#888] hover:bg-[#f3f3f0]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div className="flex gap-2">
                <input
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      createProject();
                    }
                  }}
                  placeholder="New project name"
                  className="min-w-0 flex-1 rounded-xl border border-[#dededb] px-3.5 py-3 text-sm outline-none focus:border-[#999]"
                />
                <button
                  onClick={createProject}
                  disabled={creatingProject || !newProjectName.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#191919] px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                >
                  <Plus size={16} />
                  {creatingProject ? "Adding..." : "Add"}
                </button>
              </div>

              {projectsLoading ? (
                <div className="rounded-xl border border-[#eeeeeb] p-8 text-center text-sm text-[#999]">
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#d9d9d5] p-8 text-center">
                  <Folder className="mx-auto text-[#aaa]" size={22} />
                  <p className="mt-2 text-sm text-[#888]">
                    No projects yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-xl border border-[#e5e5e1] bg-[#fafaf8] p-3"
                    >
                      {editingProjectId === project.id ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={editingProjectName}
                            onChange={(event) =>
                              setEditingProjectName(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                saveProject(project.id);
                              }
                              if (event.key === "Escape") {
                                setEditingProjectId(null);
                                setEditingProjectName("");
                              }
                            }}
                            className="min-w-0 flex-1 rounded-lg border border-[#dededb] bg-white px-3 py-2 text-sm outline-none"
                          />
                          <button
                            onClick={() => saveProject(project.id)}
                            disabled={savingProject}
                            className="rounded-lg bg-[#191919] px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingProjectId(null);
                              setEditingProjectName("");
                            }}
                            className="rounded-lg border border-[#dededb] bg-white px-3 py-2 text-xs font-medium text-[#555]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#e5e5e1]">
                            <Folder size={16} />
                          </div>

                          <button
                            onClick={() => {
                              setProjectFilter(project.id);
                              setShowProjectsPanel(false);
                            }}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-sm font-medium">
                              {project.name}
                            </p>
                            <p className="mt-0.5 text-xs text-[#999]">
                              {tasks.filter(
                                (task) => task.projectId === project.id,
                              ).length}{" "}
                              task
                              {tasks.filter(
                                (task) => task.projectId === project.id,
                              ).length === 1
                                ? ""
                                : "s"}
                            </p>
                          </button>

                          <button
                            onClick={() => {
                              setEditingProjectId(project.id);
                              setEditingProjectName(project.name);
                            }}
                            className="rounded-lg p-2 text-[#888] hover:bg-white"
                            title="Edit project"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            onClick={() => deleteProject(project)}
                            className="rounded-lg p-2 text-[#999] hover:bg-red-50 hover:text-red-600"
                            title="Delete project"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-[#eeeeeb] bg-[#fafaf8] px-6 py-4">
              <button
                onClick={() => {
                  setShowProjectsPanel(false);
                  setEditingProjectId(null);
                  setEditingProjectName("");
                }}
                className="rounded-xl border border-[#dededb] bg-white px-4 py-2.5 text-sm font-medium text-[#555]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

            {/* TASK DETAILS / EDIT MODAL */}

      {selectedTask && (

        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-3 py-3 backdrop-blur-[2px] sm:px-4 sm:py-10"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeTaskModal();
            }
          }}
        >

          <div className="mx-auto my-auto max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-5rem)]">

            <div className="flex items-start justify-between border-b border-[#eeeeeb] px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f1ee]">
                  {editing ? (
                    <Pencil size={18} />
                  ) : (
                    <Check size={18} />
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    {editing
                      ? "Edit task"
                      : "Task details"}
                  </h2>

                  <p className="mt-1 text-xs text-[#888]">
                    {statusLabel(
                      selectedTask.status,
                    )}
                  </p>
                </div>

              </div>

              <button
                onClick={closeTaskModal}
                disabled={
                  saving || deleting
                }
                className="rounded-lg p-2 text-[#888] hover:bg-[#f3f3f0]"
              >
                <X size={18} />
              </button>

            </div>

            <div className="px-6 py-6">

              {!editing ? (

                <div className="space-y-6">

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#999]">
                      Title
                    </p>

                    <h3 className="text-xl font-semibold">
                      {selectedTask.title}
                    </h3>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#999]">
                      Description
                    </p>

                    <p className="text-sm leading-6 text-[#666]">
                      {selectedTask.description ||
                        "No description added."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className="rounded-xl bg-[#f7f7f5] p-4">
                      <p className="text-xs text-[#999]">
                        Status
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        {statusLabel(
                          selectedTask.status,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#f7f7f5] p-4">
                      <p className="text-xs text-[#999]">
                        Priority
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        {priorityLabel(
                          selectedTask.priority,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#f7f7f5] p-4">
                      <p className="text-xs text-[#999]">
                        Due date
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        {formatDate(
                          selectedTask.dueDate,
                        )}
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#999]">
                    <CalendarDays size={14} />

                    Created{" "}
                    {formatDate(
                      selectedTask.createdAt,
                    )}
                  </div>

                </div>

              ) : (

                <div className="space-y-5">

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#555]">
                      Task title
                    </label>

                    <input
                      value={editTitle}
                      onChange={(event) =>
                        setEditTitle(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-[#dededb] px-3.5 py-3 text-sm outline-none focus:border-[#999]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#555]">
                      Description
                    </label>

                    <textarea
                      value={editDescription}
                      onChange={(event) =>
                        setEditDescription(
                          event.target.value,
                        )
                      }
                      rows={5}
                      className="w-full resize-none rounded-xl border border-[#dededb] px-3.5 py-3 text-sm outline-none focus:border-[#999]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#555]">
                        Status
                      </label>

                      <select
                        value={editStatus}
                        onChange={(event) =>
                          setEditStatus(
                            event.target
                              .value as TaskStatus,
                          )
                        }
                        className="w-full rounded-xl border border-[#dededb] bg-white px-3 py-3 text-sm"
                      >
                        <option value="TODO">
                          To Do
                        </option>

                        <option value="DOING">
                          Doing
                        </option>

                        <option value="COMPLETED">
                          Completed
                        </option>

                        <option value="ON_HOLD">
                          On Hold
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#555]">
                        Priority
                      </label>

                      <select
                        value={editPriority}
                        onChange={(event) =>
                          setEditPriority(
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-[#dededb] bg-white px-3 py-3 text-sm"
                      >
                        <option value="NO_PRIORITY">
                          No priority
                        </option>

                        <option value="LOW">
                          Low
                        </option>

                        <option value="MEDIUM">
                          Medium
                        </option>

                        <option value="HIGH">
                          High
                        </option>

                        <option value="URGENT">
                          Urgent
                        </option>
                      </select>
                    </div>

                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#555]">
                      Project
                    </label>

                    <select
                      value={editProjectId}
                      onChange={(event) => setEditProjectId(event.target.value)}
                      className="w-full rounded-xl border border-[#dededb] bg-white px-3 py-3 text-sm"
                    >
                      <option value="">No project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#555]">
                      Due date
                    </label>

                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(event) =>
                        setEditDueDate(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-[#dededb] bg-white px-3 py-3 text-sm"
                    />
                  </div>

                </div>
              )}

              <div className="mt-7 border-t border-[#eeeeeb] pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  
              {/* LABELS */}

              <div className="mb-7 border-b border-[#eeeeeb] pb-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Labels</h3>
                    <p className="mt-1 text-xs text-[#999]">
                      Organize this task with labels.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowLabelPicker((value) => !value)}
                    disabled={labelsLoading || labelSaving}
                    className="rounded-lg border border-[#dededb] px-3 py-2 text-xs font-medium text-[#555] hover:bg-[#f5f5f2] disabled:opacity-50"
                  >
                    {showLabelPicker ? "Close" : "+ Add label"}
                  </button>
                </div>

                {labelsLoading ? (
                  <div className="rounded-xl border border-dashed border-[#dededb] px-4 py-4 text-center text-xs text-[#999]">
                    Loading labels...
                  </div>
                ) : taskLabels.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#dededb] bg-[#fafaf8] px-4 py-4 text-center text-xs text-[#999]">
                    No labels assigned.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {taskLabels.map((taskLabel) => (
                      <span
                        key={taskLabel.labelId}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f1ee] px-3 py-1.5 text-xs font-medium text-[#555]"
                      >
                        {taskLabel.label.name}
                        <button
                          onClick={() =>
                            void removeLabelFromTask(taskLabel.labelId)
                          }
                          disabled={labelSaving}
                          className="rounded-full text-[#999] hover:text-[#333] disabled:opacity-50"
                          title={`Remove ${taskLabel.label.name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {showLabelPicker && (
                  <div className="mt-3 rounded-xl border border-[#e5e5e1] bg-[#fafaf8] p-3">
                    <div className="flex gap-2">
                      <input
                        value={newLabelName}
                        onChange={(event) =>
                          setNewLabelName(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void createAndAssignLabel();
                          }
                        }}
                        placeholder="Create a new label..."
                        className="min-w-0 flex-1 rounded-lg border border-[#dededb] bg-white px-3 py-2 text-xs outline-none focus:border-[#999]"
                      />
                      <button
                        onClick={() => void createAndAssignLabel()}
                        disabled={labelSaving || !newLabelName.trim()}
                        className="rounded-lg bg-[#191919] px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Create
                      </button>
                    </div>

                    {allLabels.filter(
                      (label) =>
                        !taskLabels.some(
                          (taskLabel) => taskLabel.labelId === label.id,
                        ),
                    ).length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#999]">
                          Existing labels
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {allLabels
                            .filter(
                              (label) =>
                                !taskLabels.some(
                                  (taskLabel) =>
                                    taskLabel.labelId === label.id,
                                ),
                            )
                            .map((label) => (
                              <button
                                key={label.id}
                                onClick={() =>
                                  void assignLabelToTask(label.id)
                                }
                                disabled={labelSaving}
                                className="rounded-full border border-[#dededb] bg-white px-3 py-1.5 text-xs font-medium text-[#555] hover:bg-[#f1f1ee] disabled:opacity-50"
                              >
                                + {label.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

<div>
                    <h3 className="text-sm font-semibold">Subtasks</h3>
                    <p className="mt-1 text-xs text-[#999]">
                      {subtasks.filter((item) => item.completed).length} of{" "}
                      {subtasks.length} completed
                    </p>
                  </div>

                  {subtasks.length > 0 && (
                    <span className="text-xs font-medium text-[#777]">
                      {Math.round(
                        (subtasks.filter((item) => item.completed).length /
                          subtasks.length) *
                          100,
                      )}%
                    </span>
                  )}
                </div>

                {subtasks.length > 0 && (
                  <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#eeeeeb]">
                    <div
                      className="h-full rounded-full bg-[#191919] transition-all"
                      style={{
                        width: `${
                          (subtasks.filter((item) => item.completed).length /
                            subtasks.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {subtasksLoading ? (
                    <div className="rounded-xl border border-[#eeeeeb] bg-[#fafaf8] px-4 py-5 text-center text-xs text-[#999]">
                      Loading subtasks...
                    </div>
                  ) : subtasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#dededb] bg-[#fafaf8] px-4 py-5 text-center text-xs text-[#999]">
                      No subtasks yet.
                    </div>
                  ) : (
                    subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-3 rounded-xl border border-[#e8e8e4] bg-white px-3 py-3"
                      >
                        <button
                          onClick={() => void toggleSubtask(subtask)}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
                            subtask.completed
                              ? "border-[#191919] bg-[#191919] text-white"
                              : "border-[#d8d8d4] bg-white text-transparent hover:border-[#999]"
                          }`}
                          title={
                            subtask.completed
                              ? "Mark incomplete"
                              : "Mark complete"
                          }
                        >
                          <Check size={14} />
                        </button>

                        <span
                          className={`min-w-0 flex-1 text-sm ${
                            subtask.completed
                              ? "text-[#999] line-through"
                              : "text-[#333]"
                          }`}
                        >
                          {subtask.title}
                        </span>

                        <button
                          onClick={() => void deleteSubtask(subtask.id)}
                          className="rounded-lg p-2 text-[#aaa] hover:bg-red-50 hover:text-red-600"
                          title="Delete subtask"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={newSubtaskTitle}
                    onChange={(event) =>
                      setNewSubtaskTitle(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void addSubtask();
                      }
                    }}
                    placeholder="Add a subtask..."
                    className="min-w-0 flex-1 rounded-xl border border-[#dededb] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#999]"
                  />

                  <button
                    onClick={() => void addSubtask()}
                    disabled={
                      addingSubtask || !newSubtaskTitle.trim()
                    }
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-[#191919] px-4 py-3 text-sm font-medium text-white hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={15} />
                    {addingSubtask ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>

              {/* COMMENTS */}

              <div className="mt-7 border-t border-[#eeeeeb] pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Comments</h3>
                    <p className="mt-1 text-xs text-[#999]">
                      {comments.length}{" "}
                      {comments.length === 1 ? "comment" : "comments"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {commentsLoading ? (
                    <div className="rounded-xl border border-[#eeeeeb] bg-[#fafaf8] px-4 py-5 text-center text-xs text-[#999]">
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#dededb] bg-[#fafaf8] px-4 py-5 text-center text-xs text-[#999]">
                      No comments yet.
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="rounded-xl border border-[#e8e8e4] bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#191919] text-xs font-semibold text-white">
                            {(comment.author?.name || "G").charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-xs font-semibold text-[#333]">
                                {comment.author?.name || "Guest User"}
                              </span>
                              <span className="text-[10px] text-[#aaa]">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>

                            {editingCommentId === comment.id ? (
                              <div className="mt-3">
                                <textarea
                                  value={editingCommentText}
                                  onChange={(event) => setEditingCommentText(event.target.value)}
                                  rows={3}
                                  className="w-full resize-none rounded-xl border border-[#dededb] bg-[#fafaf8] px-3 py-2.5 text-sm outline-none focus:border-[#999]"
                                />
                                <div className="mt-2 flex justify-end gap-2">
                                  <button
                                    onClick={cancelEditingComment}
                                    className="rounded-lg border border-[#dededb] px-3 py-2 text-xs font-medium text-[#555] hover:bg-[#f7f7f5]"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => void saveComment(comment.id)}
                                    disabled={!editingCommentText.trim()}
                                    className="rounded-lg bg-[#191919] px-3 py-2 text-xs font-medium text-white hover:bg-[#303030] disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#555]">
                                {comment.content}
                              </p>
                            )}
                          </div>

                          {editingCommentId !== comment.id && (
                            <div className="flex shrink-0 gap-1">
                              <button
                                onClick={() => startEditingComment(comment)}
                                className="rounded-lg p-2 text-[#aaa] hover:bg-[#f3f3f0] hover:text-[#555]"
                                title="Edit comment"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => void deleteComment(comment.id)}
                                className="rounded-lg p-2 text-[#aaa] hover:bg-red-50 hover:text-red-600"
                                title="Delete comment"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4">
                  <textarea
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                        event.preventDefault();
                        void addComment();
                      }
                    }}
                    rows={3}
                    placeholder="Write a comment..."
                    className="w-full resize-none rounded-xl border border-[#dededb] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#999]"
                  />

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#aaa]">Ctrl + Enter to post</span>
                    <button
                      onClick={() => void addComment()}
                      disabled={addingComment || !newComment.trim()}
                      className="rounded-xl bg-[#191919] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {addingComment ? "Posting..." : "Post comment"}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeeeb] bg-[#fafaf8] px-6 py-4">

              <button
                onClick={deleteTask}
                disabled={
                  saving || deleting
                }
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={16} />

                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>

              <div className="flex gap-2">

                <button
                  onClick={() => {
                    if (editing) {
                      setEditing(false);

                      setEditTitle(
                        selectedTask.title,
                      );

                      setEditDescription(
                        selectedTask.description ??
                          "",
                      );

                      setEditStatus(
                        selectedTask.status,
                      );

                      setEditPriority(
                        selectedTask.priority,
                      );

                      setEditDueDate(
                        selectedTask.dueDate
                          ? selectedTask.dueDate.substring(
                              0,
                              10,
                            )
                          : "",
                      );
                      setEditProjectId(
                        selectedTask.projectId ?? "",
                      );
                    } else {
                      closeTaskModal();
                    }
                  }}
                  disabled={
                    saving || deleting
                  }
                  className="rounded-xl border border-[#dededb] bg-white px-4 py-2.5 text-sm font-medium text-[#555]"
                >
                  {editing
                    ? "Cancel"
                    : "Close"}
                </button>

                {!editing ? (

                  <button
                    onClick={() =>
                      setEditing(true)
                    }
                    disabled={
                      saving || deleting
                    }
                    className="flex items-center gap-2 rounded-xl bg-[#191919] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#303030]"
                  >
                    <Pencil size={15} />
                    Edit task
                  </button>

                ) : (

                  <button
                    onClick={updateTask}
                    disabled={
                      saving ||
                      deleting ||
                      !editTitle.trim()
                    }
                    className="rounded-xl bg-[#191919] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#303030] disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save changes"}
                  </button>

                )}

              </div>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
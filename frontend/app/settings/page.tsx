"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LogOut,
  Moon,
  Sun,
  User,
  Wifi,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "../theme-provider";

const API_URL = "http://127.0.0.1:4000";

type StoredUser = {
  id?: string;
  name?: string;
  email?: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(
    null,
  );
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadStoredUser();
    void checkBackend();
  }, []);

  function loadStoredUser() {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setUser(null);
        return;
      }

      const parsedUser = JSON.parse(storedUser);

      if (parsedUser && typeof parsedUser === "object") {
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to load stored user:", error);
      setUser(null);
    }
  }

  function clearSession() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    // Remove this as well in case an older version of the
    // application stored the token under this key.
    localStorage.removeItem("token");
  }

  async function checkBackend() {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token || token === "null" || token === "undefined") {
        setBackendOnline(false);
        return;
      }

      const response = await fetch(`${API_URL}/projects`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (response.status === 401) {
        clearSession();
        setUser(null);
        setBackendOnline(false);
        return;
      }

      setBackendOnline(response.ok);
    } catch (error) {
      console.error("Backend connection check failed:", error);
      setBackendOnline(false);
    }
  }

  function logout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      // Remove the complete local authentication session.
      clearSession();

      // Clear the local user state immediately.
      setUser(null);

      // Send the user to the actual login page.
      // replace() prevents the protected Settings page
      // from remaining in browser history.
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);

      // Make a second cleanup attempt.
      clearSession();

      // Hard redirect as a fallback.
      window.location.replace("/");
    }
  }

  function goBackToTasks() {
    router.push("/tasks");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#191919]">
      <header className="sticky top-0 z-30 border-b border-[#e7e7e4] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-5xl items-center gap-3 px-5 sm:px-8">
          <button
            onClick={goBackToTasks}
            className="rounded-xl p-2.5 text-[#666] hover:bg-[#f2f2ef]"
            title="Back to Tasks"
            type="button"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <p className="text-xs text-[#999]">Workspace</p>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#999]">
            Preferences
          </p>

          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Account & Settings
          </h2>

          <p className="mt-2 text-sm text-[#888]">
            Manage your current account and application session.
          </p>
        </div>

        <div className="space-y-5">
          {/* PROFILE */}
          <section className="rounded-2xl border border-[#e5e5e1] bg-white shadow-sm">
  <div className="border-b border-[#eeeeeb] p-5 sm:p-6">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f1ee]">
        {theme === "dark" ? (
          <Moon size={19} className="text-[#555]" />
        ) : (
          <Sun size={19} className="text-[#555]" />
        )}
      </div>

      <div>
        <h3 className="font-semibold">Appearance</h3>
        <p className="text-xs text-[#999]">
          Choose how the application looks.
        </p>
      </div>
    </div>
  </div>

  <div className="p-5 sm:p-6">
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
          theme === "light"
            ? "border-[#191919] bg-[#fafaf8]"
            : "border-[#e5e5e1] bg-white hover:bg-[#fafaf8]"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f1ee]">
          <Sun size={18} />
        </div>

        <div>
          <p className="text-sm font-medium">Light</p>
          <p className="mt-1 text-xs text-[#999]">
            Use the light appearance.
          </p>
        </div>

        {theme === "light" && (
          <CheckCircle2 size={17} className="ml-auto" />
        )}
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
          theme === "dark"
            ? "border-[#191919] bg-[#fafaf8]"
            : "border-[#e5e5e1] bg-white hover:bg-[#fafaf8]"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f1ee]">
          <Moon size={18} />
        </div>

        <div>
          <p className="text-sm font-medium">Dark</p>
          <p className="mt-1 text-xs text-[#999]">
            Use the dark appearance.
          </p>
        </div>

        {theme === "dark" && (
          <CheckCircle2 size={17} className="ml-auto" />
        )}
      </button>
    </div>
  </div>
</section>

          <section className="rounded-2xl border border-[#e5e5e1] bg-white shadow-sm">
            <div className="border-b border-[#eeeeeb] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f1ee]">
                  <User size={19} className="text-[#555]" />
                </div>

                <div>
                  <h3 className="font-semibold">Profile</h3>

                  <p className="text-xs text-[#999]">
                    Information for the current session
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <div className="rounded-xl bg-[#fafaf8] p-4">
                <p className="text-xs text-[#999]">Name</p>

                <p className="mt-1 text-sm font-medium">
                  {user?.name || "Guest User"}
                </p>
              </div>

              <div className="rounded-xl bg-[#fafaf8] p-4">
                <p className="text-xs text-[#999]">Email</p>

                <p className="mt-1 break-all text-sm font-medium">
                  {user?.email || "Not available"}
                </p>
              </div>

              <div className="rounded-xl bg-[#fafaf8] p-4 sm:col-span-2">
                <p className="text-xs text-[#999]">User ID</p>

                <p className="mt-1 break-all font-mono text-xs text-[#555]">
                  {user?.id || "Not available"}
                </p>
              </div>
            </div>
          </section>

          {/* CONNECTION */}

          <section className="rounded-2xl border border-[#e5e5e1] bg-white shadow-sm">
            <div className="border-b border-[#eeeeeb] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f1ee]">
                  <Wifi size={19} className="text-[#555]" />
                </div>

                <div>
                  <h3 className="font-semibold">Connection</h3>

                  <p className="text-xs text-[#999]">
                    Current backend connection
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
              <div>
                <p className="text-sm font-medium">API server</p>

                <p className="mt-1 text-xs text-[#999]">
                  {API_URL}
                </p>
              </div>

              {backendOnline === true ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                  <CheckCircle2 size={15} />
                  Connected
                </div>
              ) : backendOnline === false ? (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  <XCircle size={15} />
                  Offline
                </div>
              ) : (
                <div className="rounded-lg bg-[#f1f1ee] px-3 py-2 text-xs font-medium text-[#777]">
                  Checking...
                </div>
              )}
            </div>
          </section>

          {/* SESSION */}

          <section className="rounded-2xl border border-[#e5e5e1] bg-white shadow-sm">
            <div className="border-b border-[#eeeeeb] p-5 sm:p-6">
              <h3 className="font-semibold">Session</h3>

              <p className="mt-1 text-xs text-[#999]">
                Sign out from this browser.
              </p>
            </div>

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-sm font-medium">Log out</p>

                <p className="mt-1 text-xs text-[#999]">
                  Your local access token and stored user information will
                  be removed.
                </p>
              </div>

              <button
                onClick={logout}
                disabled={loggingOut}
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#191919] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut size={16} />

                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </section>

          {/* APPLICATION */}

          <section className="rounded-2xl border border-[#e5e5e1] bg-white p-5 shadow-sm sm:p-6">
            <h3 className="font-semibold">Application</h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#fafaf8] p-4">
                <p className="text-xs text-[#999]">
                  Application
                </p>

                <p className="mt-1 text-sm font-medium">
                  Task Management System
                </p>
              </div>

              <div className="rounded-xl bg-[#fafaf8] p-4">
                <p className="text-xs text-[#999]">
                  Environment
                </p>

                <p className="mt-1 text-sm font-medium">
                  Local Development
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
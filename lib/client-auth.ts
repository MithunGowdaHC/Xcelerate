"use client"

type Session = { email: string }

const USERS_KEY = "mock_users"
const SESSION_KEY = "mock_session"

const defaultUsers = [{ email: "demo@adc.labs", password: "demo123" }]

function ensureSeed() {
  if (typeof window === "undefined") return
  const existing = localStorage.getItem(USERS_KEY)
  if (!existing) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null
  ensureSeed()
  const s = localStorage.getItem(SESSION_KEY)
  return s ? (JSON.parse(s) as Session) : null
}

export function login(email: string, password: string): { ok: boolean; error?: string } {
  ensureSeed()
  const raw = localStorage.getItem(USERS_KEY)
  const users = raw ? (JSON.parse(raw) as Array<{ email: string; password: string }>) : []
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
  if (!found) {
    return { ok: false, error: "Invalid credentials" }
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: found.email }))
  return { ok: true }
}

export function register(email: string, password: string): { ok: boolean; error?: string } {
  ensureSeed()
  const raw = localStorage.getItem(USERS_KEY)
  const users = raw ? (JSON.parse(raw) as Array<{ email: string; password: string }>) : []
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "User already exists" }
  }
  users.push({ email, password })
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }))
  return { ok: true }
}

export function logout() {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
}

export function socialLogin(provider: "google"): { ok: boolean; error?: string } {
  try {
    if (provider !== "google") return { ok: false, error: "Unsupported provider" }
    const email = "google-user@example.com"
    localStorage.setItem("mock_session", JSON.stringify({ email }))
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Login failed" }
  }
}

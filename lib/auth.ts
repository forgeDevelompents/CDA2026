import { cookies, headers } from "next/headers"

export type SessionUser = {
  id: string
  username: string
  nombre?: string
  rol?: string
  cargo?: string
}

export function parseSession(raw?: string): SessionUser | null {
  if (!raw) return null

  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  // Primary: use Next's cookies helper (can be async in newer versions)
  try {
    const store = await cookies()
    const raw = typeof store.get === "function" ? store.get("simple_session")?.value : undefined
    const parsed = parseSession(raw)
    if (parsed) return parsed
  } catch {
    // noop, fallback to manual parsing below
  }

  // Fallback: parse cookie header manually (for runtimes where cookies().get isn't available)
  const cookieHeader = (await headers().get("cookie")) || ""
  const raw = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("simple_session="))
    ?.split("=")
    .slice(1)
    .join("=")

  return parseSession(raw)
}

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { SessionUser } from "@/lib/auth"

export function useSession(options: { redirectToLogin?: boolean } = { redirectToLogin: true }) {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/session")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user as SessionUser)
        } else if (options.redirectToLogin) {
          router.push("/auth/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [options.redirectToLogin, router])

  return { user, isLoading }
}

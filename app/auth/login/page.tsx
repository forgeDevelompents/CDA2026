"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"

export default function Page() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState("/logo-clavaris.jpg")
  const router = useRouter()

  useEffect(() => {
    // Fetch logo from configuration
    const fetchLogo = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("configuracion").select("valor").eq("clave", "logo_url").limit(1)

      if (data && data.length > 0 && data[0]?.valor) {
        setLogoUrl(data[0].valor)
      }
    }

    fetchLogo()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Credenciales incorrectas")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-[#0b1220] via-[#0f1f37] to-[#0b1220] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md animate-in fade-in duration-500 relative">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#32d2ff] to-[#7c7dff] opacity-30 blur-3xl group-hover:opacity-50 transition-opacity duration-500" />

              <div className="relative w-48 h-48 rounded-full bg-white/8 p-1.5 shadow-[0_0_30px_rgba(50,210,255,0.28),0_0_50px_rgba(124,125,255,0.25)] ring-4 ring-white/10 group-hover:shadow-[0_0_45px_rgba(50,210,255,0.4),0_0_70px_rgba(124,125,255,0.35)] group-hover:scale-105 transition-all duration-500 animate-in zoom-in">
                <div className="absolute inset-1 rounded-full border border-white/14" />

                <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white/5">
                  <Image
                    src={logoUrl || "/placeholder.svg"}
                    alt="CDA 2026 Logo"
                    width={192}
                    height={192}
                    className="object-cover h-full w-full rounded-full mix-blend-screen"
                  />
                </div>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-14 bg-gradient-to-b from-white/30 to-transparent rounded-full blur-md" />
              </div>
            </div>
          </div>

          <Card className="border-white/10 shadow-2xl bg-[rgba(12,18,32,0.7)] backdrop-blur-xl">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-2xl text-white tracking-tight">Iniciar Sesión</CardTitle>
              <CardDescription className="text-slate-300">Clavaris de la Divina Aurora 2026</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username" className="text-slate-200">
                      Usuario
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Introduce tu usuario"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="border-white/10 bg-white/5 text-white placeholder:text-slate-400 focus:border-[#32d2ff] focus:ring-[#32d2ff]"
                      autoComplete="username"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-slate-200">
                      Contraseña
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-white/10 bg-white/5 text-white placeholder:text-slate-400 focus:border-[#32d2ff] focus:ring-[#32d2ff]"
                      autoComplete="current-password"
                    />
                  </div>
                  {error && (
                    <div className="text-sm text-red-300 bg-red-500/10 p-3 rounded-md border border-red-500/30">
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff] transition-all duration-300 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <p className="text-center text-sm text-white/80">Solo para miembros del grupo CDA 2026</p>
        </div>
      </div>
    </div>
  )
}

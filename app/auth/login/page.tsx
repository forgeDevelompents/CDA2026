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
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("username", username)
        .limit(1)

      if (userError || !userData || userData.length === 0) {
        throw new Error("Usuario no encontrado. Verifica tu nombre de usuario.")
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: userData[0].email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Contraseña incorrecta")
        }
        throw error
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
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-[#1C3A63] via-[#2F5E9A] to-[#1C3A63]">
      <div className="w-full max-w-md animate-in fade-in duration-500">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              {/* Sombra exterior difusa */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8CB4E1] to-[#2F5E9A] opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-500" />

              {/* Contenedor circular principal con sombras */}
              <div className="relative w-52 h-52 rounded-full bg-white p-4 shadow-[0_0_30px_rgba(140,180,225,0.4),0_0_60px_rgba(47,94,154,0.3)] ring-4 ring-white/20 group-hover:shadow-[0_0_40px_rgba(140,180,225,0.6),0_0_80px_rgba(47,94,154,0.4)] group-hover:scale-105 transition-all duration-500 animate-in zoom-in">
                {/* Borde interior decorativo */}
                <div className="absolute inset-2 rounded-full border-2 border-[#8CB4E1]/30" />

                {/* Logo */}
                <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white">
                  <Image
                    src={logoUrl || "/placeholder.svg"}
                    alt="CDA 2026 Logo"
                    width={160}
                    height={160}
                    className="object-contain p-2"
                  />
                </div>

                {/* Brillo superior sutil */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-16 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-md" />
              </div>
            </div>
          </div>

          <Card className="border-[#8CB4E1]/20 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-[#1C3A63]">Iniciar Sesión</CardTitle>
              <CardDescription className="text-[#2B2B2B]">Clavaris de la Divina Aurora 2026</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username" className="text-[#1C3A63]">
                      Usuario
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Introduce tu usuario"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="border-[#8CB4E1]/50 focus:border-[#2F5E9A]"
                      autoComplete="username"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-[#1C3A63]">
                      Contraseña
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-[#8CB4E1]/50 focus:border-[#2F5E9A]"
                      autoComplete="current-password"
                    />
                  </div>
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-[#2F5E9A] hover:bg-[#1C3A63] transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>

                  <div className="text-xs text-center text-[#2B2B2B]/60 pt-2 border-t border-[#8CB4E1]/20">
                    Usuarios de prueba: <strong>admin</strong> / <strong>miembro</strong>
                  </div>
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

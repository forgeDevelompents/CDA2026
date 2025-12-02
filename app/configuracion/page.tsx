"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Save } from "lucide-react"
import type { Configuracion, Informacion } from "@/lib/types"
import Image from "next/image"
import { useSession } from "@/hooks/use-session"
import type { SessionUser } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/lib/types"

export default function Page() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const { user: sessionUser, isLoading: sessionLoading } = useSession()
  const [usersData, setUsersData] = useState<User[]>([])
  const [cargosOptions, setCargosOptions] = useState<string[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [newUser, setNewUser] = useState({
    nombre: "",
    username: "",
    email: "",
    password: "",
    cargo: "",
  })

  const [configData, setConfigData] = useState({
    logo_url: "",
    nombre_grupo: "",
    pueblo: "",
  })

  const [infoData, setInfoData] = useState({
    quienes_somos: "",
    que_hacemos: "",
  })

  useEffect(() => {
    if (!sessionLoading && sessionUser) {
      setCurrentUser(sessionUser)

      // Only roles with config permission can access
      if (!hasPermission(sessionUser, "config:manage")) {
        window.location.href = "/dashboard"
        return
      }

      fetchData()
    }
  }, [sessionLoading, sessionUser])

  const fetchData = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setIsUsersLoading(true)

    const { data: configDataResult, error: configError } = await supabase.from("configuracion").select("*")

    const { data: infoDataResult, error: infoError } = await supabase.from("informacion").select("*")

    const { data: usersResult } = await supabase
      .from("users")
      .select("id, email, username, nombre, rol, cargo")
      .order("nombre")

    const { data: cargosResult } = await supabase.from("cargos").select("cargo").order("cargo")

    // Map configuration
    const configMap: Record<string, string> = {}
    if (configDataResult) {
      configDataResult.forEach((item: Configuracion) => {
        configMap[item.clave] = item.valor || ""
      })
    }

    setConfigData({
      logo_url: configMap.logo_url || "/logo-clavaris.jpg",
      nombre_grupo: configMap.nombre_grupo || "Clavaris de la Divina Aurora 2026",
      pueblo: configMap.pueblo || "Benifaió",
    })

    // Map information
    const infoMap: Record<string, string> = {}
    if (infoDataResult) {
      infoDataResult.forEach((item: Informacion) => {
        infoMap[item.seccion] = item.contenido || ""
      })
    }

    setInfoData({
      quienes_somos: infoMap.quienes_somos || "",
      que_hacemos: infoMap.que_hacemos || "",
    })

    setUsersData((usersResult as User[]) || [])
    setCargosOptions((cargosResult || []).map((c) => c.cargo).filter(Boolean))

    setIsLoading(false)
    setIsUsersLoading(false)
  }

  const handleSaveConfig = async () => {
    if (!hasPermission(currentUser, "config:manage")) return
    const supabase = createClient()
    setIsSaving(true)
    setMessage(null)

    try {
      // Update configuration
      await Promise.all([
        supabase.from("configuracion").update({ valor: configData.logo_url }).eq("clave", "logo_url"),
        supabase.from("configuracion").update({ valor: configData.nombre_grupo }).eq("clave", "nombre_grupo"),
        supabase.from("configuracion").update({ valor: configData.pueblo }).eq("clave", "pueblo"),
      ])

      // Update information
      await Promise.all([
        supabase.from("informacion").update({ contenido: infoData.quienes_somos }).eq("seccion", "quienes_somos"),
        supabase.from("informacion").update({ contenido: infoData.que_hacemos }).eq("seccion", "que_hacemos"),
      ])

      setMessage({ type: "success", text: "Configuración guardada correctamente" })

      // Reload after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      setMessage({ type: "error", text: "Error al guardar la configuración" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateCargo = async (userId: string, cargo: string) => {
    if (!hasPermission(currentUser, "config:manage")) return
    const supabase = createClient()
    const { error } = await supabase.from("users").update({ cargo }).eq("id", userId)
    if (error) {
      setMessage({ type: "error", text: "Error al actualizar cargo" })
      return
    }
    setUsersData((prev) => prev.map((u) => (u.id === userId ? { ...u, cargo } : u)))
    setMessage({ type: "success", text: "Cargo actualizado" })
  }

  const handleCreateUser = async () => {
    if (!hasPermission(currentUser, "config:manage")) return
    const supabase = createClient()
    setMessage(null)

    if (!newUser.nombre || !newUser.username || !newUser.email || !newUser.password) {
      setMessage({ type: "error", text: "Completa nombre, usuario, email y contraseña" })
      return
    }

    const generatedId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined

    const { error } = await supabase.from("users").insert({
      id: generatedId,
      nombre: newUser.nombre,
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      rol: "miembro",
      cargo: newUser.cargo || null,
    })

    if (error) {
      setMessage({ type: "error", text: `Error al crear usuario: ${error.message}` })
      return
    }

    setMessage({ type: "success", text: "Usuario creado" })
    setNewUser({ nombre: "", username: "", email: "", password: "", cargo: "" })
    fetchData()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#E7ECF3]">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-4 lg:p-8">
          <p className="text-center text-[#2B2B2B]/60 py-8">Cargando configuración...</p>
        </main>
      </div>
    )
  }

  if (!hasPermission(currentUser, "config:manage")) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-[#E7ECF3]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1C3A63] text-balance">Configuración</h1>
              <p className="text-[#2B2B2B]/70 mt-1">Personaliza la aplicación</p>
            </div>
            <Button onClick={handleSaveConfig} disabled={isSaving} className="bg-[#2F5E9A] hover:bg-[#1C3A63]">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>

          {message && (
            <Card
              className={`border-2 ${message.type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
            >
              <CardContent className="pt-6">
                <p className={`text-sm font-medium ${message.type === "success" ? "text-green-800" : "text-red-800"}`}>
                  {message.text}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Logo Configuration */}
          <Card className="border-[#8CB4E1]/20">
            <CardHeader>
              <CardTitle className="text-lg text-[#1C3A63] flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#2F5E9A]" />
                Logo del Grupo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo_url">URL del Logo</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={configData.logo_url}
                  onChange={(e) => setConfigData({ ...configData, logo_url: e.target.value })}
                  placeholder="https://ejemplo.com/logo.png"
                />
                <p className="text-xs text-[#2B2B2B]/60 mt-1">Introduce la URL de la imagen del logo</p>
              </div>
              {configData.logo_url && (
                <div className="flex justify-center p-4 bg-[#E7ECF3] rounded-lg">
                  <Image
                    src={configData.logo_url || "/placeholder.svg"}
                    alt="Vista previa del logo"
                    width={200}
                    height={80}
                    className="object-contain"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* General Configuration */}
          <Card className="border-[#8CB4E1]/20">
            <CardHeader>
              <CardTitle className="text-lg text-[#1C3A63]">Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nombre_grupo">Nombre del Grupo</Label>
                <Input
                  id="nombre_grupo"
                  value={configData.nombre_grupo}
                  onChange={(e) => setConfigData({ ...configData, nombre_grupo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pueblo">Pueblo</Label>
                <Input
                  id="pueblo"
                  value={configData.pueblo}
                  onChange={(e) => setConfigData({ ...configData, pueblo: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Information Content */}
          <Card className="border-[#8CB4E1]/20">
            <CardHeader>
              <CardTitle className="text-lg text-[#1C3A63]">Contenido de Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quienes_somos">Quiénes Somos</Label>
                <Textarea
                  id="quienes_somos"
                  value={infoData.quienes_somos}
                  onChange={(e) => setInfoData({ ...infoData, quienes_somos: e.target.value })}
                  rows={5}
                />
              </div>
              <div>
                <Label htmlFor="que_hacemos">Qué Hacemos</Label>
                <Textarea
                  id="que_hacemos"
                  value={infoData.que_hacemos}
                  onChange={(e) => setInfoData({ ...infoData, que_hacemos: e.target.value })}
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Gestión de usuarios */}
          <Card className="border-[#8CB4E1]/20">
            <CardHeader>
              <CardTitle className="text-lg text-[#1C3A63]">Usuarios y Cargos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#1C3A63]">Usuarios existentes</h3>
                {isUsersLoading ? (
                  <p className="text-sm text-[#2B2B2B]/60">Cargando usuarios...</p>
                ) : usersData.length === 0 ? (
                  <p className="text-sm text-[#2B2B2B]/60">No hay usuarios</p>
                ) : (
                  <div className="space-y-2">
                    {usersData.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-[#8CB4E1]/20"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1C3A63] truncate">
                            {user.nombre} <span className="text-[#2B2B2B]/60">({user.username})</span>
                          </p>
                          <p className="text-xs text-[#2B2B2B]/60 truncate">{user.email}</p>
                          <p className="text-xs text-[#2B2B2B]/60">Rol: {user.rol}</p>
                        </div>
                        <div className="w-full sm:w-56">
                      <Label className="text-xs text-[#2B2B2B]/70">Cargo</Label>
                          <Select
                            value={user.cargo || "none"}
                            onValueChange={(value) => handleUpdateCargo(user.id, value === "none" ? "" : value)}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Sin cargo" />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              className="bg-white border border-[#8CB4E1]/40 shadow-lg rounded-md"
                            >
                              <SelectItem value="none">Sin cargo</SelectItem>
                              {cargosOptions.map((cargo) => (
                                <SelectItem key={cargo} value={cargo}>
                                  {cargo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-3 border-t border-[#8CB4E1]/20">
                <h3 className="text-sm font-semibold text-[#1C3A63]">Crear nuevo usuario</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="nuevo_nombre">Nombre</Label>
                    <Input
                      id="nuevo_nombre"
                      value={newUser.nombre}
                      onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nuevo_username">Usuario</Label>
                    <Input
                      id="nuevo_username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="usuario"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nuevo_email">Email</Label>
                    <Input
                      id="nuevo_email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nuevo_password">Contraseña</Label>
                    <Input
                      id="nuevo_password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Contraseña"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cargo</Label>
                    <Select
                      value={newUser.cargo || "none"}
                      onValueChange={(value) => setNewUser({ ...newUser, cargo: value === "none" ? "" : value })}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Sin cargo" />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className="bg-white border border-[#8CB4E1]/40 shadow-lg rounded-md"
                      >
                        <SelectItem value="none">Sin cargo</SelectItem>
                        {cargosOptions.map((cargo) => (
                          <SelectItem key={cargo} value={cargo}>
                            {cargo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleCreateUser} className="bg-[#2F5E9A] hover:bg-[#1C3A63]">
                    Crear usuario
                  </Button>
                </div>
                <p className="text-xs text-[#2B2B2B]/60">
                  Nota: se crea con rol "miembro" y la contraseña se almacena tal cual (sin hash).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#2F5E9A] bg-[#2F5E9A]/5">
            <CardContent className="pt-6">
              <p className="text-sm text-[#1C3A63]">
                <strong>Nota:</strong> Los cambios se aplicarán inmediatamente después de guardar y recargar la página.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

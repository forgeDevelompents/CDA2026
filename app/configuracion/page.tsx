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
import type { User, Configuracion, Informacion } from "@/lib/types"
import Image from "next/image"

export default function Page() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

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
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

      setCurrentUser(userData as User)

      // Only admins can access this page
      if (userData?.rol !== "admin") {
        window.location.href = "/dashboard"
        return
      }
    }

    const { data: configDataResult, error: configError } = await supabase.from("configuracion").select("*")

    const { data: infoDataResult, error: infoError } = await supabase.from("informacion").select("*")

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

    setIsLoading(false)
  }

  const handleSaveConfig = async () => {
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

  if (currentUser?.rol !== "admin") {
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

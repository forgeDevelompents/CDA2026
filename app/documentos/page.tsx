"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Download, FileText, File, ImageIcon } from "lucide-react"
import type { Documento, User } from "@/lib/types"
import { useSession } from "@/hooks/use-session"
import type { SessionUser } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"

export default function Page() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const { user: sessionUser, isLoading: sessionLoading } = useSession()

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    url: "",
  })

  useEffect(() => {
    if (!sessionLoading && sessionUser) {
      setCurrentUser(sessionUser)
      fetchData()
    }
  }, [sessionLoading, sessionUser])

  const fetchData = async () => {
    const supabase = createClient()
    setIsLoading(true)

    const { data: documentosData } = await supabase
      .from("documentos")
      .select("*")
      .order("created_at", { ascending: false })

    const { data: usersData } = await supabase.from("users").select("*")

    setDocumentos((documentosData as Documento[]) || [])
    setUsers((usersData as User[]) || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !canManageDocumentos) return

    const supabase = createClient()

    const tipo = formData.url.split(".").pop()?.toLowerCase()

    await supabase.from("documentos").insert({
      nombre: formData.nombre,
      descripcion: formData.descripcion || null,
      url: formData.url,
      tipo: tipo || null,
      subido_por: currentUser.id,
    })

    setIsDialogOpen(false)
    resetForm()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!canManageDocumentos) return
    if (!confirm("¿Estás seguro de que quieres eliminar este documento?")) return

    const supabase = createClient()
    await supabase.from("documentos").delete().eq("id", id)
    fetchData()
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      url: "",
    })
  }

  const canManageDocumentos = hasPermission(currentUser, "documentos:manage")

  const getFileIcon = (tipo?: string) => {
    if (!tipo) return <File className="h-5 w-5 text-[#2F5E9A]" />

    const imageTipos = ["jpg", "jpeg", "png", "gif", "webp", "svg"]

    if (imageTipos.includes(tipo)) {
      return <ImageIcon className="h-5 w-5 text-[#2F5E9A]" />
    }

    return <FileText className="h-5 w-5 text-[#2F5E9A]" />
  }

  return (
    <div className="flex min-h-screen bg-[#E7ECF3]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1C3A63] text-balance">Documentos</h1>
              <p className="text-[#2B2B2B]/70 mt-1">Archivos y documentación del grupo</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}>
                {viewMode === "list" ? "Vista Tarjetas" : "Vista Lista"}
              </Button>
              {canManageDocumentos && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#2F5E9A] hover:bg-[#1C3A63]">
                      <Plus className="h-4 w-4 mr-2" />
                      Subir Documento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-[#1C3A63]">Subir Documento</DialogTitle>
                      <DialogDescription>Añade un nuevo documento compartido</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="nombre">Nombre del documento</Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                          id="descripcion"
                          value={formData.descripcion}
                          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="url">URL del documento</Label>
                        <Input
                          id="url"
                          type="url"
                          value={formData.url}
                          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                          placeholder="https://ejemplo.com/documento.pdf"
                          required
                        />
                        <p className="text-xs text-[#2B2B2B]/60 mt-1">Introduce la URL del archivo alojado en la nube</p>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1 bg-[#2F5E9A] hover:bg-[#1C3A63]">
                          Subir Documento
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Documents Display */}
          {isLoading ? (
            <p className="text-center text-[#2B2B2B]/60 py-8">Cargando documentos...</p>
          ) : documentos.length === 0 ? (
            <Card className="border-[#8CB4E1]/20">
              <CardContent className="py-12">
                <p className="text-center text-[#2B2B2B]/60">No hay documentos subidos</p>
              </CardContent>
            </Card>
          ) : viewMode === "list" ? (
            <Card className="border-[#8CB4E1]/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#1C3A63]">Todos los Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documentos.map((doc) => {
                    const uploader = users.find((u) => u.id === doc.subido_por)

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-[#8CB4E1]/20 hover:bg-[#E7ECF3]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getFileIcon(doc.tipo || undefined)}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#1C3A63] truncate">{doc.nombre}</h3>
                            {doc.descripcion && <p className="text-sm text-[#2B2B2B]/70 truncate">{doc.descripcion}</p>}
                            <p className="text-xs text-[#2B2B2B]/60 mt-1">
                              Subido por {uploader?.nombre || "Desconocido"} el{" "}
                              {new Date(doc.created_at).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button variant="outline" size="icon" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          {canManageDocumentos && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(doc.id)}
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentos.map((doc) => {
                const uploader = users.find((u) => u.id === doc.subido_por)

                return (
                  <Card key={doc.id} className="hover-lift border-[#8CB4E1]/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getFileIcon(doc.tipo || undefined)}
                          <CardTitle className="text-base text-[#1C3A63] truncate">{doc.nombre}</CardTitle>
                        </div>
                        {canManageDocumentos && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(doc.id)}
                            className="h-8 w-8 hover:bg-red-50 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {doc.descripcion && <p className="text-sm text-[#2B2B2B]/70 line-clamp-2">{doc.descripcion}</p>}
                      <div className="text-xs text-[#2B2B2B]/60">
                        <p>Subido por {uploader?.nombre || "Desconocido"}</p>
                        <p>{new Date(doc.created_at).toLocaleDateString("es-ES")}</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

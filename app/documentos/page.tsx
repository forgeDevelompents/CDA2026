"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
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
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a1224] via-[#0f1c36] to-[#090f1c] text-white">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flow-in">
            <div>
              <p className="uppercase text-xs tracking-[0.2em] text-[#5ee1ff]">Archivos</p>
              <h1 className="text-3xl font-bold text-white text-balance">Documentos</h1>
              <p className="text-slate-300 mt-1">Repositorio compartido del grupo</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}>
                {viewMode === "list" ? "Vista Tarjetas" : "Vista Lista"}
              </Button>
              {canManageDocumentos && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
                      <Plus className="h-4 w-4 mr-2" />
                      Subir Documento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md border-white/10 bg-white/5 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-white">Subir Documento</DialogTitle>
                      <DialogDescription className="text-slate-300">
                        Añade un nuevo documento compartido
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="nombre">Nombre del documento</Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          required
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                          id="descripcion"
                          value={formData.descripcion}
                          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                          rows={3}
                          className="bg-white/5 border-white/10 text-white"
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
                          className="bg-white/5 border-white/10 text-white"
                        />
                        <p className="text-xs text-slate-300 mt-1">Introduce la URL del archivo alojado en la nube</p>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1 bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
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
          </header>

          {isLoading ? (
            <p className="text-center text-slate-400">Cargando documentos...</p>
          ) : documentos.length === 0 ? (
            <section className="band p-6 text-center text-slate-400">No hay documentos subidos</section>
          ) : viewMode === "list" ? (
            <section className="band p-4 md:p-6 space-y-3 flow-in">
              <div className="flex items-center gap-2 text-sm text-slate-300">Todos los documentos</div>
              <div className="space-y-2">
                {documentos.map((doc, idx) => {
                  const uploader = users.find((u) => u.id === doc.subido_por)

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-4 flow-in"
                      style={{ animationDelay: `${0.03 * idx}s` }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(doc.tipo || undefined)}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{doc.nombre}</h3>
                          {doc.descripcion && <p className="text-sm text-slate-300 truncate">{doc.descripcion}</p>}
                          <p className="text-xs text-slate-400 mt-1">
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
                            className="hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : (
            <section className="band p-4 md:p-6 flow-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {documentos.map((doc, idx) => {
                  const uploader = users.find((u) => u.id === doc.subido_por)

                  return (
                    <div
                      key={doc.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 flow-in"
                      style={{ animationDelay: `${0.03 * idx}s` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getFileIcon(doc.tipo || undefined)}
                          <h3 className="text-base font-semibold text-white truncate">{doc.nombre}</h3>
                        </div>
                        {canManageDocumentos && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(doc.id)}
                            className="hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        )}
                      </div>
                      {doc.descripcion && <p className="text-sm text-slate-300 line-clamp-2">{doc.descripcion}</p>}
                      <div className="text-xs text-slate-400">
                        <p>Subido por {uploader?.nombre || "Desconocido"}</p>
                        <p>{new Date(doc.created_at).toLocaleDateString("es-ES")}</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </a>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

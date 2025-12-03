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
import { Plus, Pencil, Trash2, CalendarIcon, MapPin } from "lucide-react"
import type { Evento } from "@/lib/types"
import { useSession } from "@/hooks/use-session"
import type { SessionUser } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"

export default function Page() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user: sessionUser, isLoading: sessionLoading } = useSession()

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    ubicacion: "",
    tipo: "",
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

    const { data: eventosData } = await supabase.from("eventos").select("*").order("fecha_inicio", { ascending: true })

    setEventos((eventosData as Evento[]) || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageCalendario) return
    const supabase = createClient()

    const eventoData = {
      titulo: formData.titulo,
      descripcion: formData.descripcion || null,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin || null,
      ubicacion: formData.ubicacion || null,
      tipo: formData.tipo || null,
    }

    if (editingEvento) {
      await supabase.from("eventos").update(eventoData).eq("id", editingEvento.id)
    } else {
      await supabase.from("eventos").insert(eventoData)
    }

    setIsDialogOpen(false)
    resetForm()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!canManageCalendario) return
    if (!confirm("¿Estás seguro de que quieres eliminar este evento?")) return

    const supabase = createClient()
    await supabase.from("eventos").delete().eq("id", id)
    fetchData()
  }

  const handleEdit = (evento: Evento) => {
    setEditingEvento(evento)
    setFormData({
      titulo: evento.titulo,
      descripcion: evento.descripcion || "",
      fecha_inicio: evento.fecha_inicio.slice(0, 16),
      fecha_fin: evento.fecha_fin ? evento.fecha_fin.slice(0, 16) : "",
      ubicacion: evento.ubicacion || "",
      tipo: evento.tipo || "",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingEvento(null)
    setFormData({
      titulo: "",
      descripcion: "",
      fecha_inicio: "",
      fecha_fin: "",
      ubicacion: "",
      tipo: "",
    })
  }

  const canManageCalendario = hasPermission(currentUser, "calendario:manage")

  // Separate upcoming and past events
  const now = new Date().toISOString()
  const upcomingEvents = eventos.filter((e) => e.fecha_inicio >= now)
  const pastEvents = eventos.filter((e) => e.fecha_inicio < now)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a1224] via-[#0f1c36] to-[#090f1c] text-white">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flow-in">
            <div>
              <p className="uppercase text-xs tracking-[0.2em] text-[#5ee1ff]">Agenda</p>
              <h1 className="text-3xl font-bold text-white text-balance">Calendario</h1>
              <p className="text-slate-300 mt-1">Eventos y actividades del grupo</p>
            </div>
            {canManageCalendario && (
              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open)
                  if (!open) resetForm()
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-white/10 bg-white/5 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {editingEvento ? "Editar Evento" : "Nuevo Evento"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-300">
                      {editingEvento ? "Modifica los datos del evento" : "Añade un nuevo evento al calendario"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="titulo">Título</Label>
                      <Input
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
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
                      <Label htmlFor="fecha_inicio">Fecha y hora de inicio</Label>
                      <Input
                        id="fecha_inicio"
                        type="datetime-local"
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                        required
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fecha_fin">Fecha y hora de fin (opcional)</Label>
                      <Input
                        id="fecha_fin"
                        type="datetime-local"
                        value={formData.fecha_fin}
                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ubicacion">Ubicación</Label>
                      <Input
                        id="ubicacion"
                        value={formData.ubicacion}
                        onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                        placeholder="Ej: Plaza del Ayuntamiento"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo de evento</Label>
                      <Input
                        id="tipo"
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        placeholder="Ej: Reunión, Celebración, Actividad..."
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
                        {editingEvento ? "Guardar Cambios" : "Crear Evento"}
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

          <section className="band p-4 md:p-6 space-y-4 flow-in">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CalendarIcon className="h-5 w-5 text-[#5ee1ff]" />
              Próximos eventos
            </div>
            {isLoading ? (
              <p className="text-slate-400">Cargando eventos...</p>
            ) : upcomingEvents.length === 0 ? (
              <p className="text-slate-400">No hay eventos próximos</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((evento, idx) => (
                  <div
                    key={evento.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2 flow-in"
                    style={{ animationDelay: `${0.05 * idx}s` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#5ee1ff]">
                          {evento.tipo || "Evento"}
                        </p>
                        <h3 className="text-xl font-semibold text-white">{evento.titulo}</h3>
                        {evento.descripcion && <p className="text-slate-300 text-sm">{evento.descripcion}</p>}
                      </div>
                      {canManageCalendario && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(evento)}
                            className="hover:bg-white/10"
                          >
                            <Pencil className="h-4 w-4 text-[#5ee1ff]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(evento.id)}
                            className="hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                      <span className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-[#5ee1ff]" />
                        {new Date(evento.fecha_inicio).toLocaleString("es-ES", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      {evento.ubicacion && (
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#5ee1ff]" />
                          {evento.ubicacion}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {pastEvents.length > 0 && (
            <section className="band p-4 md:p-6 space-y-4 flow-in flow-in-delay-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CalendarIcon className="h-5 w-5 text-[#5ee1ff]" />
                Eventos pasados
              </div>
              <div className="space-y-2">
                {pastEvents.slice(0, 6).map((evento, idx) => (
                  <div
                    key={evento.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl p-3"
                    style={{ animationDelay: `${0.05 * idx}s` }}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{evento.titulo}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(evento.fecha_inicio).toLocaleString("es-ES", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    {canManageCalendario && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(evento.id)}
                        className="hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

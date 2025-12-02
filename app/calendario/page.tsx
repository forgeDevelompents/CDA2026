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
import { Plus, Pencil, Trash2, CalendarIcon, MapPin } from "lucide-react"
import type { Evento, User } from "@/lib/types"

export default function Page() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    ubicacion: "",
    tipo: "",
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
    }

    const { data: eventosData } = await supabase.from("eventos").select("*").order("fecha_inicio", { ascending: true })

    setEventos((eventosData as Evento[]) || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  const isAdmin = currentUser?.rol === "admin"

  // Separate upcoming and past events
  const now = new Date().toISOString()
  const upcomingEvents = eventos.filter((e) => e.fecha_inicio >= now)
  const pastEvents = eventos.filter((e) => e.fecha_inicio < now)

  return (
    <div className="flex min-h-screen bg-[#E7ECF3]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1C3A63] text-balance">Calendario</h1>
              <p className="text-[#2B2B2B]/70 mt-1">Eventos y actividades del grupo</p>
            </div>
            {isAdmin && (
              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open)
                  if (!open) resetForm()
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-[#2F5E9A] hover:bg-[#1C3A63]">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-[#1C3A63]">
                      {editingEvento ? "Editar Evento" : "Nuevo Evento"}
                    </DialogTitle>
                    <DialogDescription>
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
                      <Label htmlFor="fecha_inicio">Fecha y hora de inicio</Label>
                      <Input
                        id="fecha_inicio"
                        type="datetime-local"
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fecha_fin">Fecha y hora de fin (opcional)</Label>
                      <Input
                        id="fecha_fin"
                        type="datetime-local"
                        value={formData.fecha_fin}
                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ubicacion">Ubicación</Label>
                      <Input
                        id="ubicacion"
                        value={formData.ubicacion}
                        onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                        placeholder="Ej: Plaza del Ayuntamiento"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo de evento</Label>
                      <Input
                        id="tipo"
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        placeholder="Ej: Reunión, Celebración, Actividad..."
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-[#2F5E9A] hover:bg-[#1C3A63]">
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

          {/* Próximos Eventos */}
          <Card className="border-[#8CB4E1]/20">
            <CardHeader>
              <CardTitle className="text-lg text-[#1C3A63] flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#2F5E9A]" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-[#2B2B2B]/60 py-8">Cargando eventos...</p>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-center text-[#2B2B2B]/60 py-8">No hay eventos próximos</p>
              ) : (
                <div className="grid gap-4">
                  {upcomingEvents.map((evento) => (
                    <div
                      key={evento.id}
                      className="p-4 rounded-lg border border-[#8CB4E1]/20 bg-gradient-to-br from-white to-[#E7ECF3]/30 hover-lift"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="text-lg font-semibold text-[#1C3A63]">{evento.titulo}</h3>
                          {evento.descripcion && <p className="text-sm text-[#2B2B2B]/70">{evento.descripcion}</p>}
                          <div className="flex flex-wrap gap-4 text-sm text-[#2B2B2B]/70">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4 text-[#2F5E9A]" />
                              {new Date(evento.fecha_inicio).toLocaleString("es-ES", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </div>
                            {evento.ubicacion && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-[#2F5E9A]" />
                                {evento.ubicacion}
                              </div>
                            )}
                            {evento.tipo && (
                              <span className="px-2 py-1 bg-[#2F5E9A]/10 text-[#1C3A63] rounded-md text-xs">
                                {evento.tipo}
                              </span>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(evento)}
                              className="hover:bg-[#2F5E9A]/10"
                            >
                              <Pencil className="h-4 w-4 text-[#2F5E9A]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(evento.id)}
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Eventos Pasados */}
          {pastEvents.length > 0 && (
            <Card className="border-[#8CB4E1]/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#1C3A63]">Eventos Pasados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {pastEvents.slice(0, 5).map((evento) => (
                    <div
                      key={evento.id}
                      className="p-4 rounded-lg border border-[#8CB4E1]/20 bg-[#E7ECF3]/30 opacity-75"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="text-lg font-semibold text-[#1C3A63]">{evento.titulo}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-[#2B2B2B]/70">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4 text-[#2F5E9A]" />
                              {new Date(evento.fecha_inicio).toLocaleString("es-ES", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(evento.id)}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

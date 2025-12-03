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
import { Plus, Pencil, Trash2, Shield } from "lucide-react"
import type { Norma } from "@/lib/types"
import { useSession } from "@/hooks/use-session"
import type { SessionUser } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"

export default function Page() {
  const [normas, setNormas] = useState<Norma[]>([])
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNorma, setEditingNorma] = useState<Norma | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user: sessionUser, isLoading: sessionLoading } = useSession()

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
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

    const { data: normasData } = await supabase.from("normas").select("*").order("orden", { ascending: true })

    setNormas((normasData as Norma[]) || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageNormas) return
    const supabase = createClient()

    const normaData = {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
    }

    if (editingNorma) {
      await supabase.from("normas").update(normaData).eq("id", editingNorma.id)
    } else {
      await supabase.from("normas").insert(normaData)
    }

    setIsDialogOpen(false)
    resetForm()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!canManageNormas) return
    if (!confirm("¿Estás seguro de que quieres eliminar esta norma?")) return

    const supabase = createClient()
    await supabase.from("normas").delete().eq("id", id)
    fetchData()
  }

  const handleEdit = (norma: Norma) => {
    setEditingNorma(norma)
    setFormData({
      titulo: norma.titulo,
      descripcion: norma.descripcion,
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingNorma(null)
    setFormData({
      titulo: "",
      descripcion: "",
    })
  }

  const canManageNormas = hasPermission(currentUser, "normas:manage")

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a1224] via-[#0f1c36] to-[#090f1c] text-white">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flow-in">
            <div>
              <p className="uppercase text-xs tracking-[0.2em] text-[#5ee1ff]">Convivencia</p>
              <h1 className="text-3xl font-bold text-white text-balance">Normas Internas</h1>
              <p className="text-slate-300 mt-1">Reglas y directrices del grupo</p>
            </div>
            {canManageNormas && (
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
                    Nueva Norma
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md border-white/10 bg-white/5 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">{editingNorma ? "Editar Norma" : "Nueva Norma"}</DialogTitle>
                    <DialogDescription className="text-slate-300">
                      {editingNorma ? "Modifica el contenido de la norma" : "Añade una nueva norma interna"}
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
                        rows={5}
                        required
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
                        {editingNorma ? "Guardar Cambios" : "Crear Norma"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </header>

          <section className="band p-4 md:p-6 space-y-4 flow-in flow-in-delay-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Shield className="h-5 w-5 text-[#5ee1ff]" />
              Normas activas
            </div>
            {isLoading ? (
              <p className="text-slate-400">Cargando normas...</p>
            ) : normas.length === 0 ? (
              <p className="text-slate-400">No hay normas registradas</p>
            ) : (
              <div className="space-y-3">
                {normas.map((norma, index) => (
                  <div
                    key={norma.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 flow-in"
                    style={{ animationDelay: `${0.04 * index}s` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.25em] text-[#5ee1ff]">
                          #{String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="text-lg font-semibold text-white">{norma.titulo}</h3>
                      </div>
                      {canManageNormas && (
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(norma)}
                            className="hover:bg-white/10"
                          >
                            <Pencil className="h-4 w-4 text-[#5ee1ff]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(norma.id)}
                            className="hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{norma.descripcion}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

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
import { Plus, Pencil, Trash2, Shield } from "lucide-react"
import type { Norma, User } from "@/lib/types"

export default function Page() {
  const [normas, setNormas] = useState<Norma[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNorma, setEditingNorma] = useState<Norma | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
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

    const { data: normasData } = await supabase.from("normas").select("*").order("orden", { ascending: true })

    setNormas((normasData as Norma[]) || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  const isAdmin = currentUser?.rol === "admin"

  return (
    <div className="flex min-h-screen bg-[#E7ECF3]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1C3A63] text-balance">Normas Internas</h1>
              <p className="text-[#2B2B2B]/70 mt-1">Reglas y directrices del grupo</p>
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
                    Nueva Norma
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-[#1C3A63]">
                      {editingNorma ? "Editar Norma" : "Nueva Norma"}
                    </DialogTitle>
                    <DialogDescription>
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
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-[#2F5E9A] hover:bg-[#1C3A63]">
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
          </div>

          {/* Normas List */}
          <div className="grid gap-4">
            {isLoading ? (
              <p className="text-center text-[#2B2B2B]/60 py-8">Cargando normas...</p>
            ) : normas.length === 0 ? (
              <p className="text-center text-[#2B2B2B]/60 py-8">No hay normas registradas</p>
            ) : (
              normas.map((norma, index) => (
                <Card key={norma.id} className="hover-lift border-[#8CB4E1]/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#2F5E9A]/10 flex-shrink-0">
                          <Shield className="h-5 w-5 text-[#2F5E9A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg text-[#1C3A63] text-balance">
                            {index + 1}. {norma.titulo}
                          </CardTitle>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(norma)}
                            className="hover:bg-[#2F5E9A]/10"
                          >
                            <Pencil className="h-4 w-4 text-[#2F5E9A]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(norma.id)}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#2B2B2B] leading-relaxed whitespace-pre-wrap">{norma.descripcion}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

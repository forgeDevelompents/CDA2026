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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, UserCircle } from "lucide-react"
import type { Cargo, User } from "@/lib/types"
import { useSession } from "@/hooks/use-session"
import type { SessionUser } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"

export default function Page() {
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user: sessionUser, isLoading: sessionLoading } = useSession()

  const [formData, setFormData] = useState({
    user_id: "",
    cargo: "",
    observaciones: "",
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

    const { data: cargosData } = await supabase.from("cargos").select("*").order("created_at", { ascending: false })

    const { data: usersData } = await supabase.from("users").select("*").order("nombre")

    setCargos((cargosData as Cargo[]) || [])
    setUsers((usersData as User[]) || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageCargos) return
    const supabase = createClient()

    const cargoData = {
      user_id: formData.user_id || null,
      cargo: formData.cargo,
      observaciones: formData.observaciones || null,
    }

    if (editingCargo) {
      await supabase.from("cargos").update(cargoData).eq("id", editingCargo.id)
    } else {
      await supabase.from("cargos").insert(cargoData)
    }

    setIsDialogOpen(false)
    resetForm()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!canManageCargos) return
    if (!confirm("¿Estás seguro de que quieres eliminar este cargo?")) return

    const supabase = createClient()
    await supabase.from("cargos").delete().eq("id", id)
    fetchData()
  }

  const handleEdit = (cargo: Cargo) => {
    setEditingCargo(cargo)
    setFormData({
      user_id: cargo.user_id || "",
      cargo: cargo.cargo,
      observaciones: cargo.observaciones || "",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingCargo(null)
    setFormData({
      user_id: "",
      cargo: "",
      observaciones: "",
    })
  }

  const canManageCargos = hasPermission(currentUser, "cargos:manage")

  return (
    <div className="flex min-h-screen bg-[#E7ECF3]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1C3A63] text-balance">Cargos del Año</h1>
              <p className="text-[#2B2B2B]/70 mt-1">Organización y responsabilidades</p>
            </div>
            {canManageCargos && (
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
                    Asignar Cargo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-[#1C3A63]">
                      {editingCargo ? "Editar Cargo" : "Nuevo Cargo"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCargo ? "Modifica la asignación del cargo" : "Asigna un nuevo cargo a un miembro"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="cargo">Cargo</Label>
                      <Input
                        id="cargo"
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                        placeholder="Ej: Presidente, Secretario, Tesorero..."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_id">Miembro (opcional)</Label>
                      <Select
                        value={formData.user_id}
                        onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un miembro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="observaciones">Observaciones</Label>
                      <Textarea
                        id="observaciones"
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        rows={3}
                        placeholder="Responsabilidades o notas adicionales..."
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-[#2F5E9A] hover:bg-[#1C3A63]">
                        {editingCargo ? "Guardar Cambios" : "Asignar Cargo"}
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

          {/* Cargos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <p className="col-span-full text-center text-[#2B2B2B]/60 py-8">Cargando cargos...</p>
            ) : cargos.length === 0 ? (
              <p className="col-span-full text-center text-[#2B2B2B]/60 py-8">No hay cargos asignados</p>
            ) : (
              cargos.map((cargo) => {
                const user = users.find((u) => u.id === cargo.user_id)
                return (
                  <Card
                    key={cargo.id}
                    className="hover-lift border-[#8CB4E1]/20 bg-gradient-to-br from-white to-[#E7ECF3]/30"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-5 w-5 text-[#2F5E9A]" />
                          <CardTitle className="text-lg text-[#1C3A63]">{cargo.cargo}</CardTitle>
                        </div>
                        {canManageCargos && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(cargo)}
                              className="h-8 w-8 hover:bg-[#2F5E9A]/10"
                            >
                              <Pencil className="h-4 w-4 text-[#2F5E9A]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(cargo.id)}
                              className="h-8 w-8 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-[#2B2B2B]/70 mb-1">Asignado a:</p>
                          <p className="font-semibold text-[#1C3A63]">{user ? user.nombre : "Sin asignar"}</p>
                        </div>
                        {cargo.observaciones && (
                          <div>
                            <p className="text-sm text-[#2B2B2B]/70 mb-1">Observaciones:</p>
                            <p className="text-sm text-[#2B2B2B]">{cargo.observaciones}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

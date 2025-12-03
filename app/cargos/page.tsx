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
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a1224] via-[#0f1c36] to-[#090f1c] text-white">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flow-in">
            <div>
              <p className="uppercase text-xs tracking-[0.2em] text-[#5ee1ff]">Organización</p>
              <h1 className="text-3xl font-bold text-white text-balance">Cargos del Año</h1>
              <p className="text-slate-300 mt-1">Quién hace qué dentro del grupo</p>
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
                  <Button className="bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
                    <Plus className="h-4 w-4 mr-2" />
                    Asignar Cargo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md border-white/10 bg-white/5 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">{editingCargo ? "Editar Cargo" : "Nuevo Cargo"}</DialogTitle>
                    <DialogDescription className="text-slate-300">
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
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_id">Miembro (opcional)</Label>
                      <Select
                        value={formData.user_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, user_id: value === "none" ? "" : value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Selecciona un miembro" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a1224] border-white/10 text-white">
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
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
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
          </header>

          <section className="band p-4 md:p-6 flow-in">
            <div className="flex flex-wrap gap-6 text-sm text-slate-300">
              <div>
                <p className="uppercase text-[10px] tracking-[0.25em] text-[#5ee1ff]">Total cargos</p>
                <p className="text-2xl font-semibold text-white">{cargos.length}</p>
              </div>
              <div>
                <p className="uppercase text-[10px] tracking-[0.25em] text-[#5ee1ff]">Miembros</p>
                <p className="text-2xl font-semibold text-white">{users.length}</p>
              </div>
              <div>
                <p className="uppercase text-[10px] tracking-[0.25em] text-[#5ee1ff]">Asignados</p>
                <p className="text-2xl font-semibold text-white">
                  {cargos.filter((c) => c.user_id).length}
                </p>
              </div>
            </div>
          </section>

          <section className="band p-4 md:p-6 space-y-3 flow-in flow-in-delay-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <UserCircle className="h-5 w-5 text-[#5ee1ff]" />
              Roles y responsables
            </div>
            {isLoading ? (
              <p className="text-slate-400">Cargando cargos...</p>
            ) : cargos.length === 0 ? (
              <p className="text-slate-400">No hay cargos asignados</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {cargos.map((cargo, idx) => {
                  const user = users.find((u) => u.id === cargo.user_id)
                  return (
                    <div
                      key={cargo.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 flow-in"
                      style={{ animationDelay: `${0.04 * idx}s` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.2em] text-[#5ee1ff]">Cargo</p>
                          <h3 className="text-lg font-semibold text-white">{cargo.cargo}</h3>
                          <p className="text-sm text-slate-300">{user ? user.nombre : "Sin asignar"}</p>
                        </div>
                        {canManageCargos && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(cargo)}
                              className="hover:bg-white/10"
                            >
                              <Pencil className="h-4 w-4 text-[#5ee1ff]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(cargo.id)}
                              className="hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {cargo.observaciones && (
                        <p className="text-sm text-slate-300 leading-relaxed">{cargo.observaciones}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

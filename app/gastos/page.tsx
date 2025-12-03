 "use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Receipt } from "lucide-react"
import type { Gasto, User } from "@/lib/types"
import { useSession } from "@/hooks/use-session"
import type { SessionUser } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { createClient } from "@/lib/supabase/client"

export default function Page() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user: sessionUser, isLoading: sessionLoading } = useSession()

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    concepto: "",
    cantidad: "",
    categoria: "",
    pagado_por: "",
    notas: "",
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

    const { data: gastosData } = await supabase.from("gastos").select("*").order("fecha", { ascending: false })

    const { data: usersData } = await supabase.from("users").select("*").order("nombre")

    setGastos((gastosData as Gasto[]) || [])
    setUsers((usersData as User[]) || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    const gastoData = {
      fecha: formData.fecha,
      concepto: formData.concepto,
      cantidad: Number.parseFloat(formData.cantidad),
      categoria: formData.categoria || null,
      pagado_por: formData.pagado_por || null,
      notas: formData.notas || null,
    }

    if (editingGasto) {
      await supabase.from("gastos").update(gastoData).eq("id", editingGasto.id)
    } else {
      await supabase.from("gastos").insert(gastoData)
    }

    setIsDialogOpen(false)
    resetForm()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este gasto?")) return

    const supabase = createClient()
    await supabase.from("gastos").delete().eq("id", id)
    fetchData()
  }

  const handleEdit = (gasto: Gasto) => {
    setEditingGasto(gasto)
    setFormData({
      fecha: gasto.fecha,
      concepto: gasto.concepto,
      cantidad: gasto.cantidad.toString(),
      categoria: gasto.categoria || "",
      pagado_por: gasto.pagado_por || "",
      notas: gasto.notas || "",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingGasto(null)
    setFormData({
      fecha: new Date().toISOString().split("T")[0],
      concepto: "",
      cantidad: "",
      categoria: "",
      pagado_por: "",
      notas: "",
    })
  }

  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.cantidad), 0)
  const canManageGastos = hasPermission(currentUser, "gastos:manage")

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a1224] via-[#0f1c36] to-[#090f1c] text-white">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flow-in">
            <div>
              <p className="uppercase text-xs tracking-[0.2em] text-[#5ee1ff]">Finanzas</p>
              <h1 className="text-3xl font-bold text-white text-balance">Gastos</h1>
              <p className="text-slate-300 mt-1">Gestión de gastos del grupo</p>
            </div>
            {canManageGastos && (
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
                    Añadir Gasto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-white/10 bg-white/5 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">{editingGasto ? "Editar Gasto" : "Nuevo Gasto"}</DialogTitle>
                    <DialogDescription className="text-slate-300">
                      {editingGasto ? "Modifica los datos del gasto" : "Añade un nuevo gasto al registro"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="fecha">Fecha</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        required
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="concepto">Concepto</Label>
                      <Input
                        id="concepto"
                        value={formData.concepto}
                        onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                        required
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cantidad">Cantidad (€)</Label>
                      <Input
                        id="cantidad"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cantidad}
                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                        required
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoria">Categoría</Label>
                      <Input
                        id="categoria"
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                        placeholder="Ej: Material, Comida, Transporte..."
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pagado_por">Pagado por</Label>
                      <select
                        id="pagado_por"
                        value={formData.pagado_por}
                        onChange={(e) => setFormData({ ...formData, pagado_por: e.target.value })}
                        className="w-full rounded-md bg-white/5 border border-white/10 text-white p-2"
                      >
                        <option value="">Selecciona un miembro</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id} className="bg-[#0a1224]">
                            {user.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="notas">Notas</Label>
                      <Textarea
                        id="notas"
                        value={formData.notas}
                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                        rows={3}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
                        {editingGasto ? "Guardar Cambios" : "Añadir Gasto"}
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

          {/* Resumen */}
          <div className="band p-4 md:p-6 flow-in">
            <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
              <Receipt className="h-4 w-4 text-[#5ee1ff]" />
              Resumen
            </div>
            <div className="flex items-baseline gap-3">
              <div className="text-4xl font-bold text-white">
                {totalGastos.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </div>
              <span className="text-slate-400 text-sm">{gastos.length} gastos registrados</span>
            </div>
          </div>

          {/* Tabla simple */}
          <div className="band p-4 md:p-6 flow-in">
            <div className="text-lg font-semibold mb-4">Historial de Gastos</div>
            {isLoading ? (
              <p className="text-slate-400">Cargando gastos...</p>
            ) : gastos.length === 0 ? (
              <p className="text-slate-400">No hay gastos registrados</p>
            ) : (
              <div className="space-y-2">
                {gastos.map((gasto) => {
                  const pagador = users.find((u) => u.id === gasto.pagado_por)
                  return (
                    <div
                      key={gasto.id}
                      className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center bg-white/5 border border-white/10 rounded-xl p-3"
                    >
                      <div className="text-slate-300 text-sm">
                        {new Date(gasto.fecha).toLocaleDateString("es-ES")}
                      </div>
                      <div className="col-span-2 font-semibold text-white">{gasto.concepto}</div>
                      <div className="text-slate-300 text-sm">{gasto.categoria || "-"}</div>
                      <div className="text-right font-semibold text-white">
                        {Number(gasto.cantidad).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-slate-300 text-sm">{pagador?.nombre || "-"}</span>
                        {canManageGastos && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(gasto)}
                              className="hover:bg-white/10"
                            >
                              <Pencil className="h-4 w-4 text-[#5ee1ff]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(gasto.id)}
                              className="hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

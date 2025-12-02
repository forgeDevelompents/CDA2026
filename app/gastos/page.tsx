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
import { Plus, Pencil, Trash2, Receipt } from "lucide-react"
import type { Gasto, User } from "@/lib/types"

export default function Page() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    concepto: "",
    cantidad: "",
    categoria: "",
    pagado_por: "",
    notas: "",
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
  const isAdmin = currentUser?.rol === "admin"

  return (
    <div className="flex min-h-screen bg-[#E7ECF3]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1C3A63] text-balance">Gastos</h1>
              <p className="text-[#2B2B2B]/70 mt-1">Gestión de gastos del grupo</p>
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
                    Añadir Gasto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-[#1C3A63]">
                      {editingGasto ? "Editar Gasto" : "Nuevo Gasto"}
                    </DialogTitle>
                    <DialogDescription>
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="concepto">Concepto</Label>
                      <Input
                        id="concepto"
                        value={formData.concepto}
                        onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                        required
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoria">Categoría</Label>
                      <Input
                        id="categoria"
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                        placeholder="Ej: Material, Comida, Transporte..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="pagado_por">Pagado por</Label>
                      <Select
                        value={formData.pagado_por}
                        onValueChange={(value) => setFormData({ ...formData, pagado_por: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un miembro" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="notas">Notas</Label>
                      <Textarea
                        id="notas"
                        value={formData.notas}
                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-[#2F5E9A] hover:bg-[#1C3A63]">
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
          </div>

          {/* Total Card */}
          <Card className="border-[#8CB4E1]/20 bg-gradient-to-br from-[#2F5E9A]/10 to-transparent">
            <CardHeader>
              <CardTitle className="text-xl text-[#1C3A63] flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#2F5E9A]" />
                Total Acumulado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[#1C3A63]">
                {totalGastos.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </div>
              <p className="text-sm text-[#2B2B2B]/60 mt-2">{gastos.length} gastos registrados</p>
            </CardContent>
          </Card>

          {/* Gastos Table */}
          <Card className="border-[#8CB4E1]/20">
            <CardHeader>
              <CardTitle className="text-lg text-[#1C3A63]">Historial de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-[#2B2B2B]/60 py-8">Cargando gastos...</p>
              ) : gastos.length === 0 ? (
                <p className="text-center text-[#2B2B2B]/60 py-8">No hay gastos registrados</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#8CB4E1]/20">
                        <th className="text-left p-3 text-sm font-semibold text-[#1C3A63]">Fecha</th>
                        <th className="text-left p-3 text-sm font-semibold text-[#1C3A63]">Concepto</th>
                        <th className="text-left p-3 text-sm font-semibold text-[#1C3A63]">Categoría</th>
                        <th className="text-right p-3 text-sm font-semibold text-[#1C3A63]">Cantidad</th>
                        <th className="text-left p-3 text-sm font-semibold text-[#1C3A63]">Pagado por</th>
                        {isAdmin && <th className="text-right p-3 text-sm font-semibold text-[#1C3A63]">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {gastos.map((gasto) => {
                        const pagador = users.find((u) => u.id === gasto.pagado_por)
                        return (
                          <tr
                            key={gasto.id}
                            className="border-b border-[#8CB4E1]/10 hover:bg-[#E7ECF3]/50 transition-colors"
                          >
                            <td className="p-3 text-sm text-[#2B2B2B]">
                              {new Date(gasto.fecha).toLocaleDateString("es-ES")}
                            </td>
                            <td className="p-3 text-sm text-[#2B2B2B]">{gasto.concepto}</td>
                            <td className="p-3 text-sm text-[#2B2B2B]">{gasto.categoria || "-"}</td>
                            <td className="p-3 text-sm font-semibold text-[#1C3A63] text-right">
                              {Number(gasto.cantidad).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                            </td>
                            <td className="p-3 text-sm text-[#2B2B2B]">{pagador?.nombre || "-"}</td>
                            {isAdmin && (
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(gasto)}
                                    className="hover:bg-[#2F5E9A]/10"
                                  >
                                    <Pencil className="h-4 w-4 text-[#2F5E9A]" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(gasto.id)}
                                    className="hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

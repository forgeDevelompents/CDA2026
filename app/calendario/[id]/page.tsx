"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useSession } from "@/hooks/use-session"
import type { SessionUser } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import {
  Calendar as CalendarIcon,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Users,
  Clock,
  ClipboardList,
  Ticket,
  UserCircle,
  Trash2,
} from "lucide-react"

type Evento = {
  id: string
  titulo: string
  descripcion: string | null
  fecha_inicio: string
  fecha_fin: string | null
  ubicacion: string | null
  tipo: string | null
}

type Asistencia = {
  id: string
  user_id: string
  estado: "asistire" | "no_podre" | "quizas"
}

type User = {
  id: string
  nombre: string
}

type Responsable = {
  id: string
  evento_id: string
  tipo: string
  user_id: string | null
  notas: string | null
}

type Turno = {
  id: string
  evento_id: string
  nombre: string
  inicio: string | null
  fin: string | null
  user_ids: string[] | null
}

type ConfigEvento = {
  id: string
  evento_id: string
  tickets_por_persona: number | null
  notas: string | null
  tickets_detalle: { tipo: string; cantidad: number }[] | null
}

export default function Page() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user: sessionUser, isLoading: sessionLoading } = useSession()

  const [evento, setEvento] = useState<Evento | null>(null)
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [responsables, setResponsables] = useState<Responsable[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [config, setConfig] = useState<ConfigEvento | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const [newResp, setNewResp] = useState({ tipo: "Altavoz (traer)", user_id: "", notas: "" })
  const [newTurno, setNewTurno] = useState({ nombre: "Turno 1", inicio: "", fin: "", user_ids: [] as string[] })
  const [tickets, setTickets] = useState<number | null>(null)
  const [ticketsDetalle, setTicketsDetalle] = useState<{ tipo: string; cantidad: number }[]>([])
  const [notasConfig, setNotasConfig] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [turnoUsuariosEdit, setTurnoUsuariosEdit] = useState<Record<string, string[]>>({})

  const canManage = hasPermission(sessionUser, "calendario:manage")

  const asistentesConNombre = useMemo(() => {
    return asistencias
      .map((a) => ({ ...a, nombre: users.find((u) => u.id === a.user_id)?.nombre || "Desconocido" }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [asistencias, users])

  useEffect(() => {
    if (!params?.id) return
    if (sessionLoading) return
    fetchData()
  }, [params?.id, sessionLoading])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const [evRes, asisRes, usersRes, respRes, turnoRes, configRes] = await Promise.all([
      supabase.from("eventos").select("*").eq("id", params.id).single(),
      supabase.from("asistencias").select("*").eq("evento_id", params.id),
      supabase.from("users").select("id,nombre"),
      supabase.from("evento_responsables").select("*").eq("evento_id", params.id).order("created_at", { ascending: true }),
      supabase.from("evento_turnos").select("*").eq("evento_id", params.id).order("inicio", { ascending: true }),
      supabase.from("evento_config").select("*").eq("evento_id", params.id).single(),
    ])

    if (evRes.error) setError("No se pudo cargar el evento")
    setEvento((evRes.data as Evento) || null)
    setAsistencias((asisRes.data as Asistencia[]) || [])
    setUsers((usersRes.data as User[]) || [])
    setResponsables((respRes.data as Responsable[]) || [])
    const fetchedTurnos = (turnoRes.data as Turno[]) || []
    setTurnos(fetchedTurnos)
    setTurnoUsuariosEdit(
      Object.fromEntries(fetchedTurnos.map((t) => [t.id, (t.user_ids || []).filter(Boolean)]))
    )
    const cfg = (configRes.data as ConfigEvento) || null
    setConfig(cfg)
    setTickets(cfg?.tickets_por_persona ?? null)
    setTicketsDetalle(cfg?.tickets_detalle || [])
    setNotasConfig(cfg?.notas ?? "")
    setLoading(false)
  }

  const handleAddResp = async () => {
    if (!canManage) return
    setSaving(true)
    setActionMessage(null)
    const supabase = createClient()
    const { error: respErr } = await supabase.from("evento_responsables").insert({
      evento_id: params.id,
      tipo: newResp.tipo,
      user_id: newResp.user_id || null,
      notas: newResp.notas || null,
    })
    if (respErr) {
      setError(respErr.message)
      setSaving(false)
      return
    }
    setNewResp({ tipo: "Altavoz (traer)", user_id: "", notas: "" })
    fetchData()
    setSaving(false)
    setActionMessage("Responsable añadido")
  }

  const handleAddTurno = async () => {
    if (!canManage) return
    setSaving(true)
    setActionMessage(null)
    const supabase = createClient()
    const { error: turnErr } = await supabase.from("evento_turnos").insert({
      evento_id: params.id,
      nombre: newTurno.nombre,
      inicio: newTurno.inicio || null,
      fin: newTurno.fin || null,
      user_ids: newTurno.user_ids.length ? newTurno.user_ids : null,
    })
    if (turnErr) {
      setError(turnErr.message)
      setSaving(false)
      return
    }
    setNewTurno({ nombre: "Turno 1", inicio: "", fin: "", user_ids: [] })
    fetchData()
    setSaving(false)
    setActionMessage("Turno añadido")
  }

  const handleUpdateTurnoUsuarios = async (turnoId: string) => {
    if (!canManage) return
    setSaving(true)
    setActionMessage(null)
    const supabase = createClient()
    const turnoActual = turnos.find((t) => t.id === turnoId)
    const userIds = turnoUsuariosEdit[turnoId] ?? turnoActual?.user_ids ?? []
    const { error: turnErr } = await supabase
      .from("evento_turnos")
      .update({
        user_ids: userIds.length ? userIds : null,
      })
      .eq("id", turnoId)
    if (turnErr) {
      setError(turnErr.message)
      setSaving(false)
      return
    }
    fetchData()
    setSaving(false)
    setActionMessage("Turno actualizado")
  }

  const handleSaveConfig = async () => {
    if (!canManage) return
    setSaving(true)
    setActionMessage(null)
    const supabase = createClient()
    const cleanedTicketsDetalle = ticketsDetalle
      .filter((t) => t.tipo.trim() !== "")
      .map((t) => ({ tipo: t.tipo.trim(), cantidad: Number(t.cantidad) || 0 }))
    const detalleValue = cleanedTicketsDetalle.length ? cleanedTicketsDetalle : null

    const payload = {
      evento_id: params.id,
      tickets_por_persona: tickets ?? null,
      notas: notasConfig || null,
      tickets_detalle: detalleValue,
    }
    if (config?.id) {
      const { error: cfgErr } = await supabase.from("evento_config").update(payload).eq("id", config.id)
      if (cfgErr) {
        setError(cfgErr.message)
        setSaving(false)
        return
      }
    } else {
      const { error: cfgErr } = await supabase.from("evento_config").insert(payload)
      if (cfgErr) {
        setError(cfgErr.message)
        setSaving(false)
        return
      }
    }
    fetchData()
    setSaving(false)
    setActionMessage("Configuración guardada")
  }

  const handleDeleteResp = async (id: string) => {
    if (!canManage) return
    setSaving(true)
    setActionMessage(null)
    const supabase = createClient()
    const { error: delErr } = await supabase.from("evento_responsables").delete().eq("id", id)
    if (delErr) {
      setError(delErr.message)
      setSaving(false)
      return
    }
    fetchData()
    setSaving(false)
    setActionMessage("Responsable eliminado")
  }

  const handleDeleteTurno = async (id: string) => {
    if (!canManage) return
    setSaving(true)
    setActionMessage(null)
    const supabase = createClient()
    const { error: delErr } = await supabase.from("evento_turnos").delete().eq("id", id)
    if (delErr) {
      setError(delErr.message)
      setSaving(false)
      return
    }
    fetchData()
    setSaving(false)
    setActionMessage("Turno eliminado")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#0a1224] via-[#0f1c36] to-[#090f1c] text-white">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <p className="text-slate-300">Cargando evento...</p>
        </main>
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#0a1224] via-[#0f1c36] to-[#090f1c] text-white">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <p className="text-red-300">No se encontró el evento.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a1224] via-[#0f1c36] to-[#090f1c] text-white">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 lg:p-6">
        <div className="max-w-7xl w-full mx-auto space-y-4">
          <header className="flex items-start justify-between gap-3 flow-in">
            <div className="space-y-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/calendario")} className="text-slate-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <p className="uppercase text-xs tracking-[0.2em] text-[#5ee1ff]">{evento.tipo || "Evento"}</p>
              <h1 className="text-3xl font-bold text-white">{evento.titulo}</h1>
              {evento.descripcion && <p className="text-slate-300 max-w-3xl">{evento.descripcion}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-[#5ee1ff]" />
                  {new Date(evento.fecha_inicio).toLocaleString("es-ES", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {evento.fecha_fin && ` - ${new Date(evento.fecha_fin).toLocaleTimeString("es-ES", { timeStyle: "short" })}`}
                </span>
                {evento.ubicacion && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#5ee1ff]" />
                    {evento.ubicacion}
                  </span>
                )}
              </div>
            </div>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode((v) => !v)}
                className="border-white/20 text-white"
              >
                {editMode ? "Cerrar edición" : "Editar"}
              </Button>
            )}
          </header>

          {error && <p className="text-red-300">{error}</p>}
          {actionMessage && <p className="text-[#5ee1ff]">{actionMessage}</p>}

          <section className="band p-4 md:p-5 space-y-3 flow-in">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Users className="h-5 w-5 text-[#5ee1ff]" />
              Asistencias
            </div>
            {asistencias.length === 0 ? (
              <p className="text-slate-400">Nadie ha respondido todavía</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {["asistire", "no_podre", "quizas"].map((estado) => (
                  <div key={estado} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                      {estado === "asistire" ? "Asistirán" : estado === "no_podre" ? "No podrán" : "Quizás"}
                    </p>
                    {asistentesConNombre.filter((a) => a.estado === estado).length === 0 ? (
                      <p className="text-slate-400 text-sm">Sin respuestas</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {asistentesConNombre
                          .filter((a) => a.estado === estado)
                          .map((a) => (
                            <span key={a.id} className="px-2 py-1 text-xs rounded-full bg-white/10 text-white">
                              {a.nombre}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="band p-4 md:p-5 space-y-3 flow-in flow-in-delay-1">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#5ee1ff]" />
                Responsables (altavoz, caja, etc.)
              </div>
              {canManage && editMode && (
                <div className="flex gap-2">
                  <Input
                    value={newResp.tipo}
                    onChange={(e) => setNewResp({ ...newResp, tipo: e.target.value })}
                    placeholder="Tarea / rol (ej: Altavoz - traer)"
                    className="bg-white/5 border-white/10 text-white w-48"
                  />
                  <select
                    value={newResp.user_id}
                    onChange={(e) => setNewResp({ ...newResp, user_id: e.target.value })}
                    className="bg-white/5 border border-white/10 text-white rounded-md px-2 py-2"
                  >
                    <option value="">Sin asignar</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id} className="bg-[#0a1224]">
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={newResp.notas}
                    onChange={(e) => setNewResp({ ...newResp, notas: e.target.value })}
                    placeholder="Notas"
                    className="bg-white/5 border-white/10 text-white w-40"
                  />
                  <Button onClick={handleAddResp} disabled={saving} className="bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
                    <Plus className="h-4 w-4 mr-1" /> Añadir
                  </Button>
                </div>
              )}
            </div>
            {responsables.length === 0 ? (
              <p className="text-slate-400">Sin responsables asignados</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {responsables.map((resp) => (
                  <div key={resp.id} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-[#5ee1ff]" />
                      {resp.tipo}
                    </p>
                    <p className="text-xs text-slate-300">
                      {resp.user_id ? users.find((u) => u.id === resp.user_id)?.nombre || "Desconocido" : "Sin asignar"}
                    </p>
                    {resp.notas && <p className="text-xs text-slate-400">{resp.notas}</p>}
                    {canManage && editMode && (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteResp(resp.id)}
                          className="hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="band p-4 md:p-5 space-y-3 flow-in flow-in-delay-2">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#5ee1ff]" />
                Turnos de caja / tareas
              </div>
              {canManage && editMode && (
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={newTurno.nombre}
                    onChange={(e) => setNewTurno({ ...newTurno, nombre: e.target.value })}
                    placeholder="Nombre del turno"
                    className="bg-white/5 border-white/10 text-white w-36"
                  />
                  <Input
                    type="time"
                    value={newTurno.inicio}
                    onChange={(e) => setNewTurno({ ...newTurno, inicio: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Input
                    type="time"
                    value={newTurno.fin}
                    onChange={(e) => setNewTurno({ ...newTurno, fin: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <select
                        value=""
                        onChange={(e) => {
                          const val = e.target.value
                          if (!val) return
                          setNewTurno((prev) => ({
                            ...prev,
                            user_ids: prev.user_ids.includes(val) ? prev.user_ids : [...prev.user_ids, val],
                          }))
                        }}
                        className="bg-white/5 border border-white/10 text-white rounded-md px-2 py-2 min-w-[180px]"
                      >
                        <option value="">Añadir persona</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id} className="bg-[#0a1224]">
                            {u.nombre}
                          </option>
                        ))}
                      </select>
                      {newTurno.user_ids.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNewTurno({ ...newTurno, user_ids: [] })}
                          className="border-white/20 text-white"
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>
                    {newTurno.user_ids.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newTurno.user_ids.map((id) => (
                          <span
                            key={id}
                            className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/10 text-sm text-white"
                          >
                            {users.find((u) => u.id === id)?.nombre || "Desconocido"}
                            <button
                              type="button"
                              onClick={() =>
                                setNewTurno((prev) => ({
                                  ...prev,
                                  user_ids: prev.user_ids.filter((u) => u !== id),
                                }))
                              }
                              className="text-red-300 hover:text-red-200"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button onClick={handleAddTurno} disabled={saving} className="bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
                    <Plus className="h-4 w-4 mr-1" /> Añadir
                  </Button>
                </div>
              )}
            </div>
            {turnos.length === 0 ? (
              <p className="text-slate-400">Sin turnos registrados</p>
            ) : (
              <div className="space-y-2">
                {turnos.map((t) => {
                  const selectedUsers = turnoUsuariosEdit[t.id] ?? t.user_ids ?? []
                  return (
                    <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-3">
                      <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{t.nombre}</p>
                          <p className="text-xs text-slate-300">
                            {t.inicio || "Sin inicio"} {t.inicio || t.fin ? "-" : ""} {t.fin || ""}
                          </p>
                        </div>
                        <div className="text-sm text-slate-200 flex flex-wrap gap-2">
                          {selectedUsers.length === 0
                            ? "Sin asignar"
                            : selectedUsers.map((id) => (
                                <span key={id} className="px-2 py-1 rounded-full bg-white/10">
                                  {users.find((u) => u.id === id)?.nombre || "Desconocido"}
                                </span>
                              ))}
                        </div>
                        {canManage && editMode && (
                          <div className="ml-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTurno(t.id)}
                              className="hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {canManage && editMode && (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 flex-wrap items-center">
                            <select
                              value=""
                              onChange={(e) => {
                                const val = e.target.value
                                if (!val) return
                                setTurnoUsuariosEdit((prev) => {
                                  const current = prev[t.id] ?? t.user_ids ?? []
                                  if (current.includes(val)) return prev
                                  return { ...prev, [t.id]: [...current, val] }
                                })
                              }}
                              className="bg-white/5 border border-white/10 text-white rounded-md px-2 py-2 min-w-[180px]"
                            >
                              <option value="">Añadir persona</option>
                              {users.map((u) => (
                                <option key={u.id} value={u.id} className="bg-[#0a1224]">
                                  {u.nombre}
                                </option>
                              ))}
                            </select>
                            {selectedUsers.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTurnoUsuariosEdit((prev) => ({ ...prev, [t.id]: [] }))}
                                className="border-white/20 text-white"
                              >
                                Limpiar personas
                              </Button>
                            )}
                            <Button
                              onClick={() => handleUpdateTurnoUsuarios(t.id)}
                              disabled={saving}
                              className="bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Guardar
                            </Button>
                          </div>
                          {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {selectedUsers.map((id) => (
                                <span
                                  key={id}
                                  className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/10 text-sm text-white"
                                >
                                  {users.find((u) => u.id === id)?.nombre || "Desconocido"}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTurnoUsuariosEdit((prev) => ({
                                        ...prev,
                                        [t.id]: (prev[t.id] ?? t.user_ids ?? []).filter((u) => u !== id),
                                      }))
                                    }
                                    className="text-red-300 hover:text-red-200"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="band p-4 md:p-5 space-y-3 flow-in flow-in-delay-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Ticket className="h-5 w-5 text-[#5ee1ff]" />
              Tickets / notas generales
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200">Tickets obligatorios por persona</Label>
                {canManage && editMode ? (
                  <Input
                    type="number"
                    min="0"
                    value={tickets ?? ""}
                    onChange={(e) => setTickets(e.target.value === "" ? null : Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                ) : (
                  <p className="text-lg font-semibold text-white">
                    {tickets ?? "Sin definir"}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-200">Tipos de ticket</Label>
                {canManage && editMode ? (
                  <div className="space-y-2">
                    {ticketsDetalle.map((t, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2">
                        <Input
                          value={t.tipo}
                          onChange={(e) => {
                            const copy = [...ticketsDetalle]
                            copy[idx] = { ...t, tipo: e.target.value }
                            setTicketsDetalle(copy)
                          }}
                          placeholder="Tipo (ej: Cerveza)"
                          className="bg-white/5 border-white/10 text-white col-span-3"
                        />
                        <Input
                          type="number"
                          min="0"
                          value={t.cantidad}
                          onChange={(e) => {
                            const copy = [...ticketsDetalle]
                            copy[idx] = { ...t, cantidad: Number(e.target.value) || 0 }
                            setTicketsDetalle(copy)
                          }}
                          placeholder="Cant."
                          className="bg-white/5 border-white/10 text-white col-span-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTicketsDetalle(ticketsDetalle.filter((_, i) => i !== idx))}
                          className="hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTicketsDetalle([...ticketsDetalle, { tipo: "Ticket", cantidad: 1 }])}
                      className="border-white/20 text-white"
                    >
                      Añadir tipo
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ticketsDetalle && ticketsDetalle.length > 0 ? (
                      ticketsDetalle.map((t, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-white/10 text-sm text-white">
                          {t.tipo}: {t.cantidad}
                        </span>
                      ))
                    ) : (
                      <p className="text-slate-200 text-sm">Sin tipos definidos</p>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-200">Notas</Label>
                {canManage && editMode ? (
                  <Textarea
                    value={notasConfig}
                    onChange={(e) => setNotasConfig(e.target.value)}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white"
                  />
                ) : (
                  <p className="text-slate-200 text-sm leading-relaxed bg-white/5 border border-white/10 rounded-xl p-3">
                    {notasConfig || "Sin notas"}
                  </p>
                )}
              </div>
            </div>
            {canManage && editMode && (
              <div className="flex justify-end">
                <Button onClick={handleSaveConfig} disabled={saving} className="bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

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
import { Plus, Vote, CheckCircle2, XCircle, Clock } from "lucide-react"
import type { Votacion, OpcionVotacion, Voto } from "@/lib/types"
import { useSession } from "@/hooks/use-session"
import type { SessionUser } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"

export default function Page() {
  const [votaciones, setVotaciones] = useState<Votacion[]>([])
  const [opciones, setOpciones] = useState<Record<string, OpcionVotacion[]>>({})
  const [votos, setVotos] = useState<Voto[]>([])
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user: sessionUser, isLoading: sessionLoading } = useSession()

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    opciones: ["", ""],
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

    const { data: votacionesData } = await supabase
      .from("votaciones")
      .select("*")
      .order("created_at", { ascending: false })

    const { data: opcionesData } = await supabase.from("opciones_votacion").select("*")

    const { data: votosData } = await supabase.from("votos").select("*")

    setVotaciones((votacionesData as Votacion[]) || [])
    setVotos((votosData as Voto[]) || [])

    // Group options by votacion_id
    const opcionesAgrupadas: Record<string, OpcionVotacion[]> = {}
    opcionesData?.forEach((opcion: OpcionVotacion) => {
      if (!opcionesAgrupadas[opcion.votacion_id]) {
        opcionesAgrupadas[opcion.votacion_id] = []
      }
      opcionesAgrupadas[opcion.votacion_id].push(opcion)
    })
    setOpciones(opcionesAgrupadas)

    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageVotaciones) return
    const supabase = createClient()

    // Create votacion
    const { data: votacionData, error } = await supabase
      .from("votaciones")
      .insert({
        titulo: formData.titulo,
        descripcion: formData.descripcion || null,
        estado: "activa",
      })
      .select()
      .single()

    if (votacionData && !error) {
      // Create options
      const opcionesData = formData.opciones
        .filter((o) => o.trim() !== "")
        .map((texto, index) => ({
          votacion_id: votacionData.id,
          texto,
          orden: index,
        }))

      await supabase.from("opciones_votacion").insert(opcionesData)
    }

    setIsDialogOpen(false)
    resetForm()
    fetchData()
  }

  const handleVote = async (votacionId: string, opcionId: string) => {
    if (!currentUser) return

    const supabase = createClient()

    // Check if user already voted
    const existingVote = votos.find((v) => v.votacion_id === votacionId && v.user_id === currentUser.id)

    if (existingVote) {
      // Update vote
      await supabase.from("votos").update({ opcion_id: opcionId }).eq("id", existingVote.id)
    } else {
      // Create new vote
      await supabase.from("votos").insert({
        votacion_id: votacionId,
        opcion_id: opcionId,
        user_id: currentUser.id,
      })
    }

    fetchData()
  }

  const handleCerrarVotacion = async (votacionId: string) => {
    if (!canManageVotaciones) return
    if (!confirm("¿Estás seguro de que quieres cerrar esta votación?")) return

    const supabase = createClient()
    await supabase.from("votaciones").update({ estado: "cerrada" }).eq("id", votacionId)

    fetchData()
  }

  const resetForm = () => {
    setFormData({
      titulo: "",
      descripcion: "",
      opciones: ["", ""],
    })
  }

  const addOpcion = () => {
    setFormData({
      ...formData,
      opciones: [...formData.opciones, ""],
    })
  }

  const removeOpcion = (index: number) => {
    setFormData({
      ...formData,
      opciones: formData.opciones.filter((_, i) => i !== index),
    })
  }

  const updateOpcion = (index: number, value: string) => {
    const newOpciones = [...formData.opciones]
    newOpciones[index] = value
    setFormData({ ...formData, opciones: newOpciones })
  }

  const canManageVotaciones = hasPermission(currentUser, "votaciones:manage")

  // Separate active and closed votaciones
  const votacionesActivas = votaciones.filter((v) => v.estado === "activa")
  const votacionesCerradas = votaciones.filter((v) => v.estado === "cerrada")

  const getVotacionResults = (votacionId: string) => {
    const votacionOpciones = opciones[votacionId] || []
    const votacionVotos = votos.filter((v) => v.votacion_id === votacionId)
    const totalVotos = votacionVotos.length

    return votacionOpciones.map((opcion) => {
      const opcionVotos = votacionVotos.filter((v) => v.opcion_id === opcion.id).length
      const porcentaje = totalVotos > 0 ? (opcionVotos / totalVotos) * 100 : 0

      return {
        opcion,
        votos: opcionVotos,
        porcentaje,
      }
    })
  }

  const hasUserVoted = (votacionId: string) => {
    return votos.some((v) => v.votacion_id === votacionId && v.user_id === currentUser?.id)
  }

  const getUserVote = (votacionId: string) => {
    return votos.find((v) => v.votacion_id === votacionId && v.user_id === currentUser?.id)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a1224] via-[#0f1c36] to-[#090f1c] text-white">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flow-in">
            <div>
              <p className="uppercase text-xs tracking-[0.2em] text-[#5ee1ff]">Participación</p>
              <h1 className="text-3xl font-bold text-white text-balance">Votaciones</h1>
              <p className="text-slate-300 mt-1">Sistema de votos interno</p>
            </div>
            {canManageVotaciones && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Votación
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-white/10 bg-white/5 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Nueva Votación</DialogTitle>
                    <DialogDescription className="text-slate-300">
                      Crea una nueva votación con múltiples opciones
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
                      <Label>Opciones</Label>
                      <div className="space-y-2 mt-2">
                        {formData.opciones.map((opcion, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={opcion}
                              onChange={(e) => updateOpcion(index, e.target.value)}
                              placeholder={`Opción ${index + 1}`}
                              required
                              className="bg-white/5 border-white/10 text-white"
                            />
                            {formData.opciones.length > 2 && (
                              <Button type="button" variant="outline" size="icon" onClick={() => removeOpcion(index)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addOpcion} className="mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir Opción
                      </Button>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]">
                        Crear Votación
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

          {votacionesActivas.length > 0 && (
            <section className="band p-4 md:p-6 space-y-4 flow-in">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Vote className="h-5 w-5 text-[#5ee1ff]" />
                Votaciones activas
              </div>
              {votacionesActivas.map((votacion, idx) => {
                const results = getVotacionResults(votacion.id)
                const userVote = getUserVote(votacion.id)
                const hasVoted = hasUserVoted(votacion.id)

                return (
                  <div
                    key={votacion.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 flow-in"
                    style={{ animationDelay: `${0.04 * idx}s` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#5ee1ff]">Activa</p>
                        <h3 className="text-xl font-semibold text-white">{votacion.titulo}</h3>
                        {votacion.descripcion && <p className="text-slate-300 text-sm">{votacion.descripcion}</p>}
                      </div>
                      {canManageVotaciones && (
                        <Button variant="outline" size="sm" onClick={() => handleCerrarVotacion(votacion.id)}>
                          Cerrar
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {results.map(({ opcion, votos, porcentaje }) => {
  const isUserChoice = userVote?.opcion_id === opcion.id

  return (
    <div key={opcion.id} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant={isUserChoice ? "default" : "outline"}
          className={`flex-1 justify-start ${
            isUserChoice
              ? "bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]"
              : "bg-transparent hover:bg-white/10"
          }`}
          onClick={() => handleVote(votacion.id, opcion.id)}
        >
          {isUserChoice && <CheckCircle2 className="h-4 w-4 mr-2 text-[#0b1220]" />}
          {opcion.texto}
        </Button>

        {hasVoted && (
          <span className="text-sm text-slate-300">
            {votos} ({porcentaje.toFixed(0)}%)
          </span>
        )}
      </div>

      {hasVoted && (
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#32d2ff] h-full rounded-full transition-all duration-500"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      )}
    </div>
  )
})}

                    </div>
                    <div className="text-xs text-slate-400">
                      Total de votos: {results.reduce((sum, r) => sum + r.votos, 0)}
                    </div>
                  </div>
                )
              })}
            </section>
          )}

          {votacionesCerradas.length > 0 && (
            <section className="band p-4 md:p-6 space-y-3 flow-in flow-in-delay-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock className="h-5 w-5 text-[#5ee1ff]" />
                Historial de votaciones
              </div>
              <div className="space-y-3">
                {votacionesCerradas.map((votacion, idx) => {
                  const results = getVotacionResults(votacion.id)

                  return (
                    <div
                      key={votacion.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 flow-in"
                      style={{ animationDelay: `${0.04 * idx}s` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold text-white">{votacion.titulo}</h3>
                        <span className="text-xs text-slate-400">Cerrada</span>
                      </div>
                      <div className="space-y-2">
                        {results.map(({ opcion, votos, porcentaje }) => (
                          <div key={opcion.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm text-slate-200">
                              <span>{opcion.texto}</span>
                              <span className="font-semibold text-white">
                                {votos} ({porcentaje.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-white/30 h-full rounded-full transition-all duration-500"
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {isLoading && <p className="text-center text-slate-400">Cargando votaciones...</p>}

          {!isLoading && votaciones.length === 0 && (
            <section className="band p-6 text-center text-slate-400">No hay votaciones disponibles</section>
          )}
        </div>
      </main>
    </div>
  )
}

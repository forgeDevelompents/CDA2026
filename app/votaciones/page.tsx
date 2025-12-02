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
import { Plus, Vote, CheckCircle2, XCircle, Clock } from "lucide-react"
import type { Votacion, OpcionVotacion, Voto, User } from "@/lib/types"

export default function Page() {
  const [votaciones, setVotaciones] = useState<Votacion[]>([])
  const [opciones, setOpciones] = useState<Record<string, OpcionVotacion[]>>({})
  const [votos, setVotos] = useState<Voto[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    opciones: ["", ""],
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

  const isAdmin = currentUser?.rol === "admin"

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
    <div className="flex min-h-screen bg-[#E7ECF3]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1C3A63] text-balance">Votaciones</h1>
              <p className="text-[#2B2B2B]/70 mt-1">Sistema de votación del grupo</p>
            </div>
            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#2F5E9A] hover:bg-[#1C3A63]">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Votación
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-[#1C3A63]">Nueva Votación</DialogTitle>
                    <DialogDescription>Crea una nueva votación con múltiples opciones</DialogDescription>
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
                      <Label>Opciones</Label>
                      <div className="space-y-2 mt-2">
                        {formData.opciones.map((opcion, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={opcion}
                              onChange={(e) => updateOpcion(index, e.target.value)}
                              placeholder={`Opción ${index + 1}`}
                              required
                            />
                            {formData.opciones.length > 2 && (
                              <Button type="button" variant="outline" size="icon" onClick={() => removeOpcion(index)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOpcion}
                        className="mt-2 bg-transparent"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir Opción
                      </Button>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-[#2F5E9A] hover:bg-[#1C3A63]">
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
          </div>

          {/* Votaciones Activas */}
          {votacionesActivas.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-[#1C3A63]">Votaciones Activas</h2>
              {votacionesActivas.map((votacion) => {
                const results = getVotacionResults(votacion.id)
                const userVote = getUserVote(votacion.id)
                const hasVoted = hasUserVoted(votacion.id)

                return (
                  <Card key={votacion.id} className="border-[#8CB4E1]/20 bg-gradient-to-br from-white to-[#E7ECF3]/30">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-[#1C3A63] flex items-center gap-2 text-balance">
                            <Vote className="h-5 w-5 text-[#2F5E9A]" />
                            {votacion.titulo}
                          </CardTitle>
                          {votacion.descripcion && (
                            <p className="text-sm text-[#2B2B2B]/70 mt-2">{votacion.descripcion}</p>
                          )}
                        </div>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCerrarVotacion(votacion.id)}
                            className="flex-shrink-0"
                          >
                            Cerrar Votación
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {results.map(({ opcion, votos, porcentaje }) => (
                        <div key={opcion.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              {hasVoted ? (
                                <div className="flex items-center gap-2 flex-1">
                                  {userVote?.opcion_id === opcion.id && (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  )}
                                  <span className="text-sm text-[#2B2B2B] font-medium">{opcion.texto}</span>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  className="w-full justify-start hover:bg-[#2F5E9A]/10 hover:border-[#2F5E9A] bg-transparent"
                                  onClick={() => handleVote(votacion.id, opcion.id)}
                                >
                                  {opcion.texto}
                                </Button>
                              )}
                            </div>
                            {hasVoted && (
                              <span className="text-sm font-semibold text-[#1C3A63] ml-2">
                                {votos} ({porcentaje.toFixed(0)}%)
                              </span>
                            )}
                          </div>
                          {hasVoted && (
                            <div className="w-full bg-[#E7ECF3] rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-[#2F5E9A] h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="pt-2 text-xs text-[#2B2B2B]/60">
                        Total de votos: {results.reduce((sum, r) => sum + r.votos, 0)}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Votaciones Cerradas */}
          {votacionesCerradas.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-[#1C3A63]">Historial de Votaciones</h2>
              {votacionesCerradas.map((votacion) => {
                const results = getVotacionResults(votacion.id)

                return (
                  <Card key={votacion.id} className="border-[#8CB4E1]/20 opacity-75">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#1C3A63] flex items-center gap-2 text-balance">
                        <Clock className="h-5 w-5 text-[#2B2B2B]/50" />
                        {votacion.titulo}
                        <span className="text-xs font-normal text-[#2B2B2B]/60">(Cerrada)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {results.map(({ opcion, votos, porcentaje }) => (
                        <div key={opcion.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#2B2B2B]">{opcion.texto}</span>
                            <span className="text-sm font-semibold text-[#1C3A63]">
                              {votos} ({porcentaje.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#E7ECF3] rounded-full h-2">
                            <div className="bg-[#2B2B2B]/30 h-full rounded-full" style={{ width: `${porcentaje}%` }} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {isLoading && <p className="text-center text-[#2B2B2B]/60 py-8">Cargando votaciones...</p>}

          {!isLoading && votaciones.length === 0 && (
            <Card className="border-[#8CB4E1]/20">
              <CardContent className="py-12">
                <p className="text-center text-[#2B2B2B]/60">No hay votaciones disponibles</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

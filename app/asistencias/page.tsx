"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, HelpCircle, Calendar, Users } from "lucide-react"
import type { Evento, Asistencia, User } from "@/lib/types"

export default function Page() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

    const { data: asistenciasData } = await supabase.from("asistencias").select("*")

    const { data: usersData } = await supabase.from("users").select("*")

    setEventos((eventosData as Evento[]) || [])
    setAsistencias((asistenciasData as Asistencia[]) || [])
    setUsers((usersData as User[]) || [])
    setIsLoading(false)
  }

  const handleConfirmarAsistencia = async (eventoId: string, estado: "asistire" | "no_podre" | "quizas") => {
    if (!currentUser) return

    const supabase = createClient()

    // Check if user already has an asistencia
    const existingAsistencia = asistencias.find((a) => a.evento_id === eventoId && a.user_id === currentUser.id)

    if (existingAsistencia) {
      // Update existing
      await supabase.from("asistencias").update({ estado }).eq("id", existingAsistencia.id)
    } else {
      // Create new
      await supabase.from("asistencias").insert({
        evento_id: eventoId,
        user_id: currentUser.id,
        estado,
      })
    }

    fetchData()
  }

  const getAsistenciaCount = (eventoId: string, estado: string) => {
    return asistencias.filter((a) => a.evento_id === eventoId && a.estado === estado).length
  }

  const getUserAsistencia = (eventoId: string) => {
    return asistencias.find((a) => a.evento_id === eventoId && a.user_id === currentUser?.id)
  }

  const getAsistentes = (eventoId: string) => {
    const eventAsistencias = asistencias.filter((a) => a.evento_id === eventoId)
    return eventAsistencias.map((a) => {
      const user = users.find((u) => u.id === a.user_id)
      return {
        user: user?.nombre || "Desconocido",
        estado: a.estado,
      }
    })
  }

  const now = new Date().toISOString()
  const upcomingEvents = eventos.filter((e) => e.fecha_inicio >= now)
  const pastEvents = eventos.filter((e) => e.fecha_inicio < now)

  return (
    <div className="flex min-h-screen bg-[#E7ECF3]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
          <div>
            <h1 className="text-3xl font-bold text-[#1C3A63] text-balance">Asistencias</h1>
            <p className="text-[#2B2B2B]/70 mt-1">Confirma tu asistencia a los eventos</p>
          </div>

          {isLoading ? (
            <p className="text-center text-[#2B2B2B]/60 py-8">Cargando eventos...</p>
          ) : (
            <>
              {/* Próximos Eventos */}
              {upcomingEvents.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[#1C3A63]">Próximos Eventos</h2>
                  {upcomingEvents.map((evento) => {
                    const userAsistencia = getUserAsistencia(evento.id)
                    const asistentes = getAsistentes(evento.id)

                    return (
                      <Card key={evento.id} className="border-[#8CB4E1]/20">
                        <CardHeader>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-xl text-[#1C3A63] flex items-center gap-2 text-balance">
                                <Calendar className="h-5 w-5 text-[#2F5E9A]" />
                                {evento.titulo}
                              </CardTitle>
                              <p className="text-sm text-[#2B2B2B]/70 mt-2">
                                {new Date(evento.fecha_inicio).toLocaleString("es-ES", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </p>
                              {evento.ubicacion && <p className="text-sm text-[#2B2B2B]/70">{evento.ubicacion}</p>}
                            </div>
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                              <Button
                                size="sm"
                                variant={userAsistencia?.estado === "asistire" ? "default" : "outline"}
                                onClick={() => handleConfirmarAsistencia(evento.id, "asistire")}
                                className={
                                  userAsistencia?.estado === "asistire" ? "bg-green-600 hover:bg-green-700" : ""
                                }
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Asistiré
                              </Button>
                              <Button
                                size="sm"
                                variant={userAsistencia?.estado === "no_podre" ? "default" : "outline"}
                                onClick={() => handleConfirmarAsistencia(evento.id, "no_podre")}
                                className={userAsistencia?.estado === "no_podre" ? "bg-red-600 hover:bg-red-700" : ""}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                No podré
                              </Button>
                              <Button
                                size="sm"
                                variant={userAsistencia?.estado === "quizas" ? "default" : "outline"}
                                onClick={() => handleConfirmarAsistencia(evento.id, "quizas")}
                                className={
                                  userAsistencia?.estado === "quizas" ? "bg-yellow-600 hover:bg-yellow-700" : ""
                                }
                              >
                                <HelpCircle className="h-4 w-4 mr-2" />
                                Quizás
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-semibold text-[#1C3A63]">
                                  {getAsistenciaCount(evento.id, "asistire")}
                                </p>
                                <p className="text-xs text-[#2B2B2B]/70">Asistirán</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <XCircle className="h-5 w-5 text-red-600" />
                              <div>
                                <p className="font-semibold text-[#1C3A63]">
                                  {getAsistenciaCount(evento.id, "no_podre")}
                                </p>
                                <p className="text-xs text-[#2B2B2B]/70">No podrán</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-5 w-5 text-yellow-600" />
                              <div>
                                <p className="font-semibold text-[#1C3A63]">
                                  {getAsistenciaCount(evento.id, "quizas")}
                                </p>
                                <p className="text-xs text-[#2B2B2B]/70">Quizás</p>
                              </div>
                            </div>
                          </div>

                          {asistentes.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[#8CB4E1]/20">
                              <p className="text-sm font-semibold text-[#1C3A63] mb-2 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Respuestas ({asistentes.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {asistentes.map((asistente, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-2 py-1 rounded-md text-xs ${
                                      asistente.estado === "asistire"
                                        ? "bg-green-100 text-green-800"
                                        : asistente.estado === "no_podre"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {asistente.user}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Eventos Pasados */}
              {pastEvents.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[#1C3A63]">Eventos Pasados</h2>
                  {pastEvents.slice(0, 3).map((evento) => {
                    const asistentes = getAsistentes(evento.id)

                    return (
                      <Card key={evento.id} className="border-[#8CB4E1]/20 opacity-75">
                        <CardHeader>
                          <CardTitle className="text-lg text-[#1C3A63] text-balance">{evento.titulo}</CardTitle>
                          <p className="text-sm text-[#2B2B2B]/70">
                            {new Date(evento.fecha_inicio).toLocaleDateString("es-ES", {
                              dateStyle: "medium",
                            })}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-semibold text-[#1C3A63]">
                                  {getAsistenciaCount(evento.id, "asistire")}
                                </p>
                                <p className="text-xs text-[#2B2B2B]/70">Asistieron</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <XCircle className="h-5 w-5 text-red-600" />
                              <div>
                                <p className="font-semibold text-[#1C3A63]">
                                  {getAsistenciaCount(evento.id, "no_podre")}
                                </p>
                                <p className="text-xs text-[#2B2B2B]/70">No pudieron</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-5 w-5 text-yellow-600" />
                              <div>
                                <p className="font-semibold text-[#1C3A63]">
                                  {getAsistenciaCount(evento.id, "quizas")}
                                </p>
                                <p className="text-xs text-[#2B2B2B]/70">Quizás</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {upcomingEvents.length === 0 && pastEvents.length === 0 && (
                <Card className="border-[#8CB4E1]/20">
                  <CardContent className="py-12">
                    <p className="text-center text-[#2B2B2B]/60">No hay eventos disponibles</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

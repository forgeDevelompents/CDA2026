"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, HelpCircle, Calendar, Users } from "lucide-react"
import type { Evento, Asistencia, User } from "@/lib/types"
import { useSession } from "@/hooks/use-session"
import type { SessionUser } from "@/lib/auth"

export default function Page() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user: sessionUser, isLoading: sessionLoading } = useSession()

  useEffect(() => {
    if (!sessionLoading && sessionUser) {
      setCurrentUser(sessionUser)
      fetchData()
    }
  }, [sessionLoading, sessionUser])

  const fetchData = async () => {
    const supabase = createClient()
    setIsLoading(true)

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
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a1224] via-[#0f1c36] to-[#090f1c] text-white">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flow-in">
            <p className="uppercase text-xs tracking-[0.2em] text-[#5ee1ff]">Eventos</p>
            <h1 className="text-3xl font-bold text-white text-balance">Asistencias</h1>
            <p className="text-slate-300 mt-1">Confirma tu asistencia a los eventos</p>
          </header>

          {isLoading ? (
            <p className="text-center text-slate-400">Cargando eventos...</p>
          ) : (
            <>
              {upcomingEvents.length > 0 && (
                <section className="band p-4 md:p-6 space-y-4 flow-in">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Calendar className="h-5 w-5 text-[#5ee1ff]" />
                    Próximos eventos
                  </div>
                  <div className="space-y-3">
                    {upcomingEvents.map((evento, idx) => {
                      const userAsistencia = getUserAsistencia(evento.id)
                      const asistentes = getAsistentes(evento.id)

                      return (
                        <div
                          key={evento.id}
                          className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 flow-in"
                          style={{ animationDelay: `${0.04 * idx}s` }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1 space-y-1">
                              <p className="text-xs uppercase tracking-[0.2em] text-[#5ee1ff]">Evento</p>
                              <h3 className="text-xl font-semibold text-white">{evento.titulo}</h3>
                              <p className="text-sm text-slate-300">
                                {new Date(evento.fecha_inicio).toLocaleString("es-ES", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </p>
                              {evento.ubicacion && <p className="text-sm text-slate-300">{evento.ubicacion}</p>}
                            </div>
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                              <Button
                                size="sm"
                                variant={userAsistencia?.estado === "asistire" ? "default" : "outline"}
                                onClick={() => handleConfirmarAsistencia(evento.id, "asistire")}
                                className={userAsistencia?.estado === "asistire" ? "bg-[#5ef5b9] text-[#04101c]" : ""}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Asistiré
                              </Button>
                              <Button
                                size="sm"
                                variant={userAsistencia?.estado === "no_podre" ? "default" : "outline"}
                                onClick={() => handleConfirmarAsistencia(evento.id, "no_podre")}
                                className={userAsistencia?.estado === "no_podre" ? "bg-red-500 text-white" : ""}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                No podré
                              </Button>
                              <Button
                                size="sm"
                                variant={userAsistencia?.estado === "quizas" ? "default" : "outline"}
                                onClick={() => handleConfirmarAsistencia(evento.id, "quizas")}
                                className={userAsistencia?.estado === "quizas" ? "bg-[#ffcf66] text-[#0a1224]" : ""}
                              >
                                <HelpCircle className="h-4 w-4 mr-2" />
                                Quizás
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Stat label="Asistirán" value={getAsistenciaCount(evento.id, "asistire")} color="#5ef5b9" />
                            <Stat label="No podrán" value={getAsistenciaCount(evento.id, "no_podre")} color="#ff6b6b" />
                            <Stat label="Quizás" value={getAsistenciaCount(evento.id, "quizas")} color="#ffcf66" />
                          </div>

                          {asistentes.length > 0 && (
                            <div className="pt-3 border-t border-white/10">
                              <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Respuestas ({asistentes.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {asistentes.map((asistente, i) => (
                                  <span
                                    key={i}
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      asistente.estado === "asistire"
                                        ? "bg-[#5ef5b9]/20 text-[#5ef5b9]"
                                        : asistente.estado === "no_podre"
                                          ? "bg-red-500/20 text-red-300"
                                          : "bg-[#ffcf66]/20 text-[#ffcf66]"
                                    }`}
                                  >
                                    {asistente.user}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {pastEvents.length > 0 && (
                <section className="band p-4 md:p-6 space-y-3 flow-in flow-in-delay-2">
                  <div className="text-sm text-slate-300">Eventos pasados</div>
                  <div className="space-y-2">
                    {pastEvents.slice(0, 3).map((evento, idx) => (
                      <div
                        key={evento.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 flow-in"
                        style={{ animationDelay: `${0.03 * idx}s` }}
                      >
                        <div className="flex items-center justify-between text-sm text-slate-200">
                          <span className="font-semibold text-white">{evento.titulo}</span>
                          <span className="text-slate-400">
                            {new Date(evento.fecha_inicio).toLocaleDateString("es-ES", { dateStyle: "medium" })}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <Stat label="Asistieron" value={getAsistenciaCount(evento.id, "asistire")} color="#5ef5b9" />
                          <Stat label="No pudieron" value={getAsistenciaCount(evento.id, "no_podre")} color="#ff6b6b" />
                          <Stat label="Quizás" value={getAsistenciaCount(evento.id, "quizas")} color="#ffcf66" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {upcomingEvents.length === 0 && pastEvents.length === 0 && (
                <section className="band p-6 text-center text-slate-400">No hay eventos disponibles</section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{label}</p>
      <p className="text-xl font-semibold" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

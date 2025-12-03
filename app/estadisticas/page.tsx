"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { TrendingUp, Users, Calendar } from "lucide-react"
import type { User } from "@/lib/types"
import { useSession } from "@/hooks/use-session"

export default function Page() {
  const [stats, setStats] = useState({
    gastosPorMes: [] as { mes: string; cantidad: number }[],
    eventosPorMes: [] as { mes: string; count: number }[],
    documentosPorUsuario: [] as { nombre: string; count: number }[],
    totalGastos: 0,
    totalEventos: 0,
    totalDocumentos: 0,
    totalNormas: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const { isLoading: sessionLoading } = useSession()

  useEffect(() => {
    if (!sessionLoading) {
      fetchData()
    }
  }, [sessionLoading])

  const fetchData = async () => {
    const supabase = createClient()
    setIsLoading(true)

    // Fetch all data
    const [{ data: gastos }, { data: eventos }, { data: documentos }, { data: normas }, { data: users }] =
      await Promise.all([
        supabase.from("gastos").select("cantidad, fecha"),
        supabase.from("eventos").select("fecha_inicio"),
        supabase.from("documentos").select("subido_por"),
        supabase.from("normas").select("id"),
        supabase.from("users").select("*"),
      ])

    // Calculate gastos por mes
    const gastosPorMes: Record<string, number> = {}
    gastos?.forEach((gasto) => {
      const mes = new Date(gasto.fecha).toLocaleDateString("es-ES", { year: "numeric", month: "short" })
      gastosPorMes[mes] = (gastosPorMes[mes] || 0) + Number(gasto.cantidad)
    })

    // Calculate eventos por mes
    const eventosPorMes: Record<string, number> = {}
    eventos?.forEach((evento) => {
      const mes = new Date(evento.fecha_inicio).toLocaleDateString("es-ES", { year: "numeric", month: "short" })
      eventosPorMes[mes] = (eventosPorMes[mes] || 0) + 1
    })

    // Calculate documentos por usuario
    const documentosPorUsuario: Record<string, number> = {}
    documentos?.forEach((doc) => {
      if (doc.subido_por) {
        documentosPorUsuario[doc.subido_por] = (documentosPorUsuario[doc.subido_por] || 0) + 1
      }
    })

    const documentosConNombres = Object.entries(documentosPorUsuario)
      .map(([userId, count]) => {
        const user = (users as User[])?.find((u) => u.id === userId)
        return {
          nombre: user?.nombre || "Desconocido",
          count,
        }
      })
      .sort((a, b) => b.count - a.count)

    setStats({
      gastosPorMes: Object.entries(gastosPorMes)
        .map(([mes, cantidad]) => ({ mes, cantidad }))
        .slice(-6),
      eventosPorMes: Object.entries(eventosPorMes)
        .map(([mes, count]) => ({ mes, count }))
        .slice(-6),
      documentosPorUsuario: documentosConNombres,
      totalGastos: gastos?.reduce((sum, g) => sum + Number(g.cantidad), 0) || 0,
      totalEventos: eventos?.length || 0,
      totalDocumentos: documentos?.length || 0,
      totalNormas: normas?.length || 0,
    })

    setIsLoading(false)
  }

  const maxGastos = Math.max(...stats.gastosPorMes.map((g) => g.cantidad), 1)
  const maxEventos = Math.max(...stats.eventosPorMes.map((e) => e.count), 1)
  const maxDocumentos = Math.max(...stats.documentosPorUsuario.map((d) => d.count), 1)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a1224] via-[#0f1c36] to-[#090f1c] text-white">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flow-in">
            <p className="uppercase text-xs tracking-[0.2em] text-[#5ee1ff]">Insights</p>
            <h1 className="text-3xl font-bold text-white text-balance">Estadísticas</h1>
            <p className="text-slate-300 mt-1">Análisis y métricas del grupo</p>
          </header>

          {isLoading ? (
            <p className="text-center text-slate-400">Cargando estadísticas...</p>
          ) : (
            <>
              <section className="band p-4 md:p-6 flow-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Gastos", value: stats.totalGastos.toLocaleString("es-ES", { style: "currency", currency: "EUR" }) },
                    { label: "Total Eventos", value: stats.totalEventos },
                    { label: "Total Documentos", value: stats.totalDocumentos },
                    { label: "Total Normas", value: stats.totalNormas },
                  ].map((item, idx) => (
                    <div
                      key={item.label}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1 flow-in"
                      style={{ animationDelay: `${0.04 * idx}s` }}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-[#5ee1ff]">{item.label}</p>
                      <p className="text-2xl font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="band p-4 md:p-6 space-y-3 flow-in">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <TrendingUp className="h-5 w-5 text-[#5ee1ff]" />
                    Gastos por mes
                  </div>
                  {stats.gastosPorMes.length === 0 ? (
                    <p className="text-slate-400">No hay datos disponibles</p>
                  ) : (
                    <div className="space-y-4">
                      {stats.gastosPorMes.map((item, idx) => (
                        <div key={idx} className="space-y-1 flow-in" style={{ animationDelay: `${0.03 * idx}s` }}>
                          <div className="flex items-center justify-between text-sm text-slate-200 capitalize">
                            <span>{item.mes}</span>
                            <span className="font-semibold text-white">
                              {item.cantidad.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#32d2ff] h-full rounded-full transition-all duration-500"
                              style={{ width: `${(item.cantidad / maxGastos) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="band p-4 md:p-6 space-y-3 flow-in flow-in-delay-2">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Calendar className="h-5 w-5 text-[#5ee1ff]" />
                    Eventos por mes
                  </div>
                  {stats.eventosPorMes.length === 0 ? (
                    <p className="text-slate-400">No hay datos disponibles</p>
                  ) : (
                    <div className="space-y-4">
                      {stats.eventosPorMes.map((item, idx) => (
                        <div key={idx} className="space-y-1 flow-in" style={{ animationDelay: `${0.03 * idx}s` }}>
                          <div className="flex items-center justify-between text-sm text-slate-200 capitalize">
                            <span>{item.mes}</span>
                            <span className="font-semibold text-white">
                              {item.count} evento{item.count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#7c7dff] h-full rounded-full transition-all duration-500"
                              style={{ width: `${(item.count / maxEventos) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="band p-4 md:p-6 space-y-3 flow-in flow-in-delay-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Users className="h-5 w-5 text-[#5ee1ff]" />
                  Documentos por usuario
                </div>
                {stats.documentosPorUsuario.length === 0 ? (
                  <p className="text-slate-400">No hay datos disponibles</p>
                ) : (
                  <div className="space-y-3">
                    {stats.documentosPorUsuario.map((item, idx) => (
                      <div key={idx} className="space-y-1 flow-in" style={{ animationDelay: `${0.03 * idx}s` }}>
                        <div className="flex items-center justify-between text-sm text-slate-200">
                          <span>{item.nombre}</span>
                          <span className="font-semibold text-white">
                            {item.count} documento{item.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-white/30 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(item.count / maxDocumentos) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

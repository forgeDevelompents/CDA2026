"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="flex min-h-screen bg-[#E7ECF3]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
          <div>
            <h1 className="text-3xl font-bold text-[#1C3A63] text-balance">Estadísticas</h1>
            <p className="text-[#2B2B2B]/70 mt-1">Análisis y métricas del grupo</p>
          </div>

          {isLoading ? (
            <p className="text-center text-[#2B2B2B]/60 py-8">Cargando estadísticas...</p>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-[#8CB4E1]/20 bg-gradient-to-br from-white to-[#E7ECF3]/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#1C3A63]">Total Gastos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#1C3A63]">
                      {stats.totalGastos.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#8CB4E1]/20 bg-gradient-to-br from-white to-[#E7ECF3]/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#1C3A63]">Total Eventos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#1C3A63]">{stats.totalEventos}</div>
                  </CardContent>
                </Card>

                <Card className="border-[#8CB4E1]/20 bg-gradient-to-br from-white to-[#E7ECF3]/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#1C3A63]">Total Documentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#1C3A63]">{stats.totalDocumentos}</div>
                  </CardContent>
                </Card>

                <Card className="border-[#8CB4E1]/20 bg-gradient-to-br from-white to-[#E7ECF3]/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#1C3A63]">Total Normas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#1C3A63]">{stats.totalNormas}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gastos por Mes */}
                <Card className="border-[#8CB4E1]/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1C3A63] flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#2F5E9A]" />
                      Gastos por Mes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.gastosPorMes.length === 0 ? (
                      <p className="text-sm text-[#2B2B2B]/60 text-center py-8">No hay datos disponibles</p>
                    ) : (
                      <div className="space-y-4">
                        {stats.gastosPorMes.map((item, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#2B2B2B] capitalize">{item.mes}</span>
                              <span className="font-semibold text-[#1C3A63]">
                                {item.cantidad.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                              </span>
                            </div>
                            <div className="w-full bg-[#E7ECF3] rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-[#2F5E9A] h-full rounded-full transition-all duration-500"
                                style={{ width: `${(item.cantidad / maxGastos) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Eventos por Mes */}
                <Card className="border-[#8CB4E1]/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1C3A63] flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#2F5E9A]" />
                      Eventos por Mes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.eventosPorMes.length === 0 ? (
                      <p className="text-sm text-[#2B2B2B]/60 text-center py-8">No hay datos disponibles</p>
                    ) : (
                      <div className="space-y-4">
                        {stats.eventosPorMes.map((item, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#2B2B2B] capitalize">{item.mes}</span>
                              <span className="font-semibold text-[#1C3A63]">
                                {item.count} evento{item.count !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="w-full bg-[#E7ECF3] rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-[#8CB4E1] h-full rounded-full transition-all duration-500"
                                style={{ width: `${(item.count / maxEventos) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Documentos por Usuario */}
              <Card className="border-[#8CB4E1]/20">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1C3A63] flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#2F5E9A]" />
                    Documentos Subidos por Usuario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.documentosPorUsuario.length === 0 ? (
                    <p className="text-sm text-[#2B2B2B]/60 text-center py-8">No hay datos disponibles</p>
                  ) : (
                    <div className="space-y-4">
                      {stats.documentosPorUsuario.map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#2B2B2B]">{item.nombre}</span>
                            <span className="font-semibold text-[#1C3A63]">
                              {item.count} documento{item.count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="w-full bg-[#E7ECF3] rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-[#1C3A63] h-full rounded-full transition-all duration-500"
                              style={{ width: `${(item.count / maxDocumentos) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

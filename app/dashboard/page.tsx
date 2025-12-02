import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, Calendar, FileText, ScrollText, TrendingUp, CheckCircle2 } from "lucide-react"
import { getSessionUser } from "@/lib/auth"

export default async function Page() {
  const supabase = await createClient()

  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    redirect("/auth/login")
  }

  // Fetch dashboard statistics
  const [
    { count: gastosCount, data: gastosData },
    { count: eventosCount, data: proximoEvento },
    { count: documentosCount },
    { count: normasCount },
    { count: votacionesCount },
  ] = await Promise.all([
    supabase.from("gastos").select("cantidad", { count: "exact" }),
    supabase.from("eventos").select("*").gte("fecha_inicio", new Date().toISOString()).order("fecha_inicio").limit(1),
    supabase.from("documentos").select("*", { count: "exact", head: true }),
    supabase.from("normas").select("*", { count: "exact", head: true }),
    supabase.from("votaciones").select("*", { count: "exact", head: true }).eq("estado", "activa"),
  ])

  const totalGastos = gastosData?.reduce((sum, g) => sum + Number(g.cantidad), 0) || 0

  // Calculate monthly expenses for mini chart
  const gastosRecientes = await supabase
    .from("gastos")
    .select("cantidad, fecha")
    .gte("fecha", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    .order("fecha")

  return (
    <div className="flex min-h-screen bg-[#E7ECF3]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1C3A63] text-balance">Dashboard</h1>
              <p className="text-[#2B2B2B]/70 mt-1">Bienvenido a CDA 2026</p>
            </div>
            <div className="text-sm text-[#2B2B2B]/60">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Total Gastos */}
            <Card className="hover-lift border-[#8CB4E1]/20 bg-gradient-to-br from-white to-[#E7ECF3]/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#1C3A63]">Total Gastos</CardTitle>
                <Receipt className="h-5 w-5 text-[#2F5E9A]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1C3A63]">
                  {totalGastos.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                </div>
                <p className="text-xs text-[#2B2B2B]/60 mt-1">{gastosCount || 0} registros</p>
              </CardContent>
            </Card>

            {/* Votaciones */}
            <Card className="hover-lift border-[#8CB4E1]/20 bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#1C3A63]">Votaciones activas</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-[#2F5E9A]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1C3A63]">{votacionesCount || 0}</div>
                <p className="text-xs text-[#2B2B2B]/60 mt-1">en curso</p>
              </CardContent>
            </Card>


            {/* Próximo Evento */}
            <Card className="hover-lift border-[#8CB4E1]/20 bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#1C3A63]">Próximo evento</CardTitle>
                <Calendar className="h-5 w-5 text-[#2F5E9A]" />
              </CardHeader>
              <CardContent>
                {proximoEvento && proximoEvento.length > 0 ? (
                  <>
                    <div className="text-lg font-semibold text-[#1C3A63] truncate">{proximoEvento[0].titulo}</div>
                    <p className="text-xs text-[#2B2B2B]/60 mt-1">
                      {new Date(proximoEvento[0].fecha_inicio).toLocaleString("es-ES", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-[#2B2B2B]/60">Sin eventos próximos</div>
                )}
              </CardContent>
            </Card>

            {/* Documentos */}
            <Card className="hover-lift border-[#8CB4E1]/20 bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#1C3A63]">Documentos</CardTitle>
                <FileText className="h-5 w-5 text-[#2F5E9A]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1C3A63]">{documentosCount || 0}</div>
                <p className="text-xs text-[#2B2B2B]/60 mt-1">archivos subidos</p>
              </CardContent>
            </Card>
          </div>

          {/* Bloque medio */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Actividad */}
            <Card className="hover-lift border-[#8CB4E1]/20 xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg text-[#1C3A63] flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#2F5E9A]" />
                  Actividad
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-[#E7ECF3]/60">
                  <p className="text-xs text-[#2B2B2B]/60">Eventos totales</p>
                  <p className="text-2xl font-semibold text-[#1C3A63] mt-1">{eventosCount || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#E7ECF3]/60">
                  <p className="text-xs text-[#2B2B2B]/60">Gastos registrados</p>
                  <p className="text-2xl font-semibold text-[#1C3A63] mt-1">{gastosCount || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#E7ECF3]/60">
                  <p className="text-xs text-[#2B2B2B]/60">Normas activas</p>
                  <p className="text-2xl font-semibold text-[#1C3A63] mt-1">{normasCount || 0}</p>
                </div>
              </CardContent>
            </Card>

            {/* Normas */}
            <Card className="hover-lift border-[#8CB4E1]/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#1C3A63] flex items-center gap-2">
                  <ScrollText className="h-5 w-5 text-[#2F5E9A]" />
                  Normas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[#1C3A63]">{normasCount || 0}</div>
                <p className="text-sm text-[#2B2B2B]/60 mt-1">registradas</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 gap-6">
            {/* Gastos Recientes */}
            <Card className="border-[#8CB4E1]/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#1C3A63]">Gastos recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {gastosRecientes.data && gastosRecientes.data.length > 0 ? (
                  <div className="space-y-2">
                    {gastosRecientes.data.slice(0, 6).map((gasto, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#E7ECF3] transition-colors"
                      >
                        <span className="text-sm text-[#2B2B2B]">
                          {new Date(gasto.fecha).toLocaleDateString("es-ES")}
                        </span>
                        <span className="font-semibold text-[#1C3A63]">
                          {Number(gasto.cantidad).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#2B2B2B]/60">No hay gastos registrados</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

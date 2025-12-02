import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, Calendar, FileText, ScrollText, TrendingUp, CheckCircle2 } from "lucide-react"
import Image from "next/image"

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch dashboard statistics
  const [
    { count: gastosCount, data: gastosData },
    { count: eventosCount, data: proximoEvento },
    { count: documentosCount },
    { count: normasCount },
    { count: votacionesCount },
    { data: logoData },
  ] = await Promise.all([
    supabase.from("gastos").select("cantidad", { count: "exact" }),
    supabase.from("eventos").select("*").gte("fecha_inicio", new Date().toISOString()).order("fecha_inicio").limit(1),
    supabase.from("documentos").select("*", { count: "exact", head: true }),
    supabase.from("normas").select("*", { count: "exact", head: true }),
    supabase.from("votaciones").select("*", { count: "exact", head: true }).eq("estado", "activa"),
    supabase.from("configuracion").select("valor").eq("clave", "logo_url").single(),
  ])

  const totalGastos = gastosData?.reduce((sum, g) => sum + Number(g.cantidad), 0) || 0
  const logoUrl = logoData?.valor || "/logo-clavaris.jpg"

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

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Gastos */}
            <Card className="hover-lift border-[#8CB4E1]/20 bg-gradient-to-br from-white to-[#E7ECF3]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#1C3A63]">Total Gastos</CardTitle>
                <Receipt className="h-4 w-4 text-[#2F5E9A]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1C3A63]">
                  {totalGastos.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                </div>
                <p className="text-xs text-[#2B2B2B]/60 mt-1">{gastosCount || 0} registros</p>
              </CardContent>
            </Card>

            {/* Próximo Evento */}
            <Card className="hover-lift border-[#8CB4E1]/20 bg-gradient-to-br from-white to-[#E7ECF3]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#1C3A63]">Próximo Evento</CardTitle>
                <Calendar className="h-4 w-4 text-[#2F5E9A]" />
              </CardHeader>
              <CardContent>
                {proximoEvento && proximoEvento.length > 0 ? (
                  <>
                    <div className="text-lg font-semibold text-[#1C3A63] truncate">{proximoEvento[0].titulo}</div>
                    <p className="text-xs text-[#2B2B2B]/60 mt-1">
                      {new Date(proximoEvento[0].fecha_inicio).toLocaleDateString("es-ES")}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-[#2B2B2B]/60">No hay eventos próximos</div>
                )}
              </CardContent>
            </Card>

            {/* Documentos */}
            <Card className="hover-lift border-[#8CB4E1]/20 bg-gradient-to-br from-white to-[#E7ECF3]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#1C3A63]">Documentos</CardTitle>
                <FileText className="h-4 w-4 text-[#2F5E9A]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1C3A63]">{documentosCount || 0}</div>
                <p className="text-xs text-[#2B2B2B]/60 mt-1">archivos subidos</p>
              </CardContent>
            </Card>

            {/* Normas */}
            <Card className="hover-lift border-[#8CB4E1]/20 bg-gradient-to-br from-white to-[#E7ECF3]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#1C3A63]">Normas Activas</CardTitle>
                <ScrollText className="h-4 w-4 text-[#2F5E9A]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1C3A63]">{normasCount || 0}</div>
                <p className="text-xs text-[#2B2B2B]/60 mt-1">normas registradas</p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Votaciones Activas */}
            <Card className="hover-lift border-[#8CB4E1]/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#1C3A63] flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#2F5E9A]" />
                  Votaciones Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1C3A63]">{votacionesCount || 0}</div>
                <p className="text-sm text-[#2B2B2B]/60 mt-2">votaciones abiertas</p>
              </CardContent>
            </Card>

            {/* Logo CDA */}
            <Card className="hover-lift border-[#8CB4E1]/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#1C3A63]">CDA 2026</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-6">
                <Image
                  src={logoUrl || "/placeholder.svg"}
                  alt="CDA 2026"
                  width={140}
                  height={140}
                  className="object-contain"
                />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="hover-lift border-[#8CB4E1]/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#1C3A63] flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#2F5E9A]" />
                  Actividad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#2B2B2B]/70">Eventos totales</span>
                  <span className="font-semibold text-[#1C3A63]">{eventosCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#2B2B2B]/70">Gastos registrados</span>
                  <span className="font-semibold text-[#1C3A63]">{gastosCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#2B2B2B]/70">Documentos</span>
                  <span className="font-semibold text-[#1C3A63]">{documentosCount || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gastos Recientes */}
            <Card className="border-[#8CB4E1]/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#1C3A63]">Gastos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {gastosRecientes.data && gastosRecientes.data.length > 0 ? (
                  <div className="space-y-2">
                    {gastosRecientes.data.slice(0, 5).map((gasto, idx) => (
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

            {/* Info Card */}
            <Card className="border-[#8CB4E1]/20 bg-gradient-to-br from-[#2F5E9A]/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-lg text-[#1C3A63]">Bienvenido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#2B2B2B] leading-relaxed">
                  Portal privado del grupo Clavaris de la Divina Aurora 2026 de Benifaió. Aquí puedes gestionar todos
                  los aspectos del grupo: gastos, eventos, votaciones, documentos y mucho más.
                </p>
                <div className="mt-4 pt-4 border-t border-[#8CB4E1]/20">
                  <p className="text-xs text-[#2B2B2B]/60">
                    Usa el menú lateral para navegar por las diferentes secciones.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

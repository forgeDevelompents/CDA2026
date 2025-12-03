import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"
import { Receipt, Calendar, FileText, ScrollText, TrendingUp, CheckCircle2 } from "lucide-react"
import { getSessionUser } from "@/lib/auth"

export default async function Page() {
  const supabase = await createClient()

  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    redirect("/auth/login")
  }

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

  const gastosRecientes = await supabase
    .from("gastos")
    .select("cantidad, fecha")
    .gte("fecha", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    .order("fecha")

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a1224] via-[#0f1c36] to-[#090f1c] text-white">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-hidden">
        <div className="w-full space-y-10">
          {/* Hero */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flow-in">
            <div className="space-y-1">
              <p className="uppercase text-xs tracking-[0.2em] text-[#5ee1ff]">Panel</p>
              <h1 className="text-4xl font-bold leading-tight">Dashboard</h1>
              <p className="text-slate-300">Bienvenido a CDA 2026</p>
            </div>
            <div className="text-sm text-slate-400">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          {/* KPIs Band */}
          <div className="band p-4 md:p-6 flow-in flow-in-delay-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-fr">
              <SummaryPanel
                title="Total Gastos"
                value={totalGastos.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                caption={`${gastosCount || 0} registros`}
                icon={<Receipt className="h-5 w-5 text-[#5ee1ff]" />}
              />
              <SummaryPanel
                title="Votaciones activas"
                value={votacionesCount || 0}
                caption="en curso"
                icon={<CheckCircle2 className="h-5 w-5 text-[#5ee1ff]" />}
              />
              <SummaryPanel
                title="Próximo evento"
                value={proximoEvento && proximoEvento.length > 0 ? proximoEvento[0].titulo : "Sin eventos"}
                caption={
                  proximoEvento && proximoEvento.length > 0
                    ? new Date(proximoEvento[0].fecha_inicio).toLocaleString("es-ES", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Sin eventos próximos"
                }
                icon={<Calendar className="h-5 w-5 text-[#5ee1ff]" />}
              />
              <SummaryPanel
                title="Documentos"
                value={documentosCount || 0}
                caption="archivos subidos"
                icon={<FileText className="h-5 w-5 text-[#5ee1ff]" />}
              />
            </div>
          </div>

          {/* Activity + Normas strip */}
          <div className="band p-4 md:p-6 flow-in flow-in-delay-2">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 auto-rows-fr">
              <div className="space-y-4 xl:col-span-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <TrendingUp className="h-5 w-5 text-[#5ee1ff]" />
                    Actividad
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Actualizado en tiempo real</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 auto-rows-fr">
                  <MiniStat label="Eventos totales" value={eventosCount || 0} />
                  <MiniStat label="Gastos registrados" value={gastosCount || 0} />
                  <MiniStat label="Normas activas" value={normasCount || 0} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <ScrollText className="h-5 w-5 text-[#5ee1ff]" />
                  Normas
                </div>
                <div className="text-4xl font-bold text-white">{normasCount || 0}</div>
                <p className="text-sm text-slate-400">registradas</p>
              </div>
            </div>
          </div>

          {/* Gastos recientes strip */}
          <div className="band p-4 md:p-6 flow-in flow-in-delay-3">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">Gastos recientes</div>
              <div className="h-px flex-1 ml-4 bg-gradient-to-r from-white/30 to-transparent" />
            </div>
            {gastosRecientes.data && gastosRecientes.data.length > 0 ? (
              <div className="space-y-2">
                {gastosRecientes.data.slice(0, 6).map((gasto, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors border border-white/5"
                  >
                    <span className="text-sm text-slate-200">{new Date(gasto.fecha).toLocaleDateString("es-ES")}</span>
                    <span className="font-semibold text-white">
                      {Number(gasto.cantidad).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No hay gastos registrados</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function SummaryPanel({
  title,
  value,
  caption,
  icon,
}: {
  title: string
  value: string | number
  caption: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white/0 border border-white/8 p-4 shadow-[0_10px_40px_rgba(6,10,20,0.35)] backdrop-blur-md flow-in">
      <div className="flex items-center justify-between text-slate-200 text-sm">
        <span>{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white truncate">{value}</div>
      <p className="text-xs text-slate-400">{caption}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/5 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-xl font-semibold text-white mt-1">{value}</p>
    </div>
  )
}

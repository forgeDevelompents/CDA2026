import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info, Building } from "lucide-react"
import { getSessionUser } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"

export default async function Page() {
  const supabase = await createClient()

  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    redirect("/auth/login")
  }

  const { data: informacion } = await supabase.from("informacion").select("*")

  const quienesSomos = informacion?.find((i) => i.seccion === "quienes_somos")?.contenido || ""
  const queHacemos = informacion?.find((i) => i.seccion === "que_hacemos")?.contenido || ""

  const canManageConfig = hasPermission(sessionUser, "config:manage")

  return (
    <div className="flex min-h-screen bg-[#E7ECF3]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div>
            <h1 className="text-3xl font-bold text-[#1C3A63] text-balance">Información</h1>
            <p className="text-[#2B2B2B]/70 mt-1">Sobre el grupo CDA 2026</p>
          </div>

          <div className="grid gap-6">
            {/* Quiénes Somos */}
            <Card className="hover-lift border-[#8CB4E1]/20">
              <CardHeader className="border-b border-[#8CB4E1]/20">
                <CardTitle className="text-xl text-[#1C3A63] flex items-center gap-2">
                  <Info className="h-5 w-5 text-[#2F5E9A]" />
                  Quiénes Somos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-[#2B2B2B] leading-relaxed whitespace-pre-wrap">{quienesSomos}</p>
              </CardContent>
            </Card>

            {/* Qué Hacemos */}
            <Card className="hover-lift border-[#8CB4E1]/20">
              <CardHeader className="border-b border-[#8CB4E1]/20">
                <CardTitle className="text-xl text-[#1C3A63] flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#2F5E9A]" />
                  Qué Hacemos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-[#2B2B2B] leading-relaxed whitespace-pre-wrap">{queHacemos}</p>
              </CardContent>
            </Card>

            {/* Pueblo */}
            <Card className="hover-lift border-[#8CB4E1]/20 bg-gradient-to-br from-[#2F5E9A]/5 to-transparent">
              <CardHeader className="border-b border-[#8CB4E1]/20">
                <CardTitle className="text-xl text-[#1C3A63]">Benifaió</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="aspect-video relative rounded-lg overflow-hidden bg-[#E7ECF3] mb-4">
                  <img src="/benifai--pueblo-valencia-espa-a.jpg" alt="Benifaió" className="w-full h-full object-cover" />
                </div>
                <p className="text-[#2B2B2B] leading-relaxed">
                  Benifaió es un municipio de la Comunidad Valenciana, España, situado en la comarca de la Ribera Alta,
                  provincia de Valencia.
                </p>
              </CardContent>
            </Card>
          </div>

          {canManageConfig && (
            <Card className="border-[#2F5E9A] bg-[#2F5E9A]/5">
              <CardContent className="pt-6">
                <p className="text-sm text-[#1C3A63]">
                  <strong>Nota para administradores:</strong> Puedes editar esta información desde la sección de
                  Configuración.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  Info,
  Receipt,
  Calendar,
  Users,
  FileText,
  Vote,
  FolderOpen,
  BarChart3,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  Settings,
} from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import type { SessionUser } from "@/lib/auth"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/calendario", label: "Calendario", icon: Calendar },
  { href: "/cargos", label: "Cargos", icon: Users },
  { href: "/normas", label: "Normas", icon: FileText },
  { href: "/votaciones", label: "Votaciones", icon: Vote },
  { href: "/documentos", label: "Documentos", icon: FolderOpen },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/asistencias", label: "Asistencias", icon: ClipboardCheck },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState("/logo-clavaris.jpg")
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data: configData } = await supabase.from("configuracion").select("valor").eq("clave", "logo_url").limit(1)

      if (configData && configData.length > 0 && configData[0]?.valor) {
        setLogoUrl(configData[0].valor)
      }

      // Fetch session user
      const sessionRes = await fetch("/api/session")
      if (sessionRes.ok) {
        const data = await sessionRes.json()
        setUser(data.user as SessionUser)
      } else {
        setUser(null)
      }
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" })
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Abrir menú"
          className="bg-white/10 text-white border border-white/20 rounded-full p-2 backdrop-blur-lg shadow-[0_10px_30px_rgba(5,10,25,0.35)] hover:bg-white/20 hover:border-white/30 transition-all"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 text-white transition-transform duration-300 flex flex-col shadow-[0_20px_60px_rgba(5,10,25,0.6)]",
          "bg-[linear-gradient(90deg,rgba(12,21,40,0.94) 0%,rgba(12,21,40,0.86) 70%,rgba(12,21,40,0.0) 100%)]",
          "backdrop-blur-xl",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8CB4E1] to-[#2F5E9A] opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-500" />

              <div className="relative w-40 h-40 rounded-full bg-white/8 p-1.5 shadow-[0_0_30px_rgba(50,210,255,0.18),0_0_45px_rgba(124,125,255,0.25)] ring-4 ring-white/10 group-hover:shadow-[0_0_40px_rgba(50,210,255,0.35),0_0_70px_rgba(124,125,255,0.35)] group-hover:scale-105 transition-all duration-500">
                <div className="absolute inset-1 rounded-full border border-white/12" />
                <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white/5">
                  <Image
                    src={logoUrl || "/placeholder.svg"}
                    alt="CDA 2026"
                    width={200}
                    height={200}
                    className="object-cover h-full w-full rounded-full mix-blend-screen"
                  />
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-12 bg-gradient-to-b from-white/30 to-transparent rounded-full blur-md" />
              </div>
            </div>
          </div>
          {user && (
            <div className="text-center">
              <p className="text-sm font-medium text-[#a6e8ff]">{user.nombre}</p>
              <p className="text-xs text-[#a6e8ff]/70 capitalize">{user.cargo || user.rol}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-white/10 text-white shadow-[0_10px_30px_rgba(50,210,255,0.25)] border border-white/10"
                        : "text-[#9ab7e5] hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="h-5 w-5 transition-transform group-hover:scale-110 text-[#32d2ff]" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {user?.rol === "admin" && (
            <Link
              href="/configuracion"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#9ab7e5] hover:bg-white/5 hover:text-white transition-all duration-200"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Configuración</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#9ab7e5] hover:bg-red-600/80 hover:text-white transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

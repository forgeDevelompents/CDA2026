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
  { href: "/informacion", label: "Información", icon: Info },
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
          className="bg-white shadow-lg"
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
          "fixed top-0 left-0 z-40 h-screen w-64 bg-[#1C3A63] text-white transition-transform duration-300 flex flex-col shadow-2xl",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo section */}
        <div className="p-6 border-b border-[#2F5E9A]/30">
          <div className="flex items-center justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8CB4E1] to-[#2F5E9A] opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-500" />

              <div className="relative w-32 h-32 rounded-full bg-white p-3 shadow-[0_0_25px_rgba(140,180,225,0.35),0_0_40px_rgba(47,94,154,0.25)] ring-4 ring-white/15 group-hover:shadow-[0_0_35px_rgba(140,180,225,0.55),0_0_55px_rgba(47,94,154,0.35)] group-hover:scale-105 transition-all duration-500">
                <div className="absolute inset-2 rounded-full border-2 border-[#8CB4E1]/30" />
                <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white">
                  <Image
                    src={logoUrl || "/placeholder.svg"}
                    alt="CDA 2026"
                    width={120}
                    height={120}
                    className="object-contain p-2"
                  />
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-12 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-md" />
              </div>
            </div>
          </div>
          {user && (
            <div className="text-center">
              <p className="text-sm font-medium text-[#8CB4E1]">{user.nombre}</p>
              <p className="text-xs text-[#8CB4E1]/70 capitalize">{user.rol}</p>
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
                        ? "bg-[#2F5E9A] text-white shadow-lg"
                        : "text-[#8CB4E1] hover:bg-[#2F5E9A]/50 hover:text-white",
                    )}
                  >
                    <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#2F5E9A]/30 space-y-2">
          {user?.rol === "admin" && (
            <Link
              href="/configuracion"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#8CB4E1] hover:bg-[#2F5E9A]/50 hover:text-white transition-all duration-200"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Configuración</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#8CB4E1] hover:bg-red-600/80 hover:text-white transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

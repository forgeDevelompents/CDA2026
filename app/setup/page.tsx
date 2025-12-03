"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [users, setUsers] = useState([
    {
      username: "admin",
      email: "admin@cda2026.com",
      password: "CDA2026admin!",
      role: "admin",
      nombre: "Administrador CDA",
    },
    {
      username: "miembro",
      email: "miembro@cda2026.com",
      password: "CDA2026member!",
      role: "miembro",
      nombre: "Miembro de Prueba",
    },
  ])

  const createUsers = async () => {
    setLoading(true)
    setMessage("Creando usuarios...")

    try {
      const response = await fetch("/api/create-default-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("✅ Usuarios creados exitosamente!")
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1220] via-[#0f1f37] to-[#0b1220] p-4 text-white">
      <Card className="w-full max-w-2xl p-8 border-white/10 bg-white/5">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo */}
          <div className="relative w-32 h-32 rounded-full bg-white/10 shadow-2xl p-4 border border-white/10">
            <Image src="/logo-clavaris.jpg" alt="CDA 2026" fill className="object-contain rounded-full mix-blend-screen" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Setup Inicial CDA 2026</h1>
            <p className="text-slate-300">Configura los usuarios predefinidos para acceder a la aplicación</p>
          </div>

          {/* Lista de usuarios que se crearán */}
          <div className="w-full space-y-4">
            <h2 className="text-lg font-semibold text-white">Usuarios que se crearán:</h2>
            {users.map((user, index) => (
              <Card key={index} className="p-4 bg-white/5 border border-white/10 text-white">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <Label className="text-slate-300">Usuario:</Label>
                    <p className="font-semibold">{user.username}</p>
                  </div>
                  <div>
                    <Label className="text-slate-300">Rol:</Label>
                    <p className="font-semibold uppercase">{user.role}</p>
                  </div>
                  <div>
                    <Label className="text-slate-300">Email:</Label>
                    <p className="font-mono text-xs">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-slate-300">Contraseña:</Label>
                    <p className="font-mono text-xs">{user.password}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-slate-300">Nombre:</Label>
                    <p>{user.nombre}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Botón de creación */}
          <Button onClick={createUsers} disabled={loading} className="w-full bg-[#32d2ff] text-[#0b1220] hover:bg-[#5ee1ff]" size="lg">
            {loading ? "Creando usuarios..." : "Crear Usuarios Predefinidos"}
          </Button>

          {/* Mensaje de resultado */}
          {message && (
            <div
              className={`w-full p-4 rounded-lg text-center font-semibold ${
                message.includes("✅")
                  ? "bg-green-500/15 text-green-100 border border-green-400/40"
                  : "bg-red-500/15 text-red-100 border border-red-400/40"
              }`}
            >
              {message}
            </div>
          )}

          {/* Instrucciones */}
          <div className="w-full p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="font-semibold text-white mb-2">📋 Instrucciones:</h3>
            <ol className="text-sm text-slate-200 space-y-1 list-decimal list-inside">
              <li>Haz clic en "Crear Usuarios Predefinidos"</li>
              <li>Espera a que se completelaoperación</li>
              <li>
                Una vez creados, ve a <code className="bg-white/10 px-1 rounded text-white">/auth/login</code>
              </li>
              <li>Inicia sesión con uno de los usuarios creados</li>
              <li>🔒 IMPORTANTE: Elimina esta página después del setup</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  )
}

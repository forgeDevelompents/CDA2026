// API Route para crear usuarios predefinidos desde la aplicación
// Acceder a: POST /api/create-default-users

import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuración de Supabase incompleta" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Insertar/actualizar usuarios de ejemplo directamente en la tabla users (requiere columna "password")
    const users = [
      {
        email: "admin@cda2026.local",
        username: "admin",
        nombre: "Administrador CDA 2026",
        rol: "admin",
        password: "CDA2026admin!",
        cargo: "President",
      },
      {
        email: "miembro@cda2026.local",
        username: "miembro",
        nombre: "Miembro Test",
        rol: "miembro",
        password: "CDA2026member!",
        cargo: "clavari d'honor",
      },
    ]

    const { error: upsertError } = await supabaseAdmin.from("users").upsert(users, { onConflict: "email" })
    if (upsertError) {
      console.error("Error creando usuarios:", upsertError.message)
      return NextResponse.json({ error: "Error creando usuarios", details: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Usuarios predefinidos creados exitosamente",
      users: users.map((u) => ({ username: u.username, email: u.email, password: u.password, rol: u.rol })),
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Error creando usuarios", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}

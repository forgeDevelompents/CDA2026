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

    // Usuario Admin
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@cda2026.local",
      password: "CDA2026admin!",
      email_confirm: true,
      user_metadata: {
        username: "admin",
        nombre: "Administrador CDA 2026",
        rol: "admin",
      },
    })

    if (adminError && !adminError.message.includes("already registered")) {
      console.error("Error creando admin:", adminError.message)
      return NextResponse.json({ error: "Error creando admin", details: adminError.message }, { status: 500 })
    }

    // Insertar en tabla users
    if (adminData?.user) {
      await supabaseAdmin.from("users").upsert({
        id: adminData.user.id,
        email: "admin@cda2026.local",
        username: "admin",
        nombre: "Administrador CDA 2026",
        rol: "admin",
      })
    }

    // Usuario Miembro
    const { data: memberData, error: memberError } = await supabaseAdmin.auth.admin.createUser({
      email: "miembro@cda2026.local",
      password: "CDA2026member!",
      email_confirm: true,
      user_metadata: {
        username: "miembro",
        nombre: "Miembro Test",
        rol: "miembro",
      },
    })

    if (memberError && !memberError.message.includes("already registered")) {
      console.error("Error creando miembro:", memberError.message)
      return NextResponse.json({ error: "Error creando miembro", details: memberError.message }, { status: 500 })
    }

    // Insertar en tabla users
    if (memberData?.user) {
      await supabaseAdmin.from("users").upsert({
        id: memberData.user.id,
        email: "miembro@cda2026.local",
        username: "miembro",
        nombre: "Miembro Test",
        rol: "miembro",
      })
    }

    return NextResponse.json({
      success: true,
      message: "Usuarios predefinidos creados exitosamente",
      users: [
        { username: "admin", email: "admin@cda2026.local", password: "CDA2026admin!", rol: "admin" },
        { username: "miembro", email: "miembro@cda2026.local", password: "CDA2026member!", rol: "miembro" },
      ],
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Error creando usuarios", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}

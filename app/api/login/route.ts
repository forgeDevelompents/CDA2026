import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import type { SessionUser } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Supabase no está configurado" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, username, nombre, rol, password, cargo")
      .eq("username", username)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 })
    }

    if (user.password !== password) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
    }

    const sessionUser: SessionUser = {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
      cargo: user.cargo,
    }

    const response = NextResponse.json({ success: true, user: sessionUser })
    response.cookies.set("simple_session", JSON.stringify(sessionUser), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}

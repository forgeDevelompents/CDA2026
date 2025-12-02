import type { SessionUser } from "./auth"

type Permission =
  | "cargos:manage"
  | "gastos:manage"
  | "calendario:manage"
  | "normas:manage"
  | "votaciones:manage"
  | "documentos:manage"
  | "config:manage"

const cargoPermissions: Record<string, Permission[]> = {
  "clavari d'honor": [],
  President: ["cargos:manage", "gastos:manage", "calendario:manage", "normas:manage", "votaciones:manage", "documentos:manage", "config:manage"],
  Vicepresident: [],
  Secretari: ["cargos:manage", "gastos:manage", "calendario:manage", "normas:manage", "votaciones:manage", "documentos:manage", "config:manage"],
  Tresorer: ["cargos:manage", "gastos:manage"],
  "Cobrador de multes": ["cargos:manage"],
  xarxes: ["votaciones:manage", "documentos:manage"],
  lotero: ["votaciones:manage"],
}

const adminPermissions: Permission[] = [
  "cargos:manage",
  "gastos:manage",
  "calendario:manage",
  "normas:manage",
  "votaciones:manage",
  "documentos:manage",
  "config:manage",
]

export function hasPermission(user: SessionUser | null, permission: Permission): boolean {
  if (!user) return false

  if (user.rol === "admin") {
    return true
  }

  const cargo = user.cargo || ""
  const perms = cargoPermissions[cargo] || []
  if (perms.includes(permission)) return true

  if (user.rol === "miembro") {
    // miembros sin cargo especial no tienen permisos de gestión extra
    return false
  }

  return false
}

export type { Permission }

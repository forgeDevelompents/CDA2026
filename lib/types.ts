export interface User {
  id: string
  email: string
  username?: string
  nombre: string
  rol: "admin" | "miembro"
  cargo?: string
  password?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Gasto {
  id: string
  fecha: string
  concepto: string
  cantidad: number
  categoria?: string
  pagado_por?: string
  notas?: string
  created_at: string
  updated_at: string
}

export interface Evento {
  id: string
  titulo: string
  descripcion?: string
  fecha_inicio: string
  fecha_fin?: string
  ubicacion?: string
  tipo?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Asistencia {
  id: string
  evento_id: string
  user_id: string
  estado: "asistire" | "no_podre" | "quizas"
  created_at: string
  updated_at: string
}

export interface Cargo {
  id: string
  user_id?: string
  cargo: string
  observaciones?: string
  created_at: string
  updated_at: string
}

export interface Norma {
  id: string
  titulo: string
  descripcion: string
  orden?: number
  created_at: string
  updated_at: string
}

export interface Votacion {
  id: string
  titulo: string
  descripcion?: string
  estado: "activa" | "cerrada"
  created_by?: string
  created_at: string
  fecha_cierre?: string
  updated_at: string
}

export interface OpcionVotacion {
  id: string
  votacion_id: string
  texto: string
  orden?: number
  created_at: string
}

export interface Voto {
  id: string
  votacion_id: string
  opcion_id: string
  user_id: string
  created_at: string
}

export interface Documento {
  id: string
  nombre: string
  descripcion?: string
  url: string
  tipo?: string
  tamano?: number
  subido_por?: string
  created_at: string
}

export interface Configuracion {
  id: string
  clave: string
  valor?: string
  descripcion?: string
  updated_at: string
}

export interface Informacion {
  id: string
  seccion: string
  contenido: string
  updated_at: string
}

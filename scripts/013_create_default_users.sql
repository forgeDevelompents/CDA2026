-- Script para crear usuarios predefinidos en Supabase Auth
-- IMPORTANTE: Estos usuarios se crearán directamente en auth.users

-- Primero, insertar usuarios en auth.users (esto normalmente lo hace Supabase Auth)
-- Usuario Admin: username: admin, password: CDA2026admin!
-- Usuario Miembro: username: miembro, password: CDA2026member!

-- Nota: Supabase requiere que los usuarios se registren a través de la API de Auth
-- Este script prepara la tabla users para recibir los datos cuando se creen

-- Para crear los usuarios, necesitas usar la API de Supabase o el dashboard
-- Por ahora, vamos a crear una función helper que te permita crear usuarios manualmente

-- Función para crear usuario manualmente (solo para desarrollo)
CREATE OR REPLACE FUNCTION create_app_user(
  p_email TEXT,
  p_username TEXT,
  p_nombre TEXT,
  p_password TEXT,
  p_rol TEXT DEFAULT 'miembro'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  result JSON;
BEGIN
  -- Primero verificar que el username no exista
  IF EXISTS (SELECT 1 FROM public.users WHERE username = p_username) THEN
    RETURN json_build_object('error', 'El username ya existe');
  END IF;

  -- Nota: Esta función es un placeholder
  -- Debes crear los usuarios desde el código usando Supabase Auth API
  RETURN json_build_object('success', true, 'message', 'Usa la API de Supabase para crear usuarios');
END;
$$;

-- Mensaje informativo
DO $$
BEGIN
  RAISE NOTICE 'Para crear usuarios, usa el siguiente endpoint desde tu aplicación:';
  RAISE NOTICE 'POST /auth/v1/admin/users con el service_role_key';
  RAISE NOTICE '';
  RAISE NOTICE 'Usuario Admin sugerido:';
  RAISE NOTICE '  email: admin@cda2026.local';
  RAISE NOTICE '  username: admin';
  RAISE NOTICE '  nombre: Administrador';
  RAISE NOTICE '  password: CDA2026admin!';
  RAISE NOTICE '  rol: admin';
  RAISE NOTICE '';
  RAISE NOTICE 'Usuario Miembro sugerido:';
  RAISE NOTICE '  email: miembro@cda2026.local';
  RAISE NOTICE '  username: miembro';
  RAISE NOTICE '  nombre: Miembro Test';
  RAISE NOTICE '  password: CDA2026member!';
  RAISE NOTICE '  rol: miembro';
END $$;

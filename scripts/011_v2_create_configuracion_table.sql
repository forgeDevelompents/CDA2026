-- Create configuracion (app settings) table
CREATE TABLE IF NOT EXISTS public.configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT NOT NULL UNIQUE,
  valor TEXT,
  descripcion TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Authenticated users can view configuracion" ON public.configuracion;
DROP POLICY IF EXISTS "Admins can update configuracion" ON public.configuracion;
DROP POLICY IF EXISTS "Admins can insert configuracion" ON public.configuracion;

-- Policies
CREATE POLICY "Authenticated users can view configuracion"
  ON public.configuracion FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update configuracion"
  ON public.configuracion FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can insert configuracion"
  ON public.configuracion FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

-- Insert default configuration values
INSERT INTO public.configuracion (clave, valor, descripcion)
VALUES 
  ('logo_url', '/logo-clavaris.jpg', 'URL del logo de CDA 2026'),
  ('nombre_grupo', 'Clavaris de la Divina Aurora 2026', 'Nombre completo del grupo'),
  ('pueblo', 'Benifaió', 'Nombre del pueblo')
ON CONFLICT (clave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descripcion = EXCLUDED.descripcion,
  updated_at = NOW();

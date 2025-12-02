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

-- Updated default logo URL to use the official Clavaris logo
INSERT INTO public.configuracion (clave, valor, descripcion)
VALUES 
  ('logo_url', '/logo-clavaris.jpg', 'URL del logo de CDA 2026'),
  ('nombre_grupo', 'Clavaris de la Divina Aurora 2026', 'Nombre completo del grupo'),
  ('pueblo', 'Benifaió', 'Nombre del pueblo')
ON CONFLICT (clave) DO NOTHING;

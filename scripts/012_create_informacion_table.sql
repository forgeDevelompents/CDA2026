-- Create informacion (about/info page content) table
CREATE TABLE IF NOT EXISTS public.informacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seccion TEXT NOT NULL UNIQUE,
  contenido TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.informacion ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view informacion"
  ON public.informacion FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update informacion"
  ON public.informacion FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can insert informacion"
  ON public.informacion FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

-- Insert default information
INSERT INTO public.informacion (seccion, contenido)
VALUES 
  ('quienes_somos', 'Somos el grupo de Clavaris de la Divina Aurora 2026 del pueblo de Benifaió. Un grupo dedicado a mantener nuestras tradiciones y celebraciones.'),
  ('que_hacemos', 'Organizamos y participamos en las festividades locales, mantenemos el patrimonio cultural y fomentamos el compañerismo entre los miembros del grupo.')
ON CONFLICT (seccion) DO NOTHING;

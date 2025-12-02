-- Create opciones_votacion (voting options) table
CREATE TABLE IF NOT EXISTS public.opciones_votacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  votacion_id UUID NOT NULL REFERENCES public.votaciones(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  orden INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.opciones_votacion ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view opciones"
  ON public.opciones_votacion FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert opciones"
  ON public.opciones_votacion FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can update opciones"
  ON public.opciones_votacion FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can delete opciones"
  ON public.opciones_votacion FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

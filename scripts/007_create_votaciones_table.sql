-- Create votaciones (polls/voting) table
CREATE TABLE IF NOT EXISTS public.votaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('activa', 'cerrada')) DEFAULT 'activa',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fecha_cierre TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.votaciones ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view votaciones"
  ON public.votaciones FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert votaciones"
  ON public.votaciones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can update votaciones"
  ON public.votaciones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can delete votaciones"
  ON public.votaciones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

-- Create eventos (events/calendar) table
CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,
  ubicacion TEXT,
  tipo TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view eventos"
  ON public.eventos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert eventos"
  ON public.eventos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can update eventos"
  ON public.eventos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can delete eventos"
  ON public.eventos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

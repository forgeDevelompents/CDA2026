-- Create cargos (positions/roles within the group) table
CREATE TABLE IF NOT EXISTS public.cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  cargo TEXT NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view cargos"
  ON public.cargos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert cargos"
  ON public.cargos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can update cargos"
  ON public.cargos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can delete cargos"
  ON public.cargos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

-- Create normas (internal rules) table
CREATE TABLE IF NOT EXISTS public.normas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  orden INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.normas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view normas"
  ON public.normas FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert normas"
  ON public.normas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can update normas"
  ON public.normas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can delete normas"
  ON public.normas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

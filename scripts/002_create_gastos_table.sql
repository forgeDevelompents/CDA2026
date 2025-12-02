-- Create gastos (expenses) table
CREATE TABLE IF NOT EXISTS public.gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  concepto TEXT NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL CHECK (cantidad >= 0),
  categoria TEXT,
  pagado_por UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view gastos"
  ON public.gastos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert gastos"
  ON public.gastos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can update gastos"
  ON public.gastos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

CREATE POLICY "Admins can delete gastos"
  ON public.gastos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.rol = 'admin'
    )
  );

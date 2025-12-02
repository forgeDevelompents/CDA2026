-- Create asistencias (event attendance) table
CREATE TABLE IF NOT EXISTS public.asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  estado TEXT NOT NULL CHECK (estado IN ('asistire', 'no_podre', 'quizas')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(evento_id, user_id)
);

-- Enable RLS
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view asistencias"
  ON public.asistencias FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own asistencia"
  ON public.asistencias FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own asistencia"
  ON public.asistencias FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own asistencia"
  ON public.asistencias FOR DELETE
  USING (auth.uid() = user_id);

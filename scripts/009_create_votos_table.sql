-- Create votos (individual votes) table
CREATE TABLE IF NOT EXISTS public.votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  votacion_id UUID NOT NULL REFERENCES public.votaciones(id) ON DELETE CASCADE,
  opcion_id UUID NOT NULL REFERENCES public.opciones_votacion(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(votacion_id, user_id)
);

-- Enable RLS
ALTER TABLE public.votos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view votos count"
  ON public.votos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own voto"
  ON public.votos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voto"
  ON public.votos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voto"
  ON public.votos FOR DELETE
  USING (auth.uid() = user_id);

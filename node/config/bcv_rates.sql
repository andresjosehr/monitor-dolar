CREATE TABLE bcv_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bcv_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
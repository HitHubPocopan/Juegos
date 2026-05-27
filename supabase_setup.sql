-- ══════════════════════════════════════════════════════
-- PocoPan Juguetería — Setup Supabase
-- Ejecutar en: Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS games (
  id          TEXT PRIMARY KEY,
  name        TEXT        NOT NULL,
  description TEXT        DEFAULT '',
  price       TEXT        DEFAULT '',
  min_players INTEGER     NOT NULL DEFAULT 2,
  max_players INTEGER     NOT NULL DEFAULT 4,
  min_age     INTEGER     NOT NULL DEFAULT 7,
  pace        TEXT        NOT NULL DEFAULT 'slow'
                          CHECK (pace IN ('slow', 'fast')),
  youtube_url TEXT        DEFAULT '',
  thumbnail   TEXT        DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- 3. Política: cualquiera puede leer (clientes del local)
CREATE POLICY "Lectura pública"
  ON games FOR SELECT
  USING (true);

-- 4. Política: escritura con anon key (la seguridad la maneja el panel admin)
CREATE POLICY "Escritura con anon key"
  ON games FOR ALL
  USING (true)
  WITH CHECK (true);

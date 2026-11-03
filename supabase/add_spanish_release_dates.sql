-- LudiClub - Add Spanish release date and Spanish edition publication year to games table
-- Run this in your Supabase SQL Editor.

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS es_release_date DATE,
ADD COLUMN IF NOT EXISTS es_year_published INTEGER;

CREATE INDEX IF NOT EXISTS idx_games_es_release_date
  ON public.games (has_spanish_edition, es_release_date DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_games_es_year_published
  ON public.games (has_spanish_edition, es_year_published DESC NULLS LAST);

-- Synced Spanish Novedades & Próximamente release dates (2026-11-03)
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-11-03', es_year_published = 2026 WHERE bgg_id = 416851; -- Castle Combo
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-11-03', es_year_published = 2026 WHERE bgg_id = 312484; -- Las Ruinas Perdidas de Arnak
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-12-03', es_year_published = 2027 WHERE bgg_id = 417542; -- Cyberpunk 2077: The Board Game
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-12-03', es_year_published = 2027 WHERE bgg_id = 465819; -- Concordia: Special Edition
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 469504; -- Diables
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2025 WHERE bgg_id = 394897; -- Horror en el Orient Express: El Juego de Mesa
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 466234; -- Krajina zvířat: Tep života
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 463441; -- Flip 7: With A Vengeance
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 474125; -- -60°
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 463469; -- En sintonía
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 448271; -- El Señor de los Anillos: Las Dos Torres – El juego de bazas
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 428099; -- Revenant
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 434367; -- Nippon: Zaibatsu
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 453526; -- Código 5
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 397005; -- Yonder
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 456440; -- Aventuras en Villa Pegatina
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 451772; -- Shards of Creation
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 463126; -- Arkham Horror: El juego de cartas
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 459763; -- Heat: Terreno Inestable
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 363058; -- Politik
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 463297; -- King of Tokyo: Godzilla
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-12-03', es_year_published = 2027 WHERE bgg_id = 457412; -- Noche en el Zoo
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 457386; -- Carnuta
UPDATE public.games SET has_spanish_edition = true, es_release_date = '2026-10-24', es_year_published = 2026 WHERE bgg_id = 474947; -- The White Castle: Bōeki

-- Migration: Extrahiert die Einstellungen aus dem JSONB-Feld in separate Spalten
-- Erstellt: 2025-03-09

-- 1. Hinzufügen der neuen Spalten
ALTER TABLE categories 
ADD COLUMN is_visible BOOLEAN DEFAULT TRUE,
ADD COLUMN is_tracking_active BOOLEAN DEFAULT FALSE,
ADD COLUMN is_send_setup BOOLEAN DEFAULT FALSE,
ADD COLUMN is_deleted_in_discord BOOLEAN DEFAULT FALSE;

-- 2. Daten aus dem JSONB-Feld in die neuen Spalten kopieren
UPDATE categories 
SET 
  is_visible = COALESCE((settings->>'is_visible')::BOOLEAN, TRUE),
  is_tracking_active = COALESCE((settings->>'is_tracking_active')::BOOLEAN, FALSE),
  is_send_setup = COALESCE((settings->>'is_send_setup')::BOOLEAN, FALSE),
  is_deleted_in_discord = COALESCE((settings->>'is_deleted_in_discord')::BOOLEAN, FALSE);

-- 3. Optional: Entfernen der settings-Spalte wenn sie nicht mehr benötigt wird
-- Wenn Sie andere Daten im settings-Feld haben, die Sie behalten möchten,
-- sollten Sie diesen Schritt überspringen.
-- ALTER TABLE categories DROP COLUMN settings;

-- HINWEIS: Führen Sie die Migration zunächst ohne das Löschen der settings-Spalte aus
-- und stellen Sie sicher, dass alles funktioniert, bevor Sie die Spalte endgültig entfernen.

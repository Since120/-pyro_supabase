-- Migration: Einrichten der RLS-Richtlinien für die Entwicklungsumgebung
-- Erstellt: 2025-03-09

-- 1. Aktiviere RLS für die Tabelle (sollte bereits aktiviert sein)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 2. Erstelle eine Richtlinie, die ALLE Operationen für ALLE Benutzer erlaubt
CREATE POLICY "Allow all operations for development" 
ON categories
FOR ALL 
TO PUBLIC
USING (true)
WITH CHECK (true);

-- Diese Richtlinie erlaubt:
-- - Lesen (SELECT)
-- - Erstellen (INSERT)
-- - Aktualisieren (UPDATE)
-- - Löschen (DELETE)
-- für alle Benutzer, einschließlich nicht angemeldeter (anonymer) Benutzer.

-- HINWEIS: Diese Richtlinie ist NUR für die Entwicklungsphase gedacht.
-- Für die Produktion sollten Sie detailliertere Richtlinien implementieren,
-- die auf Benutzerrollen und -berechtigungen basieren.

-- WICHTIG: Für andere Tabellen müssen Sie ähnliche Richtlinien erstellen
-- Beispiel für die 'zones' Tabelle:
-- CREATE POLICY "Allow all operations for development" 
-- ON zones
-- FOR ALL 
-- TO PUBLIC
-- USING (true)
-- WITH CHECK (true);

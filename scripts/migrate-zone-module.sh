# scripts/migrate-zone-module.sh
#!/bin/bash

# Dieses Skript führt die Migration des Zone-Moduls durch
# Es muss vom Hauptverzeichnis des Projekts ausgeführt werden

set -e  # Beendet das Skript bei Fehlern

echo "🚀 Starte Migration des Zone-Moduls..."

# 1. Sichern der alten Dateien
echo "📦 Erstelle Backups..."
mkdir -p backups/zone
cp -r apps/api/src/zone backups/zone/
cp prisma/schema.prisma backups/schema.prisma.bak

# 2. Kopieren der neuen Dateien
echo "📋 Kopiere neue Dateien..."
cp -f temp/migration/zone/models/zone.model.ts apps/api/src/zone/models/
cp -f temp/migration/zone/zone.resolver.ts apps/api/src/zone/
cp -f temp/migration/zone/zone.service.ts apps/api/src/zone/
cp -f temp/migration/zone/rate-limit/zone-rate-limit.service.ts apps/api/src/zone/rate-limit/

# 3. Aktualisieren des Prisma-Schemas
echo "🔄 Aktualisiere Prisma Schema..."
cp -f temp/migration/prisma/schema.prisma prisma/

# 4. Generieren des Prisma Clients und der GraphQL-Schema-Dateien
echo "⚙️ Generiere Prisma Client..."
npx prisma generate

echo "📝 Generiere GraphQL Schema..."
npm run generate:schema

# 5. Einrichten von GraphQL Codegen
echo "🔧 Richte GraphQL Codegen ein..."
mkdir -p packages/types/generated
cp -f temp/migration/codegen.yml ./
cp -f temp/migration/packages/types/mappers.ts packages/types/
cp -f temp/migration/packages/types/context.ts packages/types/

# 6. Generieren der TypeScript-Typen
echo "✨ Generiere TypeScript Typen..."
npx graphql-codegen

# 7. Entfernen alter DTO-Dateien
echo "🧹 Entferne alte DTO-Dateien..."
rm -f apps/api/src/zone/dtos/create.zone.input.ts
rm -f apps/api/src/zone/dtos/update.zone.input.ts

# 8. Starten des Entwicklungsservers für Tests
echo "🔍 Starte Entwicklungsserver für Tests..."
echo "Drücke Strg+C zum Beenden, wenn alles funktioniert."
npm run start:dev

echo "✅ Migration des Zone-Moduls abgeschlossen!"
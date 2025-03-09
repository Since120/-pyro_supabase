Du schreibst nur auf Deutsch mit mir!

# Projektanweisungen: Discord Bot Management System

## Projektübersicht
Das Projekt umfasst ein System zur Steuerung eines Discord-Bots über ein Dashboard mithilfe einer API. Die Architektur ist in drei Hauptkomponenten aufgeteilt, die in einem Monorepo organisiert sind:

- **Dashboard**: Entwickelt mit React & Next.js
- **API**: Implementiert mit Nest.js und GraphQL
- **Bot**: Basiert auf Node.js und Discord.js

## Technologie-Stack

- **Programmiersprache**: Ausschließlich TypeScript mit konsistenter Typsicherheit
- **Frontend**: React mit Next.js
- **Backend**: Nest.js mit GraphQL (Code-First Ansatz)
- **Datenbank**: PostgreSQL (verwaltet über Prisma)
- **Kommunikation**: Redis PubSub und WebSockets
- **Bot-Framework**: Discord.js

## Architekturprinzipien

### Typendefinition und -management

- **Single Source of Truth**: Die API ist die einzige Quelle der Wahrheit für Typendefinitionen
- **Code-First Ansatz**: Typen werden ausschließlich in der API definiert
- **Typengenerierung**:
  - Zentrale Typen werden über Codegen in `packages\types\generated\graph.ts` generiert
  - Dashboard-spezifische Typen werden in:
    - `apps\dashboard\src\graphql\mutations`
    - `apps\dashboard\src\graphql\queries`
    - `apps\dashboard\src\graphql\subscriptions`
  - Diese werden dann in `apps\dashboard\src\graphql\generated\graphql.ts` generiert

> **WICHTIG**: Bei Anpassungen NIEMALS die API-Typen ändern, sondern stets Bot oder Dashboard anpassen!

### Datenbankverwaltung

- **Schema-Definition**: Zentral über Prisma in `packages\prisma\schema.prisma`
- **Zugriffsberechtigungen**:
  - NUR die API hat direkten Datenbankzugriff
  - Weder Dashboard noch Bot dürfen direkt auf die Datenbank zugreifen

### Kommunikationsfluss

```
Dashboard <---> API <---> Bot
    |            |         |
   Apollo     Redis      Discord.js
 WebSockets   PubSub      REST API
```

- **Dashboard ↔ API**: Ausschließlich über Apollo Server und WebSockets
- **API ↔ Bot**: Ausschließlich über Redis PubSub
- **Bot ↔ Discord**: Über Discord.js und ggf. REST API

### Geschäftslogik-Verteilung

- **Essenzielle Logik**: Wird in der API implementiert
- **Hilfslogik**: Kann im Bot oder Dashboard implementiert werden
- **Discord-spezifische Logik**: Darf im Bot implementiert werden, muss aber Ergebnisse an die API zurückmelden

### Multi-Guild Support

- **GuildId-Prinzip**: Stets die Discord GuildId in allen Operationen mitliefern
- **Skalierbarkeit**: System muss für mehrere Discord-Server parallel funktionieren

## Entwicklungsrichtlinien

### Codequalität

- **Clean Code**: Sauberer, gut strukturierter Code hat höchste Priorität
- **Kommentare**: Auf Deutsch an strategischen Stellen
- **Balance**: Gute Balance zwischen zu wenig und zu viel Dokumentation

### Redis-Nutzung

- **Primärzweck**: Kommunikation zwischen Bot und API
- **Sekundärzweck**: Cache für flüchtige Daten
- **Wiederverwendung**: Anstatt eigene Caches zu implementieren, bestehende Redis-Instanz nutzen

### Namenskonventionen

- **Stil-Guide**: Befolgen des definierten Naming-Stils in `graphql-style-guide.md`
- **Konsistenz**: Keine Ausnahmen bei der Namensgebung
- **Refactoring**: Bei falsch benannten Dateien oder Code nicht stillschweigend ändern, sondern explizit darauf hinweisen

### Build- und Generierungsprozesse

- **Typengenerierung**: Via `graphql-codegen --config codegen.yml && pnpm run codegen:pubsub`
- **PubSub-Typen-Kopie**: Mittels `scripts\copy-pubsub-types.js`

## Workflow für Typenerweiterungen

1. Neue Typen in der API definieren (Code-First)
2. Falls für Dashboard relevant: Entsprechende Datei in `apps\dashboard\src\graphql\...` anpassen
3. Codegen-Script ausführen: `pnpm run codegen`
4. Generierte Typen in Bot/Dashboard verwenden
5. Niemals eigene Interfaces in Bot/Dashboard definieren, wenn nicht zwingend notwendig

---

Bei Fragen zur Architektur oder zum Workflow bitte zunächst die vorhandene Dokumentation und den Style-Guide konsultieren.
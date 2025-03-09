# NestJS GraphQL Simplified Style Guide

## 1. Grundprinzip: Code First, Single Source of Truth

- **Definiere Typen NUR in der API** in den `.model.ts` Dateien
- **Generiere alle anderen Typen** automatisch für andere Anwendungen
- **Eine zentrale Typendefinition** für das gesamte System

## 2. Datei- und Ordnerstruktur

### Ordnerstruktur

```
src/
├── [entity]/             # z.B. category, zone
│   ├── models/           # Enthält alle Modelle und Input-Typen
│   │   └── [entity].model.ts
│   ├── [entity].resolver.ts
│   ├── [entity].service.ts
│   └── [entity].module.ts
```

### Dateibenennung

- **Modelle**: `[entity].model.ts` (enthält Entity, Inputs und Event-Typen)
- **Services**: `[entity].service.ts`
- **Resolver**: `[entity].resolver.ts`
- **Module**: `[entity].module.ts`

## 3. Typdefinitionen

### Modellklassen

```typescript
@ObjectType()
export class Category {
  @Field(() => ID)
  id: string;
  
  @Field()
  name: string;
  
  // Weitere Felder...
}
```

### Input-Typen

```typescript
@InputType()
export class CreateCategoryInput {
  @Field()
  name: string;
  
  // Weitere Felder...
}

@InputType()
export class UpdateCategoryInput {
  @Field(() => ID)
  id: string;
  
  @Field({ nullable: true })
  name?: string;
  
  // Weitere optionale Felder...
}
```

### Event-Typen

```typescript
@ObjectType()
export class CategoryEvent {
  @Field(() => ID)
  id: string;
  
  @Field()
  timestamp: string;
  
  @Field({ nullable: true })
  eventType?: string;
  
  // Weitere ereignisspezifische Felder...
}
```

## 4. GraphQL-Operationen

### Queries

```typescript
@Query(() => [Category])
async categories(): Promise<Category[]> {
  return this.categoryService.getCategories();
}

@Query(() => Category)
async category(@Args('id', { type: () => ID }) id: string): Promise<Category> {
  return this.categoryService.getCategoryById(id);
}
```

### Mutations

```typescript
@Mutation(() => Category)
async createCategory(@Args('input') input: CreateCategoryInput): Promise<Category> {
  return this.categoryService.createCategory(input);
}

@Mutation(() => Category)
async updateCategory(
  @Args('id', { type: () => ID }) id: string,
  @Args('input') input: UpdateCategoryInput
): Promise<Category> {
  return this.categoryService.updateCategory(id, input);
}

@Mutation(() => Category)
async deleteCategory(@Args('id', { type: () => ID }) id: string): Promise<Category> {
  return this.categoryService.deleteCategory(id);
}
```

### Subscriptions

```typescript
@Subscription(() => CategoryEvent)
categoryCreated() {
  return this.pubSub.asyncIterator('categoryCreated');
}

@Subscription(() => CategoryEvent)
categoryUpdated() {
  return this.pubSub.asyncIterator('categoryUpdated');
}

@Subscription(() => CategoryEvent)
categoryDeleted() {
  return this.pubSub.asyncIterator('categoryDeleted');
}
```

## 5. Event-Handling und PubSub

### Minimale Event-Struktur

```typescript
// In Service oder Resolver
await this.pubSub.publish('categoryCreated', {
  id: category.id,
  eventType: 'created',
  timestamp: new Date().toISOString(),
  // Minimale notwendige Daten
  name: category.name,
  guildId: category.guildId
});
```

### Einheitliche Event-Typen

Verwende für alle Ereignistypen der gleichen Entität eine gemeinsame Basisklasse, z.B. `CategoryEvent`.

## 6. Codegenerierung

### Beispiel codegen.yml

```yaml
overwrite: true
schema: "apps/api/src/**/*.model.ts"

generates:
  packages/types/index.ts:
    plugins:
      - "typescript"
      - "typescript-operations"
    config:
      skipTypename: true
      declarationKind: "interface"
```

## 7. Variable und Methoden-Benennung

### Variablen

- **IDs**: `entityId` (z.B. `categoryId`)
- **Zeitstempel**: `createdAt`, `updatedAt`
- **Booleans**: beginnen mit `is` (z.B. `isVisible`, `isActive`)

### Methoden

- **Create**: `createEntity` (z.B. `createCategory`)
- **Read**: `getEntity` oder `getEntities` (z.B. `getCategory`, `getCategories`)
- **Update**: `updateEntity` (z.B. `updateCategory`)
- **Delete**: `deleteEntity` (z.B. `deleteCategory`)
- **Handler**: `handleEvent` (z.B. `handleCategoryUpdate`)

## 8. Praktische Beispiele

### Vollständige Category-Implementierung

**category.model.ts**
```typescript
import { Field, ObjectType, InputType, ID } from '@nestjs/graphql';

@ObjectType()
export class Category {
  @Field(() => ID)
  id: string;

  @Field()
  guildId: string;

  @Field()
  name: string;

  @Field()
  isVisible: boolean;

  @Field({ nullable: true })
  discordCategoryId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateCategoryInput {
  @Field()
  guildId: string;

  @Field()
  name: string;

  @Field({ defaultValue: true })
  isVisible?: boolean;
}

@InputType()
export class UpdateCategoryInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  isVisible?: boolean;

  @Field({ nullable: true })
  discordCategoryId?: string;
}

@ObjectType()
export class CategoryEvent {
  @Field(() => ID)
  id: string;

  @Field()
  guildId: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  discordCategoryId?: string;

  @Field()
  timestamp: string;

  @Field()
  eventType: string;
}
```

## 9. Wichtige Faustregeln

1. **Ein Modell pro Entity**: Definiere alle Typen für eine Entität in einer Datei
2. **Minimale Event-Payloads**: Halte event Payloads so klein wie möglich
3. **Gleicher Typ für ähnliche Events**: Verwende den gleichen Typ für alle Events einer Entität
4. **Typgenerierung ist Pflicht**: Generiere alle Typen aus der API für andere Anwendungen
5. **Keine doppelten Definitionen**: Definiere jeden Typ genau einmal
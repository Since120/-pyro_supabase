// apps/bot/src/events/index.ts
// Kategorie-Handler wurden zu Supabase migriert und sind in src/hooks/categories/use.supabase.category.ts zu finden
export { handleZoneCreated } from './handle-zone-created';
export { handleZoneUpdated } from './handle-zone-updated';
export { handleZoneDeleted } from './handle-zone-deleted';
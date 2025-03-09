/**
 * GraphQL Context-Typ, der vom Code-Generator verwendet wird.
 * Dieser Typ wird für die TypeScript-Resolver-Typgenerierung benötigt.
 */
export interface GraphQLContext {
  // Hier werden die benötigten Kontext-Eigenschaften definiert, die von den GraphQL-Resolvern verwendet werden.
  req?: any;
  res?: any;
  // Weitere Kontext-Eigenschaften können hier hinzugefügt werden
}
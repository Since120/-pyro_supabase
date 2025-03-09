/**
 * GraphQL Context-Typ, der vom Code-Generator verwendet wird.
 * Dieser Typ wird für die TypeScript-Resolver-Typgenerierung benötigt.
 */
export interface GraphQLContext {
    req?: any;
    res?: any;
}

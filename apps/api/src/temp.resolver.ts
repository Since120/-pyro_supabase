// apps/api/src/temp.resolver.ts
import { Resolver, Query } from '@nestjs/graphql';

@Resolver('Temp')
export class TempResolver {
  @Query(() => String, { 
    name: 'tempQuery',
    description: 'Temporary root query' 
  })
  tempQuery(): string {
    return 'Temporary query for schema generation';
  }
}
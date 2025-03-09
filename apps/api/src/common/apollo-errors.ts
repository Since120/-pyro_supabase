//apps\api\src\common\apollo-errors.ts
import { GraphQLError } from 'graphql';

export class CategoryDeleteError extends GraphQLError {
  constructor() {
    super(
      'Es existiert noch eine Zone, die mit dieser Kategorie verknüpft ist. Bitte löschen Sie diese zuerst.',
      {
        extensions: {
          code: 'CATEGORY_DELETE_FORBIDDEN',
        },
      },
    );
  }
}

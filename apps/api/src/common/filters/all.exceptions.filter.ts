// apps/api/src/common/filters/all.exceptions.filter.ts
import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class AllExceptionsFilter implements GqlExceptionFilter {
  catch(exception: any, host: ArgumentsHost): GraphQLError {
    // Falls vorhanden, holen wir die Antwort aus der Exception
    const response = exception.getResponse ? exception.getResponse() : null;

    // Versuchen, die spezifische Fehlermeldung zu ermitteln:
    let message: string;
    if (response) {
      if (typeof response === 'object' && response.message) {
        // Falls message ein Array ist, zusammenfügen
        message = Array.isArray(response.message)
          ? response.message.join(', ')
          : response.message;
      } else if (typeof response === 'string') {
        message = response;
      } else {
        message = exception.message || 'Ein Fehler ist aufgetreten';
      }
    } else {
      message = exception.message || 'Ein Fehler ist aufgetreten';
    }

    // Geben den exakten Fehler zurück – sofern du in der Entwicklung bist,
    // sollte das den von BadRequestException übergebenen Text enthalten.
    return new GraphQLError(message, {
      extensions: {
        code: exception.getStatus
          ? exception.getStatus().toString()
          : 'INTERNAL_SERVER_ERROR',
        // Du kannst hier auch weitere Felder übergeben, z. B. den originalen Fehler:
        originalError: exception,
      },
    });
  }
}

import { useState } from 'react';
import { useSnackbar } from 'notistack';

type AsyncFunction<T = any> = () => Promise<T>;

interface UseAsyncHandlerOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  onFinally?: () => void;
}

/**
 * useAsyncHandler kapselt asynchrone Aktionen:
 * - Setzt den Ladezustand
 * - Führt Fehlerbehandlung (inkl. Snackbar) durch
 * - Ruft Success- und Finally-Callbacks auf
 */
export const useAsyncHandler = <T>(
  asyncFunction: AsyncFunction<T>,
  errorMsg: string,
  options?: UseAsyncHandlerOptions<T>
) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const execute = async () => {
    setLoading(true);
    try {
      const data = await asyncFunction();
      if (options?.onSuccess) options.onSuccess(data);
      return data;
    } catch (error) {
      console.error('Error in async handler:', error);
      if (options?.onError) {
        options.onError(error);
      } else {
        enqueueSnackbar(errorMsg, { variant: 'error' });
      }
      throw error;
    } finally {
      setLoading(false);
      if (options?.onFinally) options.onFinally();
    }
  };

  return { loading, execute };
};

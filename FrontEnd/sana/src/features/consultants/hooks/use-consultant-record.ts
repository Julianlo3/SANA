"use client";

import { useEffect, useState } from "react";

/**
 * Shared loading pattern for assistant and psychologist consultant records.
 * Both variants use the same mounted, loading, and error state management.
 * @param consultantId Resource identifier.
 * @param fetcher Function used to retrieve the data.
 * @param errorMessage Error message shown when the operation fails.
 */
export function useConsultantRecord<T>(
  consultantId: number,
  fetcher: (id: number) => Promise<T>,
  errorMessage: string,
) {
  const [record, setRecord] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetcher(consultantId)
      .then((result) => {
        if (isMounted) setRecord(result);
      })
      .catch(() => {
        if (isMounted) setLoadError(errorMessage);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultantId]);

  return { record, isLoading, loadError };
}
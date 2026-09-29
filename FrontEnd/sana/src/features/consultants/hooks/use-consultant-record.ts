"use client";

import { useEffect, useState } from "react";

/**
 * Patrón de carga compartido entre las dos fichas de consultante (HU-2.4.1
 * y HU-2.4.2): mismo manejo de isMounted/loading/error, cambia solo qué
 * función se llama y qué mensaje de error se muestra.
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
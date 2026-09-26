import { useCallback, useEffect, useMemo, useState } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; data: T };

/**
 * Carga asincrona con estados explicitos de carga/exito/error y reintento.
 * `key` identifica que se esta cargando: al cambiar, se vuelve a pedir.
 * Cada peticion tiene su propio token: mientras el resultado guardado no sea el de la
 * peticion actual, el estado es "cargando". Asi no hace falta poner "cargando" dentro
 * de un efecto (evita un render extra en cascada).
 */
export function useAsync<T>(load: () => Promise<T>, key: unknown): [AsyncState<T>, () => void] {
  const [attempt, setAttempt] = useState(0);
  // Nueva peticion cuando cambia la llave (lo que se carga) o al reintentar.
  // `key` y `attempt` solo cambian la identidad del token, no se leen dentro.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const request = useMemo(() => ({}), [key, attempt]);
  const [result, setResult] = useState<{ request: object; state: AsyncState<T> } | null>(null);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => !cancelled && setResult({ request, state: { status: "success", data } }))
      .catch(() => !cancelled && setResult({ request, state: { status: "error" } }));
    return () => {
      cancelled = true;
    };
    // `load` cambia en cada render de quien llama; la peticion se identifica con `request`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return [result?.request === request ? result.state : { status: "loading" }, retry];
}

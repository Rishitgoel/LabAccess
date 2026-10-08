import { useEffect, useState } from "react";
import { loadAllMine, requestApi } from "./requests.api";
export function useRequests(kind, value, status) {
  const key = JSON.stringify([kind, value, status]);
  const [state, setState] = useState({
    key,
    loading: true,
    data: null,
    error: null,
  });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let current = true;
    setState({ key, loading: true, data: null, error: null });
    const read =
      kind === "catalog"
        ? value
          ? loadAllMine()
          : Promise.resolve([])
        : kind === "detail"
          ? requestApi.detail(value)
          : requestApi.list(kind === "review", value, status);
    read
      .then((data) => {
        if (current) setState({ key, loading: false, data, error: null });
      })
      .catch((error) => {
        if (current) setState({ key, loading: false, data: null, error });
      });
    return () => {
      current = false;
    };
  }, [kind, value, status, key, version]);
  return {
    ...(state.key === key ? state : { loading: true, data: null, error: null }),
    refresh: () => setVersion((previous) => previous + 1),
  };
}

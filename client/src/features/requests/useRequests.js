import { useEffect, useState } from "react";
import { loadAllMine, requestApi } from "./requests.api";
export function useRequests(kind, value) {
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let current = true;
    setState({ loading: true, data: null, error: null });
    const read =
      kind === "catalog"
        ? value
          ? loadAllMine()
          : Promise.resolve([])
        : kind === "detail"
          ? requestApi.detail(value)
          : requestApi.list(kind === "review", value);
    read
      .then((data) => {
        if (current) setState({ loading: false, data, error: null });
      })
      .catch((error) => {
        if (current) setState({ loading: false, data: null, error });
      });
    return () => {
      current = false;
    };
  }, [kind, value, version]);
  return { ...state, refresh: () => setVersion((previous) => previous + 1) };
}

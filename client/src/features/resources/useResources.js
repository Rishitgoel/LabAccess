import { useEffect, useState } from "react";
import { api } from "@/lib/api";
export function useResources(page) {
  const [state, setState] = useState({
    page,
    hasData: false,
    loading: true,
    resources: [],
    pagination: null,
    error: null,
  });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    setState((previous) =>
      previous.page === page
        ? { ...previous, loading: true, error: null }
        : {
            page,
            hasData: false,
            loading: true,
            resources: [],
            pagination: null,
            error: null,
          },
    );
    api(`/resources?page=${page}`)
      .then((result) => {
        if (current)
          setState({
            page,
            hasData: true,
            loading: false,
            resources: result.data.map((resource) => ({
              ...resource,
              icon:
                resource.category === "Data"
                  ? "database"
                  : resource.category === "Design"
                    ? "design"
                    : "code",
            })),
            pagination: result.pagination,
            error: null,
          });
      })
      .catch((error) => {
        if (current)
          setState({
            page,
            hasData: false,
            loading: false,
            resources: [],
            pagination: null,
            error,
          });
      });
    return () => {
      current = false;
    };
  }, [page, retry]);
  return {
    ...(state.page === page
      ? state
      : {
          loading: true,
          hasData: false,
          resources: [],
          pagination: null,
          error: null,
        }),
    retry: () => setRetry((value) => value + 1),
  };
}

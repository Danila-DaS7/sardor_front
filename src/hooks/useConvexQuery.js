import { useQuery } from "convex/react";

export const useConvexQuery = (name, args) => {
  const shouldSkip = !import.meta.env.VITE_CONVEX_URL || args === null;
  const data = useQuery(name, shouldSkip ? "skip" : args || {});
  return { data, error: null };
};

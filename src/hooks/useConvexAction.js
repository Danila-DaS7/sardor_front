import { useState } from "react";
import { convexClient } from "../lib/convexClient.js";

export const useConvexAction = (name) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async (args) => {
    if (!convexClient) {
      throw new Error("Convex client is not configured");
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await convexClient.action(name, args || {});
      setIsLoading(false);
      return result;
    } catch (err) {
      setIsLoading(false);
      setError(err);
      throw err;
    }
  };

  return { run, isLoading, error };
};

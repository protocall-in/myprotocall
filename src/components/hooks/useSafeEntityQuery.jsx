import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * A custom hook to safely fetch data using the Entity SDK, inspired by useSafeFetch.
 * This hook manages loading and error states, prevents state updates on unmounted
 * components, and provides a refetch function.
 *
 * @param {Function} queryFunction An async function that performs the entity query (e.g., () => Stock.list()).
 * @param {Array} dependencies An array of dependencies that will trigger a refetch when they change.
 * @returns {object} { data, loading, error, refetch }
 */
export function useSafeEntityQuery(queryFunction, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref to track if the component is still mounted
  const isMountedRef = useRef(true);

  // Use useCallback to memoize the fetch function
  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return; // Don't fetch if unmounted
    
    setLoading(true);
    setError(null);

    try {
      const result = await queryFunction();
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error("Entity Query Error:", err);
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryFunction, ...dependencies]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    // Cleanup function to run when the component unmounts
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}


import { useState, useEffect, useCallback } from 'react';

/**

 *
 * @returns {{ airports: Array, isLoading: boolean, error: string|null, searchAirports: function }}
 */
export function useAirportLookup() {
  const [airports, setAirports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch airports.json once on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const response = await fetch('/airports.json');
        if (!response.ok) {
          throw new Error(`Failed to load airports.json: ${response.status}`);
        }
        const data = await response.json();
        if (!cancelled) {
          setAirports(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);


  const searchAirports = useCallback(
    (term, limit = 5) => {
      const needle = term.trim().toLowerCase();

      if (needle === '') {
        return [];
      }

      const results = [];

      for (const airport of airports) {
        const codeMatch = airport.code.toLowerCase().includes(needle);
        const cityMatch = airport.city.toLowerCase().includes(needle);

        if (codeMatch || cityMatch) {
          results.push(airport);
          if (results.length === limit) {
            break;
          }
        }
      }

      return results;
    },
    [airports]
  );

  return { airports, isLoading, error, searchAirports };
}

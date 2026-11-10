import { useState, useEffect, useCallback } from 'react';

export function useAirportLookup() {
  const [airports, setAirports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/airports.json')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load airports');
        return res.json();
      })
      .then((data) => {
        setAirports(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  const searchAirports = useCallback(
    (term, limit = 5) => {
      const query = term.trim().toLowerCase();
      if (!query) return [];

      const matches = [];
      for (const a of airports) {
        if (
          a.code.toLowerCase().includes(query) ||
          a.city.toLowerCase().includes(query)
        ) {
          matches.push(a);
          if (matches.length === limit) break;
        }
      }
      return matches;
    },
    [airports]
  );

  return { isLoading, error, searchAirports };
}

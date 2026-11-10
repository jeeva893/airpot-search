

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAirportLookup } from './useAirportLookup.js';

const DEBOUNCE_MS = 250;

export default function AirportAutocomplete() {
  // ── Lookup hook (data layer) ──────────────────────
  const { isLoading, error, searchAirports } = useAirportLookup();

  // ── Component state ───────────────────────────────
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedAirport, setSelectedAirport] = useState(null);

  // ── Refs ──────────────────────────────────────────
  const debounceRef = useRef(null);
  const listRef = useRef(null);
  const containerRef = useRef(null);

  // ── Debounced search ──────────────────────────────
  useEffect(() => {
    // Clear any pending debounce timer
    clearTimeout(debounceRef.current);

    const trimmed = inputValue.trim();

    if (trimmed === '') {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const matches = searchAirports(trimmed);
      setResults(matches);
      setIsOpen(true);
      setActiveIndex(-1);
    }, DEBOUNCE_MS);

    // Cleanup on unmount or before next effect
    return () => clearTimeout(debounceRef.current);
  }, [inputValue, searchAirports]);

  // ── Close dropdown on outside click ───────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ── Scroll active item into view ──────────────────
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('li:not(.no-match)');
      if (items[activeIndex]) {
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  // ── Selection handler ─────────────────────────────
  const selectAirport = useCallback((airport) => {
    setInputValue(airport.code);
    setSelectedAirport(airport);
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  // ── Keyboard handler ──────────────────────────────
  function handleKeyDown(e) {
    if (!isOpen) return;

    const matchCount = results.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (matchCount === 0) return;
        setActiveIndex((prev) => (prev < matchCount - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (matchCount === 0) return;
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : matchCount - 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < matchCount) {
          selectAirport(results[activeIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;

      default:
        break;
    }
  }

  // ── Input change handler ──────────────────────────
  function handleInputChange(e) {
    setInputValue(e.target.value);
    // Clear selection when user starts typing again
    setSelectedAirport(null);
  }

  // ── Render ────────────────────────────────────────
  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <>
      <div className="autocomplete" ref={containerRef}>
        <label htmlFor="airport-input">From</label>
        <input
          type="text"
          id="airport-input"
          placeholder={isLoading ? 'Loading airports…' : 'Type IATA code or city name…'}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="dropdown-list"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `option-${activeIndex}` : undefined}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />

        {isOpen && (
          <ul
            id="dropdown-list"
            className="dropdown"
            role="listbox"
            ref={listRef}
          >
            {results.length === 0 ? (
              <li className="no-match" role="option">
                No airports match
              </li>
            ) : (
              results.map((airport, index) => (
                <li
                  key={airport.code}
                  id={`option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={index === activeIndex ? 'active' : ''}
                  onClick={() => selectAirport(airport)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  <span className="code">{airport.code}</span>
                  <span className="city">{airport.city}, {airport.country}</span>
                  <span className="airport-name">{airport.name}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {selectedAirport && (
        <pre className="selected-output">
          {JSON.stringify(selectedAirport, null, 2)}
        </pre>
      )}
    </>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAirportLookup } from './useAirportLookup.js';

const DEBOUNCE_MS = 250;

export default function AirportAutocomplete() {
  const { isLoading, error, searchAirports } = useAirportLookup();

  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState(null);

  const timerRef = useRef(null);
  const listRef = useRef(null);
  const wrapperRef = useRef(null);

  // debounced search whenever input changes
  useEffect(() => {
    clearTimeout(timerRef.current);

    if (!inputValue.trim()) {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    timerRef.current = setTimeout(() => {
      const matches = searchAirports(inputValue);
      setResults(matches);
      setIsOpen(true);
      setActiveIndex(-1);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [inputValue, searchAirports]);

  // close dropdown if user clicks outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // keep active item scrolled into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.children;
    if (items[activeIndex]) {
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleSelect = useCallback((airport) => {
    setInputValue(airport.code);
    setSelected(airport);
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  function handleKeyDown(e) {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleChange(e) {
    setInputValue(e.target.value);
    setSelected(null);
  }

  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <>
      <div className="autocomplete" ref={wrapperRef}>
        <label htmlFor="airport-input">From</label>
        <input
          type="text"
          id="airport-input"
          placeholder={isLoading ? 'Loading…' : 'Type IATA code or city…'}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="dropdown-list"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />

        {isOpen && (
          <ul id="dropdown-list" className="dropdown" role="listbox" ref={listRef}>
            {results.length === 0 ? (
              <li className="no-match">No airports match</li>
            ) : (
              results.map((airport, i) => (
                <li
                  key={airport.code}
                  role="option"
                  className={i === activeIndex ? 'active' : ''}
                  onClick={() => handleSelect(airport)}
                  onMouseEnter={() => setActiveIndex(i)}
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

      {selected && (
        <pre className="selected-output">
          {JSON.stringify(selected, null, 2)}
        </pre>
      )}
    </>
  );
}

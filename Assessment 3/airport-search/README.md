# Airport Search — Autocomplete

## Stack

React (with Vite). I went with React since that's what I use day-to-day and I'm fastest with hooks and functional components. Vite gives a zero-config dev server so there's no setup friction.

## How to run

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Structure

```
src/
  App.jsx                    – root, just renders the autocomplete
  AirportAutocomplete.jsx    – the input + dropdown component
  useAirportLookup.js        – custom hook that fetches airports.json and has the search logic
  index.css                  – styles
public/
  airports.json              – the 34 airports (fetched at runtime, not imported)
```

I kept the search/filter logic in a custom hook (`useAirportLookup`) so the component only deals with rendering and user interaction. The hook fetches the JSON once on mount and exposes a `searchAirports(term)` function that the component calls.

## Questions

**How does your autocomplete avoid filtering on every keystroke, and why does that matter?**

I use a debounce — whenever the input value changes, I set a 250ms timeout before actually running the search. If the user types another character before the timeout fires, the old one gets cleared and a new one starts. So the search only runs once typing pauses. This avoids doing unnecessary work on half-typed words. With 34 airports it barely matters performance-wise, but if this were hitting an API or searching thousands of records, firing on every keystroke would be wasteful and could cause flickering results.

**How is the dropdown's keyboard navigation kept in sync with the mouse hover state?**

Both keyboard arrows and mouse hover update the same `activeIndex` state. When you hover an item, `onMouseEnter` sets `activeIndex` to that item's index. When you press Arrow Down/Up, it also updates `activeIndex`. So there's one source of truth — if you hover item 2 then press down arrow, you go to item 3. On mouse leave I reset the index to -1 so nothing stays highlighted after the cursor leaves.

**If we asked you to support 10,000 airports instead of 34, what ONE change would you make first?**

I'd build a prefix map when the data loads — basically a Map where keys are prefixes of the city and code strings, and values are arrays of matching airports. That way instead of looping through all 10k entries on every search, I just look up the typed string in the map. It's more memory but the search becomes instant. If the dataset got really large I'd also consider moving the search server-side.

## Known limitations

- I didn't add full accessibility (no aria-live announcements for screen readers)
- The matching is basic substring — no ranking by relevance, so "del" might not show Delhi first if other cities also contain "del"
- No retry if the JSON fails to load, just shows an error message
- Could be cleaner with the blur/focus edge cases — if you tab away while typing the dropdown might flash briefly

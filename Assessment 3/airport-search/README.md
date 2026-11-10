# Airport Search with Autocomplete

## Stack

**React 18+** (functional components, hooks) with Vite as the dev server / bundler.

I chose React because I am most comfortable with its component model and hooks API. Functional components with `useState` and `useEffect` keep the logic straightforward, and a custom hook cleanly separates the data-fetching / search logic from the UI component.

---

## How to Run

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

---

## Project Structure

```
airport-search/
├── public/
│   └── airports.json              ← 34 Indian airports (loaded at runtime via fetch)
├── src/
│   ├── main.jsx                   ← React entry point
│   ├── App.jsx                    ← Root component
│   ├── AirportAutocomplete.jsx    ← Input + dropdown UI component
│   ├── useAirportLookup.js        ← Custom hook: fetches data, exposes searchAirports()
│   └── index.css                  ← All styling (plain CSS, no libraries)
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

The **lookup logic** (fetching airports.json, filtering by search term) lives entirely in `useAirportLookup.js` — a custom hook with zero JSX or DOM code. The **UI component** `AirportAutocomplete.jsx` imports only the hook and handles rendering, keyboard events, and selection.

---

## Design Questions

### 1. How does your autocomplete avoid filtering on every keystroke, and why does that matter?

The component uses a **debounce** implemented with `setTimeout` inside a `useEffect` that depends on `inputValue`. Each time the input value changes, the previous timer is cleared (via the effect cleanup) and a new 250 ms timer starts. The actual `searchAirports()` call only fires once the user stops typing for 250 ms. This matters because filtering on every keystroke triggers unnecessary work on intermediate strings the user is still composing. With 34 airports the performance cost is negligible, but with a larger dataset or a remote API endpoint, unthrottled searches would cause wasted CPU cycles, redundant network requests, and potential race conditions where stale results arrive after newer ones.

### 2. How is the dropdown's keyboard navigation kept in sync with the mouse hover state?

Both keyboard and mouse interactions update the same piece of state — `activeIndex` (via `setActiveIndex`). When the user hovers over a dropdown item, its `onMouseEnter` sets `activeIndex` to that item's index; `onMouseLeave` resets it to -1. Arrow Up / Arrow Down also update `activeIndex`. Because React re-renders from a single source of truth, the `.active` CSS class is always applied to exactly the item at `activeIndex`, regardless of whether the user got there with the keyboard or the mouse. If a user hovers item 3 and then presses Arrow Down, the highlight moves to item 4 — the two input methods stay perfectly in sync.

### 3. If we asked you to support 10,000 airports instead of 34, what ONE change would you make first?

I would build a **prefix index** (a Map keyed by lowercase prefixes of each code and city name) at load time, so that searches become O(k) lookups by prefix length rather than O(n) scans through the full list. Right now every search iterates all entries doing two `.includes()` calls per airport. At 10,000 entries this linear scan on every (debounced) keystroke would become noticeably slow. A pre-built prefix map or trie would give near-instant results regardless of dataset size. If the data grew large enough to slow down the initial fetch, I would also move the search to a server-side endpoint with pagination.

---

## Known Limitations

- **No ARIA live-region announcements.** Screen readers would benefit from an `aria-live` region that announces the result count and the currently highlighted option. I would add this with more time.
- **Substring matching only.** Typing "del" matches "Delhi" but also any city containing "del". A smarter ranking (exact prefix → code match → substring) would improve result quality at scale.
- **No loading spinner or error banner.** If `airports.json` fails to load, a plain text error is shown, but there is no retry button or styled error state.
- **No blur-delay handling.** If the user tabs away mid-search, there is no explicit cleanup to prevent a brief flash of the dropdown. A short-delay blur handler would improve this.

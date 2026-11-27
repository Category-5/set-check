import "@testing-library/jest-dom"

// Node 25+ defines its own `localStorage`/`sessionStorage` globals, which are
// undefined unless Node runs with --localstorage-file. Vitest won't overwrite
// globals that already exist, so the jsdom storage never gets installed. Point
// the globals at jsdom's window storage instead.
const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window
if (jsdomWindow) {
  for (const key of ["localStorage", "sessionStorage"] as const) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      get: () => jsdomWindow[key],
    })
  }
}

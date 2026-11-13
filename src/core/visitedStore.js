// Remembers which memories have been opened, in this browser only.
// Everything keeps working if localStorage is unavailable.

export function createVisitedStore(storageKey) {
  const ids = load();

  function load() {
    try {
      const value = JSON.parse(window.localStorage.getItem(storageKey));

      return new Set(Array.isArray(value) ? value.filter((id) => typeof id === "string") : []);
    } catch {
      return new Set();
    }
  }

  function save() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...ids].sort()));
    } catch {
      // Not persisted; the current visit still tracks progress.
    }
  }

  function add(id) {
    ids.add(id);
    save();
  }

  function clear() {
    ids.clear();

    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Nothing stored to remove.
    }
  }

  return {
    ids,
    add,
    clear,
  };
}

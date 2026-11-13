// Read a JSON array from localStorage without crashing on bad data
export const loadArray = (key) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key));

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

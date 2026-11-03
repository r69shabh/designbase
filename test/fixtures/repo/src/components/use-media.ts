import { useEffect, useState } from "react";
export function useMedia(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => setMatch(window.matchMedia(query).matches), [query]);
  return match;
}

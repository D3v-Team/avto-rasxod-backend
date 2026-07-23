export function normalizeName(name: string): string {
  if (!name) return name;

  return name
    .replace(/[‘’`´]/g, "'")
    .replace(/["«»„“”]/g, '')
    .trim()
    .toUpperCase();
}

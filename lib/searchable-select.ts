export type SearchableOption = { value: string; label: string };

export function filterSearchableOptions(options: SearchableOption[], query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return options;
  return options.filter((option) => option.label.toLowerCase().includes(term));
}

/*
Generic sort utility for admin list views.

Handles null values, date-field parsing, and case-insensitive string
comparison so each page doesn't need its own sort implementation.
 
Extracted from the inline `sortGuidelines` function in:
app/admin/guidelines/page.tsx 

Currently used by:
app/admin/guidelines/page.tsx  (replaces inline `sortGuidelines`)
Can be adopted by events/page.tsx and users in the future
*/

/*
Sort an array of objects by a given field with null-safe, type-conscious comparison.

Key for later use:
@param items      – the array to sort (not mutated; returns a new array)
@param field      – the object key to sort by
@param direction  – "asc" or "desc"
@param dateFields – optional set of field names that should be parsed as Date objects for numeric comparison

Used in:
app/admin/guidelines/page.tsx  (sorting guideline list by title, semester, status, or start_time)
*/
export function sortItems<T>(
  items: T[],
  field: keyof T,
  direction: "asc" | "desc",
  dateFields?: (keyof T)[],
): T[] {
  const sorted = [...items];

  sorted.sort((a, b) => {
    let aVal: any = a[field];
    let bVal: any = b[field];

    // Null / undefined handling — push nulls to the end
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return direction === "asc" ? 1 : -1;
    if (bVal == null) return direction === "asc" ? -1 : 1;

    // Date handling — parse to timestamps for numeric comparison
    if (dateFields?.includes(field)) {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    // String handling — case-insensitive comparison
    if (typeof aVal === "string" && typeof bVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}

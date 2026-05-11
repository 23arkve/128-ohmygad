/*
pagination I love pagination
this is one of the most important functions dearest to my heart

Currently used by:
app/admin/guidelines/page.tsx   (guideline list pagination)
app/admin/events/page.tsx    (event list pagination)
app/admin/users/users-client.tsx  (user list pagination)
*/

/* Number of rows shown per page in admin list views. */
export const PER_PAGE = 10;

/*
Return a single page slice from an array of items.

Key for later use:
@param items   – full array of items
@param page    – 1-indexed page number
@param perPage – items per page (defaults to PER_PAGE if omitted)

Used in:
app/admin/guidelines/page.tsx   (paginate guideline rows)
app/admin/events/page.tsx    (paginate event rows)
app/admin/users/users-client.tsx  (paginate user rows)
*/
export const paginate = <T>(items: T[], page: number, perPage: number): T[] =>
  items.slice((page - 1) * perPage, page * perPage);

/*
Compute the total number of pages for a given item count.

Key for later use:
@param total   – total number of items
@param perPage – items per page

Used in:
app/admin/guidelines/page.tsx   (Pagination component total)
app/admin/events/page.tsx    (Pagination component total)
app/admin/users/users-client.tsx  (Pagination component total)
*/
export const totalPages = (total: number, perPage: number) =>
  Math.max(1, Math.ceil(total / perPage));
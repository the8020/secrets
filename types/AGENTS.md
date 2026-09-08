Parent DOX: [secrets DOX](../AGENTS.md).

# Purpose

- Share named credential references across tables and administration screens.

# Ownership

- Own `secretName` and `secretInfo` value/update metadata; the table owns stored
  data and admin-core owns the edit UI.

# Local Contracts

- Use an ordinary Zod string with a label, description, lazy paged name lookup,
  and lazy open callback. Never query, return, or display stored secret values.
- Lookup returns a one-column schema with name as the selection key. Shared SQL
  lookup applies ordinary text filters, search, and sorting before paging and
  returns matching counts. Importing the field performs no database or UUI work.
- The value field describes replacement input only and has no lookup or open
  callback. Screens keep it masked and initially empty; table reuse does not
  authorize reading or displaying stored values.
- Open calls the owning Secrets program with the selected name; that screen
  starts with an empty replacement value.

# Work Guidance

# Verification

- `deno task check` and `deno task test` cover schema stability and the
  name-only lookup. UUI's Programs browser flow opens a secret from package
  field help.

# Child DOX Index

No child DOX documents. This document owns the entire local scope.

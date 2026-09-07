Parent DOX: [secrets DOX](../AGENTS.md).

# Purpose

- Describe the shared named-secret table.

# Ownership

- Own `secrets.ts` and their descriptor tests; physical schema deployment
  remains kernel-owned.

# Local Contracts

- Default-export authored table descriptors through `/p/the8020/db/mod.ts`;
  table identity follows the package and file path.
- Keep values confined to trusted kernel operations and explicit authenticated
  reads.
- The name column reuses `../types/secret.ts` through `t.from`, retaining its
  table-local primary key.
- Do not introduce reversible encryption without a separately managed root key.

# Work Guidance

# Verification

- From the repository root, run `deno task check` and `deno task test`.

# Child DOX Index

No child DOX documents. This document owns the entire local scope.

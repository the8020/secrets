Parent DOX: [secrets DOX](../AGENTS.md).

# Purpose

- Expose explicit named-secret list, get, and set commands.

# Ownership

- Own hidden program manifests and calls to the package's `../mod.ts` API.

# Local Contracts

- Lists and writes never echo values; only an explicit authenticated get returns
  a stored value.
- Set receives its value only through execution-scoped secure input.

# Work Guidance

# Verification

- From the repository root, run `deno task check` and `deno task test`.

# Child DOX Index

No child DOX documents. This document owns the entire local scope.

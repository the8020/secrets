# Purpose

- Own named shared secrets as an ordinary 80|20 database table.
- This file is the root contract of the independent `the8020/secrets`
  repository.

# Ownership

- Own the authored named-secret schema and administrative command programs.
- Do not own database credentials, node-private credentials, secret consumers,
  authorization, or encryption-key management.

# Local Contracts

- Secret values are available only to trusted kernel operations and explicit
  authenticated reads. Lists and writes never echo values.
- Do not add reversible encryption without a separately managed root key.
- `cbus/commands/**/command.toml` maps visible `secrets.*` commands to
  non-discoverable ordinary programs. `secrets.set` receives its value only as
  execution-scoped secure input.

# Verification

- `deno task check` formats, lints, and type-checks all table modules.
- `deno task test` verifies the stable descriptor without exposing values.

# Child DOX Index

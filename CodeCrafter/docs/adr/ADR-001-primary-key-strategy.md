# ADR-001: Primary Key Strategy — Bigint Identity

**Status:** Accepted  
**Date:** 2024-11  
**Deciders:** Initial architecture review

## Context

We need to choose a primary key strategy for all tables. The options are:

1. **UUID v4** — random, globally unique, 16 bytes
2. **UUID v7** — time-ordered UUID, 16 bytes, better index locality than v4
3. **Bigint GENERATED ALWAYS AS IDENTITY** — sequential, 8 bytes, excellent index performance

## Decision

Use **bigint GENERATED ALWAYS AS IDENTITY** for all primary keys.

```sql
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

## Rationale

| Concern | Bigint | UUIDv7 |
|---------|--------|--------|
| Index locality (sequential inserts) | ✅ Excellent | ✅ Good |
| Storage per PK | ✅ 8 bytes | ❌ 16 bytes |
| Storage per FK | ✅ 8 bytes | ❌ 16 bytes |
| Human-readable in logs | ✅ Yes | ❌ No |
| Distributed ID generation (no central DB) | ❌ Needs DB | ✅ Client-side |
| Exposes row count to clients | ⚠️ Yes | ✅ No |

For a platform that operates a single primary Postgres instance (no sharding at launch), bigint identity is the correct choice. The "exposes row count" concern is mitigated by never surfacing raw IDs in public URLs (slugs and UUIDs-in-URL will be used where enumeration matters).

## Consequences

- Problem slugs (URL-facing) are string slugs (e.g., `two-sum`), not IDs.
- Submission IDs in WebSocket events will be bigint. Clients treat them as opaque strings.
- If we need to shard Postgres in the future, we migrate to UUIDv7 at that time. The migration path is straightforward with a bigint→UUID backfill.

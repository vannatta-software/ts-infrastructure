# Active Context: ts-infrastructure Monorepo

## Current Work Focus

The current focus is on developing and testing the `packages/persistence` module, specifically implementing and verifying the `defineSchema` function for prescriptive schema definitions. This involves ensuring compatibility with existing database repositories (MongoDB, Neo4j, Postgres) and correctly utilizing domain abstractions from `@vannatta-software/ts-utils-domain`.

## Recent Changes

*   Implemented `defineSchema` function in `packages/persistence/src/schema/database.schema.ts` for prescriptive schema definitions.
*   Exported `Constructor` type from `packages/persistence/src/schema/schema.interfaces.ts`.
*   Created `packages/persistence/src/__tests__/prescriptive.schema.test.ts` for unit testing `defineSchema`.
*   Created `packages/persistence/src/__tests__/mongo.prescriptive.integration.test.ts` for integration testing `defineSchema` with MongoDB.
*   Added `memory-bank/ts-utils-domain-reference.md` to the memory bank.

## Next Steps

The immediate next steps involve resolving remaining TypeScript errors in `packages/persistence/src/__tests__/mongo.prescriptive.integration.test.ts` to ensure the MongoDB integration tests pass. Following this, similar integration tests will be developed for Neo4j and Postgres.

## Active Decisions and Considerations

*   The decision was made to defer the creation of sample packages to a later stage, focusing first on the core monorepo setup.
*   The monorepo will use `npm` as its client, as specified in `lerna.json`.
*   GitHub Actions will be used for CI/CD, specifically for publishing packages to npm.
*   **Crucial:** All domain entities must extend the `Entity` abstract class from `@vannatta-software/ts-utils-domain` to ensure compatibility with repository interfaces.

## Important Patterns and Preferences

*   **Monorepo Structure**: `packages/*` will contain individual TypeScript packages.
*   **TypeScript**: Strict type-checking will be encouraged, though `strict: false` is currently set in `tsconfig.base.json` for initial flexibility.
*   **Lerna**: Used for versioning and publishing packages.
*   **Conventional Commits**: Enforced for consistent commit messages and automated versioning/releases.
*   **Domain-Driven Design (DDD)**: Core abstractions from `@vannatta-software/ts-utils-domain` (Entity, ValueObject, UniqueIdentifier, etc.) are fundamental and must be correctly utilized.

## Learnings and Project Insights

*   The initial setup confirms the feasibility of using Lerna and npm workspaces for this monorepo structure.
*   The integration with GitHub Actions for publishing is straightforward with the provided configuration.
*   **Critical Learning:** It is paramount to strictly adhere to existing domain abstractions (e.g., `Entity` from `ts-utils-domain`) and thoroughly consult provided documentation (including the memory bank) before making assumptions or introducing new, conflicting implementations. Previous attempts to create a custom `BaseEntity` for testing were incorrect and caused unnecessary complications due to not fully leveraging the existing `Entity` abstract class and its expected properties/methods. Future decisions will prioritize understanding and extending existing framework components.

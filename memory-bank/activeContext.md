# Active Context: ts-infrastructure Monorepo

## Current Work Focus

The current focus is on the initial setup and foundational configuration of the `ts-infrastructure` TypeScript monorepo. This includes establishing the core project files, Lerna configuration, and GitHub Actions for publishing.

## Recent Changes

*   Created `package.json` for the monorepo root.
*   Created `tsconfig.base.json` for base TypeScript configurations.
*   Created `lerna.json` for Lerna monorepo management.
*   Created `.github/workflows/publish.yml` for automated package publishing.
*   Initialized `memory-bank/projectbrief.md` and `memory-bank/productContext.md`.

## Next Steps

The immediate next steps involve completing the initialization of the Memory Bank by creating the remaining documentation files: `systemPatterns.md`, `techContext.md`, and `progress.md`.

## Active Decisions and Considerations

*   The decision was made to defer the creation of sample packages to a later stage, focusing first on the core monorepo setup.
*   The monorepo will use `npm` as its client, as specified in `lerna.json`.
*   GitHub Actions will be used for CI/CD, specifically for publishing packages to npm.

## Important Patterns and Preferences

*   **Monorepo Structure**: `packages/*` will contain individual TypeScript packages.
*   **TypeScript**: Strict type-checking will be encouraged, though `strict: false` is currently set in `tsconfig.base.json` for initial flexibility.
*   **Lerna**: Used for versioning and publishing packages.
*   **Conventional Commits**: Enforced for consistent commit messages and automated versioning/releases.

## Learnings and Project Insights

*   The initial setup confirms the feasibility of using Lerna and npm workspaces for this monorepo structure.
*   The integration with GitHub Actions for publishing is straightforward with the provided configuration.

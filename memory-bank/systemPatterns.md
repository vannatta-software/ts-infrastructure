# System Patterns: ts-infrastructure Monorepo

## System Architecture

The `ts-infrastructure` project is structured as a monorepo, leveraging Lerna and npm workspaces. This architecture allows for the development and management of multiple interdependent TypeScript packages within a single repository.

```mermaid
graph TD
    A[ts-infrastructure Monorepo] --> B[Root package.json];
    A --> C[Root tsconfig.base.json];
    A --> D[Root lerna.json];
    A --> E[packages/ Directory];
    A --> F[.github/workflows/ Directory];
    E --> G[Package 1 (e.g., @vannatta-software/ts-utils-domain)];
    E --> H[Package N];
    F --> I[publish.yml];
    G --> J[Package 1 package.json];
    G --> K[Package 1 tsconfig.json];
    G --> L[Package 1 src/];
    G --> M[Package 1 jest.config.js];
```

## Key Technical Decisions

*   **Monorepo Tooling**: Lerna is chosen for its robust capabilities in managing multi-package repositories, including versioning, publishing, and dependency management. npm workspaces are used in conjunction with Lerna for efficient package linking and installation.
*   **TypeScript**: All packages within the monorepo will be written in TypeScript, ensuring type safety and improved code quality. A shared `tsconfig.base.json` promotes consistent compiler options.
*   **Testing Framework**: Jest is the chosen testing framework for individual packages, configured with `ts-jest` for TypeScript support.
*   **CI/CD**: GitHub Actions are used for continuous integration and continuous deployment, specifically for automating the build, versioning, and publishing process.
*   **Conventional Commits**: Adopted to standardize commit messages, which enables automated versioning and changelog generation via Lerna's conventional commits feature.

## Design Patterns in Use

*   **Monorepo Pattern**: Centralizes related projects, facilitating code sharing, consistent tooling, and simplified dependency management.
*   **Shared Configuration**: Utilizing `tsconfig.base.json` and root `package.json` scripts to enforce consistent configurations and build processes across all packages.

## Component Relationships

*   **Root Level**: Contains global configurations (`package.json`, `tsconfig.base.json`, `lerna.json`) and CI/CD workflows (`.github/workflows`).
*   **Packages Directory**: Houses individual TypeScript packages. Each package is a self-contained unit with its own `package.json`, `tsconfig.json`, and source code.
*   **Inter-package Dependencies**: Lerna and npm workspaces manage dependencies between packages within the monorepo, allowing for local development and linking.

## Critical Implementation Paths

*   **Package Creation**: New packages will follow a standardized template to ensure consistency.
*   **Build Process**: `npm run build --workspaces` will trigger TypeScript compilation for all packages.
*   **Testing Process**: `npm test --workspaces` will execute tests across all packages.
*   **Publishing Workflow**: The GitHub Actions `publish.yml` workflow automates the versioning and publishing of updated packages to npm.

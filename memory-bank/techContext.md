# Tech Context: ts-infrastructure Monorepo

## Technologies Used

*   **TypeScript (v5.2.2)**: The primary programming language for all packages within the monorepo, ensuring type safety and modern JavaScript features.
*   **Node.js (v20.x)**: The runtime environment for executing TypeScript code (after compilation) and managing development tools.
*   **npm**: Used as the package manager for installing dependencies and managing workspaces.
*   **Lerna (v8.2.2)**: A tool for managing JavaScript projects with multiple packages, facilitating versioning, publishing, and dependency management within the monorepo.
*   **Jest (v29.7.0)**: A delightful JavaScript Testing Framework with a focus on simplicity. Used for unit and integration testing of individual packages.
*   **ts-jest (v29.1.0)**: A Jest preprocessor with source map support for TypeScript that lets you use Jest to test projects written in TypeScript.
*   **GitHub Actions**: Used for continuous integration and continuous deployment (CI/CD) workflows, specifically for automating the build, test, and publish processes.

## Development Setup

1.  **Node.js Installation**: Ensure Node.js v20.x is installed.
2.  **Repository Clone**: Clone the `ts-infrastructure` monorepo.
3.  **Root Dependencies**: Run `npm install` in the monorepo root to install Lerna and other root-level `devDependencies`, and to link workspaces.
4.  **Package Development**: Navigate into individual package directories (`packages/*`) to develop specific components.
5.  **Building**: Run `npm run build --workspaces` from the root to compile all TypeScript packages.
6.  **Testing**: Run `npm test --workspaces` from the root to execute tests across all packages.

## Technical Constraints

*   **TypeScript Version**: All packages must be compatible with TypeScript v5.2.2.
*   **Node.js Version**: The CI/CD pipeline and local development environment are standardized on Node.js v20.x.
*   **Lerna Configuration**: Adherence to the `lerna.json` configuration for versioning and publishing.
*   **Conventional Commits**: All commits intended for release must follow the Conventional Commits specification to enable automated versioning.

## Dependencies

*   **Root Dependencies**: `lerna`, `typescript`.
*   **Package Dependencies**: Individual packages will declare their own `dependencies` and `devDependencies`. Inter-package dependencies within the monorepo will be managed by Lerna and npm workspaces.
*   **External Dependencies**: Any external libraries or frameworks required by individual packages will be listed in their respective `package.json` files.

## Tool Usage Patterns

*   `npm install`: Used at the root to set up the monorepo and link workspaces.
*   `npm run build --workspaces`: Used to build all packages.
*   `npm test --workspaces`: Used to run tests for all packages.
*   `npx lerna version`: Used by the CI/CD pipeline to manage package versions based on conventional commits.
*   `npx lerna publish from-git`: Used by the CI/CD pipeline to publish new versions of packages to npm.

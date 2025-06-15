# @vannatta-software/ts-infrastructure-persistence

This package provides abstract interfaces (ports) for interacting with various persistence abstractions and data access within the `ts-infrastructure` monorepo. It serves as a conceptual layer to decouple your domain and application logic from specific external service implementations.

## Purpose

*   **Define Ports**: Establishes clear interfaces for data storage and retrieval (e.g., various data stores (e.g., document, relational, cache)).
*   **Decoupling**: Ensures that the core domain and application layers depend only on abstract contracts, not concrete specific database technologies.
*   **Consistency**: Promotes a standardized way of integrating with persistence mechanisms across the application.

## Usage

This package primarily exports interfaces and potentially base classes for common repository patterns. Concrete implementations for specific services (e.g., MongoDB, PostgreSQL, Redis) would reside in separate adapter packages or within this package if their complexity is low.

## Installation

```bash
npm install @vannatta-software/ts-infrastructure-persistence
# or
yarn add @vannatta-software/ts-infrastructure-persistence
```

## Contributing

Refer to the main monorepo's `CONTRIBUTING.md` for guidelines on contributing to this package.

# @vannatta-software/ts-infrastructure-clients

This package provides abstract interfaces (ports) for interacting with various external API clients and services within the `ts-infrastructure` monorepo. It serves as a conceptual layer to decouple your domain and application logic from specific external service implementations.

## Purpose

*   **Define Ports**: Establishes clear interfaces for external API interactions (e.g., payment gateways, analytics services, authentication providers).
*   **Decoupling**: Ensures that the core domain and application layers depend only on abstract contracts, not concrete third-party SDKs or service details.
*   **Consistency**: Promotes a standardized way of integrating with external services across the application.

## Usage

This package primarily exports interfaces and potentially base classes for common client patterns. Concrete implementations for specific services (e.g., Stripe, Google Analytics, Auth0) would reside in separate adapter packages or within this package if their complexity is low.

## Installation

```bash
npm install @vannatta-software/ts-infrastructure-clients
# or
yarn add @vannatta-software/ts-infrastructure-clients
```

## Contributing

Refer to the main monorepo's `CONTRIBUTING.md` for guidelines on contributing to this package.

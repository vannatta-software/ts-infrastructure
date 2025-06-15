# @vannatta-software/ts-infrastructure-eventing

This package provides abstract interfaces (ports) for interacting with various eventing abstractions and external event bus integrations within the `ts-infrastructure` monorepo. It serves as a conceptual layer to decouple your domain and application logic from specific external service implementations.

## Purpose

*   **Define Ports**: Establishes clear interfaces for event publishing and subscription (e.g., various external event bus technologies (e.g., Kafka, RabbitMQ)).
*   **Decoupling**: Ensures that the core domain and application layers depend only on abstract contracts, not concrete specific event bus technologies.
*   **Consistency**: Promotes a standardized way of integrating with eventing mechanisms across the application.

## Usage

This package primarily exports interfaces and potentially base classes for common event bus patterns. Concrete implementations for specific services (e.g., Kafka, RabbitMQ, AWS Kinesis) would reside in separate adapter packages or within this package if their complexity is low.

## Installation

```bash
npm install @vannatta-software/ts-infrastructure-eventing
# or
yarn add @vannatta-software/ts-infrastructure-eventing
```

## Contributing

Refer to the main monorepo's `CONTRIBUTING.md` for guidelines on contributing to this package.

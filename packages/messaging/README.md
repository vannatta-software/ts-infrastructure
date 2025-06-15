# @vannatta-software/ts-infrastructure-messaging

This package provides abstract interfaces (ports) for interacting with various messaging abstractions and message queue integrations within the `ts-infrastructure` monorepo. It serves as a conceptual layer to decouple your domain and application logic from specific external service implementations.

## Purpose

*   **Define Ports**: Establishes clear interfaces for message sending and receiving (e.g., various message queue technologies (e.g., RabbitMQ, SQS, Azure Service Bus)).
*   **Decoupling**: Ensures that the core domain and application layers depend only on abstract contracts, not concrete specific messaging technologies.
*   **Consistency**: Promotes a standardized way of integrating with messaging mechanisms across the application.

## Usage

This package primarily exports interfaces and potentially base classes for common message queue patterns. Concrete implementations for specific services (e.g., RabbitMQ, AWS SQS, Azure Service Bus) would reside in separate adapter packages or within this package if their complexity is low.

## Installation

```bash
npm install @vannatta-software/ts-infrastructure-messaging
# or
yarn add @vannatta-software/ts-infrastructure-messaging
```

## Contributing

Refer to the main monorepo's `CONTRIBUTING.md` for guidelines on contributing to this package.

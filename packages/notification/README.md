# @vannatta-software/ts-infrastructure-notification

This package provides abstract interfaces (ports) for interacting with various notification abstractions and external notification service integrations within the `ts-infrastructure` monorepo. It serves as a conceptual layer to decouple your domain and application logic from specific external service implementations.

## Purpose

*   **Define Ports**: Establishes clear interfaces for sending various types of notifications (e.g., various notification service technologies (e.g., Email, SMS, Push)).
*   **Decoupling**: Ensures that the core domain and application layers depend only on abstract contracts, not concrete specific notification service technologies.
*   **Consistency**: Promotes a standardized way of integrating with notification mechanisms across the application.

## Usage

This package primarily exports interfaces and potentially base classes for common notification service patterns. Concrete implementations for specific services (e.g., SendGrid, Twilio, Firebase Cloud Messaging) would reside in separate adapter packages or within this package if their complexity is low.

## Installation

```bash
npm install @vannatta-software/ts-infrastructure-notification
# or
yarn add @vannatta-software/ts-infrastructure-notification
```

## Contributing

Refer to the main monorepo's `CONTRIBUTING.md` for guidelines on contributing to this package.

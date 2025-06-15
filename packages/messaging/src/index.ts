// This is the entry point for the @vannatta-software/ts-infrastructure-clients package.
// It will export interfaces and abstract classes for various external API clients.

// Example: Interface for a message queue sender
export interface IQueueSender {
    send(message: any): Promise<void>;
    receive(): Promise<any | null>;
}

// Example: Interface for a message queue receiver
export interface IQueueReceiver {
    onMessage(message: any): void;
    startListening(): Promise<void>;
}

// You can also export common types or base classes that might be useful for implementations.

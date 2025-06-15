// This is the entry point for the @vannatta-software/ts-infrastructure-clients package.
// It will export interfaces and abstract classes for various external API clients.

// Example: Interface for an external event bus
export interface IExternalEventBus {
    publish(event: any): Promise<void>;
    subscribe(topic: string, handler: (event: any) => void): Promise<void>;
}

// Example: Interface for an event subscriber
export interface IEventSubscriber {
    unsubscribe(topic: string, handler: (event: any) => void): Promise<void>;
    onEvent(event: any): void;
}

// You can also export common types or base classes that might be useful for implementations.

// This is the entry point for the @vannatta-software/ts-infrastructure-clients package.
// It will export interfaces and abstract classes for various external API clients.

// Example: Interface for a generic payment gateway client
export interface IPaymentGatewayClient {
    processPayment(amount: number, currency: string, token: string): Promise<{ success: boolean; transactionId?: string; error?: string }>;
    refundPayment(transactionId: string, amount: number): Promise<{ success: boolean; error?: string }>;
}

// Example: Interface for an analytics service client
export interface IAnalyticsServiceClient {
    trackEvent(eventName: string, properties?: Record<string, any>): Promise<void>;
    identifyUser(userId: string, traits?: Record<string, any>): Promise<void>;
}

// You can also export common types or base classes that might be useful for implementations.

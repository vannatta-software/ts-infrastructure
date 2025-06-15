// This is the entry point for the @vannatta-software/ts-infrastructure-clients package.
// It will export interfaces and abstract classes for various external API clients.

// Example: Interface for an email sender
export interface IEmailSender {
    sendEmail(to: string, subject: string, body: string): Promise<void>;
    sendSms(to: string, message: string): Promise<void>;
}

// Example: Interface for an SMS sender
export interface ISmsSender {
    sendPushNotification(userId: string, title: string, body: string): Promise<void>;
    sendInAppNotification(userId: string, message: string): Promise<void>;
}

// You can also export common types or base classes that might be useful for implementations.

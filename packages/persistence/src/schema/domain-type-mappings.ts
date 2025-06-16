import { UniqueIdentifier, Entity, ValueObject, Enumeration } from '@vannatta-software/ts-utils-domain';
import { IPropertySchemaMetadata } from './schema.interfaces';
import { v4 as uuid } from "uuid"; // Import uuid

/**
 * Defines the database-agnostic schema properties for core domain abstractions.
 * This centralizes the mapping logic, keeping domain entities clean of infrastructure concerns.
 */
export const DOMAIN_TYPE_MAPPINGS = new Map<any, IPropertySchemaMetadata[]>();

// Mapping for Entity base class properties
DOMAIN_TYPE_MAPPINGS.set(Entity, [
    { propertyKey: '_id', type: UniqueIdentifier, isIdentifier: true, isDomainAbstraction: true, default: uuid }, // Add default here
    { propertyKey: 'createdAt', type: Date, isDomainAbstraction: true }, // Mapped to Date
    { propertyKey: 'updatedAt', type: Date, isDomainAbstraction: true, optional: true }, // Mapped to Date
]);

// Mapping for ValueObject base class properties (if any common ones exist, e.g., for embedded IDs)
// For now, assuming ValueObject itself doesn't have common persisted properties beyond what's defined in concrete VOs.
// If a ValueObject has an 'id' that needs to be persisted, it should be handled by the concrete VO's @DatabaseSchema decorator.
// DOMAIN_TYPE_MAPPINGS.set(ValueObject, [
//     // Example: { propertyKey: 'id', type: UniqueIdentifier, isIdentifier: true, isDomainAbstraction: true },
// ]);

// Mapping for Enumeration base class properties
DOMAIN_TYPE_MAPPINGS.set(Enumeration, [
    { propertyKey: 'id', type: Number, isDomainAbstraction: true }, // Enumeration ID is a number
    { propertyKey: 'name', type: String, isDomainAbstraction: true },
]);

// Specific mappings for domain primitive types
// These are used when a property's type is directly one of these domain primitives.
export const DOMAIN_PRIMITIVE_TYPE_MAP = new Map<any, any>([
    [UniqueIdentifier, String], // UniqueIdentifier maps to String in the database
    // CreatedAt and UpdatedAt are now handled as Date directly in DOMAIN_TYPE_MAPPINGS
    // Add other domain primitives if they need specific type mappings
]);

/**
 * Helper function to get domain-specific schema metadata for a given class.
 * This is used to programmatically add properties from base domain classes.
 * @param targetClass The class constructor (e.g., Entity, Enumeration).
 * @returns An array of IPropertySchemaMetadata for the domain type.
 */
export function getDomainSchemaMetadata(targetClass: any): IPropertySchemaMetadata[] {
    return DOMAIN_TYPE_MAPPINGS.get(targetClass) || [];
}

/**
 * Helper function to get the database type mapping for a domain primitive.
 * @param domainType The domain primitive type (e.g., UniqueIdentifier).
 * @returns The corresponding database type (e.g., String, Date).
 */
export function getDatabaseTypeForDomainPrimitive(domainType: any): any | undefined {
    return DOMAIN_PRIMITIVE_TYPE_MAP.get(domainType);
}

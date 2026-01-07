import { EventMetaObject, QuoteData, QuoteLocation, Address } from './api';
import { storage, storageService } from './storage';

/**
 * Interface for partner/customer address data
 */
interface PartnerAddressData {
  defaultAddress: Address;
  displayName?: string;
}

/**
 * Generate and store quote from partner/customer address to event destination
 * @param eventData - Event metadata object containing destination address
 * @param partnerData - Partner or customer data with defaultAddress
 * @returns boolean indicating success
 */
export function generateEventQuote(
  eventData: EventMetaObject,
  partnerData?: PartnerAddressData
): boolean {
  try {
    // Check if partner data has defaultAddress
    if (!partnerData?.defaultAddress) {
      console.warn('Partner data does not have defaultAddress');
      return false;
    }

    // Get destination_address from event
    const destinationAddressField = eventData.fields.find(f => f.key === 'destination_address');
    const destinationAddressRef = destinationAddressField?.reference;

    if (!destinationAddressRef || !destinationAddressRef.fields) {
      console.warn('Event does not have valid destination_address');
      return false;
    }

    // Helper to get field value from destination address
    const getDestFieldValue = (key: string): string => {
      const field = destinationAddressRef.fields.find((f: any) => f.key === key);
      return field?.value || '';
    };

    // Build from location from partner defaultAddress
    const fromLocation: QuoteLocation = {
      id: '',
      name: partnerData?.defaultAddress.company || partnerData?.displayName || '',
      street1: partnerData?.defaultAddress.address1 || '',
      city: partnerData?.defaultAddress.city || '',
      state: partnerData?.defaultAddress.provinceCode || partnerData?.defaultAddress.province || '',
      postal_code: partnerData?.defaultAddress.zip || '',
      country: partnerData?.defaultAddress.countryCodeV2 || partnerData?.defaultAddress.country || 'US',
      type: 'location',
      placeId: '',
      source: 'partner',
      address: `${partnerData?.defaultAddress.address1}, ${partnerData?.defaultAddress.city}, ${partnerData?.defaultAddress.provinceCode} ${partnerData?.defaultAddress.zip}`,
    };

    // Build to location from event destination_address
    const toLocation: QuoteLocation = {
      id: '',
      name: getDestFieldValue('label') || getDestFieldValue('company') || 'Event Destination',
      street1: getDestFieldValue('address1') || '',
      city: getDestFieldValue('city') || '',
      state: getDestFieldValue('state') || '',
      postal_code: getDestFieldValue('postal_code') || '',
      country: getDestFieldValue('country') || 'US',
      type: 'location',
      placeId: '',
      source: 'event',
      address: `${getDestFieldValue('address1')}, ${getDestFieldValue('city')}, ${getDestFieldValue('state')} ${getDestFieldValue('postal_code')}`,
    };

    // Create and store quote
    const quote: QuoteData = {
      from: fromLocation,
      to: toLocation,
    };

    storage.setQuotes(quote);
    return true;
  } catch (error) {
    console.error('Error generating quote from event:', error);
    return false;
  }
}

/**
 * Helper function to get field value by key
 */
function getFieldValue(fields: EventMetaObject['fields'], key: string): string | null {
  const field = fields.find(f => f.key === key);
  return field?.value || null;
}

/**
 * Helper function to get JSON field value by key (for arrays/lists)
 */
function getJsonFieldValue(fields: EventMetaObject['fields'], key: string): any {
  const field = fields.find(f => f.key === key);
  return field?.jsonValue || null;
}

/**
 * Helper function to get field reference by key
 */
function getFieldReference(fields: EventMetaObject['fields'], key: string): any | null {
  const field = fields.find(f => f.key === key);
  return field?.reference || null;
}

/**
 * Helper function to get boolean field value by key
 */
function getBooleanFieldValue(fields: EventMetaObject['fields'], key: string): boolean {
  const field = fields.find(f => f.key === key);
  if (!field) return false;
  if (typeof field.jsonValue === 'boolean') {
    return field.jsonValue;
  }
  if (field.value === 'true' || field.jsonValue === 'true') {
    return true;
  }
  return false;
}

/**
 * Extract and store event data with specified fields
 * @param eventData - Event metadata object
 * @param eventId - Event ID from URL parameter
 * @returns boolean indicating success
 */
export function storeEventData(eventData: EventMetaObject, eventId: string): boolean {
  try {
    const eventFields = eventData.fields;
    
    const storedEventData = {
      id: eventId,
      name: getFieldValue(eventFields, 'name'),
      event_subtitle: getFieldValue(eventFields, 'event_subtitle'),
      event_status: getFieldValue(eventFields, 'event_status'),
      event_type: getFieldValue(eventFields, 'event_type'),
      event_start_date: getFieldValue(eventFields, 'event_start_date'),
      event_end_date: getFieldValue(eventFields, 'event_end_date'),
      display_partner_logo: getBooleanFieldValue(eventFields, 'display_partner_logo'),
      event_hero_image: getFieldReference(eventFields, 'event_hero_image'),
      event_description: getFieldValue(eventFields, 'event_description'),
      bag_arrival_rule: getFieldValue(eventFields, 'bag_arrival_rule'),
      venue_name: getFieldValue(eventFields, 'venue_name'),
      destination_address: getFieldReference(eventFields, 'destination_address'),
      course_name: getFieldValue(eventFields, 'course_name'),
      host_name: getFieldValue(eventFields, 'host_name'),
      service_levels: getJsonFieldValue(eventFields, 'service_levels'),
    };

    storageService.setItem('EVENT', storedEventData);
    return true;
  } catch (error) {
    console.error('Error storing event data:', error);
    return false;
  }
}

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
    // Get destination address fields from event (new structure has direct fields)
    const getDestFieldValue = (key: string): string => {
      const field = eventData.fields.find(f => f.key === key);
      return field?.value || '';
    };

    // Check if we have required destination fields
    if (!getDestFieldValue('address1') && !getDestFieldValue('company')) {
      console.warn('Event does not have valid destination address fields');
      return false;
    }

    const addr = partnerData?.defaultAddress;
    const hasAddress1 = (addr?.address1 ?? '').trim().length > 0;
    const hasCity = (addr?.city ?? '').trim().length > 0;
    const hasZip = (addr?.zip ?? '').trim().length > 0;
    const hasProvince = ((addr?.provinceCode ?? '') || (addr?.province ?? '')).trim().length > 0;


    const street1 = (addr?.address1 ?? '').trim();
    const city = (addr?.city ?? '').trim();
    const state = (addr?.provinceCode ?? addr?.province ?? '').trim();
    const postal_code = (addr?.zip ?? '').trim();
    const country = ((addr?.countryCodeV2 ?? addr?.country ?? 'US').trim()) || 'US';
    const name = (hasAddress1 && hasCity && hasZip) ? partnerData?.displayName : '';

    const fromLocation: QuoteLocation = {
      id: '',
      name: name || '',
      street1: street1 || '',
      city: city || '',
      state: state || '',
      postal_code: postal_code || '',
      country: country || '',
      type: 'location',
      placeId: '',
      source: '',
      address: `${street1}, ${city}, ${state} ${postal_code}`.trim(),
    };

    // Build to location from event destination fields
    const toLocation: QuoteLocation = {
      id: '',
      name: getDestFieldValue('company') || 'Event Destination',
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
 * Helper function to extract text from rich text field JSON structure
 * Extracts text from jsonValue.children[].children[].value
 */
function extractRichTextValue(fields: EventMetaObject['fields'], key: string): string | null {
  const field = fields.find(f => f.key === key);
  if (!field || !field.jsonValue) return null;

  try {
    const jsonValue = field.jsonValue;
    // Check if jsonValue is an object (not string or array)
    if (typeof jsonValue === 'object' && jsonValue !== null && !Array.isArray(jsonValue)) {
      // Type guard: check if it's a rich text object with children
      const richTextObj = jsonValue as { type?: string; children?: any[] };

      // Recursively extract text from children
      const extractText = (node: any): string => {
        if (node && typeof node === 'object' && node.type === 'text' && typeof node.value === 'string') {
          return node.value;
        }
        if (node && typeof node === 'object' && Array.isArray(node.children)) {
          return node.children.map(extractText).filter(Boolean).join(' ');
        }
        return '';
      };

      if (richTextObj.children && Array.isArray(richTextObj.children)) {
        const text = richTextObj.children.map(extractText).filter(Boolean).join(' ');
        return text || null;
      }
    }
  } catch (error) {
    console.error('Error extracting rich text value:', error);
  }

  return null;
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

    // Extract destination address - use reference defaultAddress if available, otherwise use direct fields
    const destinationReference = getFieldReference(eventFields, 'destination');
    let destinationAddress: {
      defaultAddress: {
        id: string | null;
        address1: string;
        address2: string | null;
        city: string;
        province: string;
        provinceCode: string;
        zip: string;
        country: string;
        countryCodeV2: string;
        company: string;
        phone: string | null;
        firstName: string;
        lastName: string;
      };
    };

    if (destinationReference?.defaultAddress) {
      // Use destination reference defaultAddress structure
      destinationAddress = {
        defaultAddress: {
          id: destinationReference.defaultAddress.id || null,
          address1: destinationReference.defaultAddress.address1 || '',
          address2: destinationReference.defaultAddress.address2 || null,
          city: destinationReference.defaultAddress.city || '',
          province: destinationReference.defaultAddress.province || '',
          provinceCode: destinationReference.defaultAddress.provinceCode || '',
          zip: destinationReference.defaultAddress.zip || '',
          country: destinationReference.defaultAddress.country || '',
          countryCodeV2: destinationReference.defaultAddress.countryCodeV2 || '',
          company: destinationReference.defaultAddress.company || '',
          phone: destinationReference.defaultAddress.phone || null,
          firstName: destinationReference.defaultAddress.firstName || '',
          lastName: destinationReference.defaultAddress.lastName || '',
        },
      };
    } else {
      // Build same structure from direct fields
      destinationAddress = {
        defaultAddress: {
          id: null,
          address1: getFieldValue(eventFields, 'address1') || '',
          address2: getFieldValue(eventFields, 'address2') || null,
          city: getFieldValue(eventFields, 'city') || '',
          province: getFieldValue(eventFields, 'state') || '', // state field maps to province
          provinceCode: getFieldValue(eventFields, 'state') || '', // state field maps to provinceCode
          zip: getFieldValue(eventFields, 'postal_code') || '',
          country: getFieldValue(eventFields, 'country') || '',
          countryCodeV2: getFieldValue(eventFields, 'country') || '', // country field maps to countryCodeV2
          company: getFieldValue(eventFields, 'company') || '',
          phone: getFieldValue(eventFields, 'phone') || null,
          firstName: '',
          lastName: '',
        },
      };
    }

    const storedEventData = {
      id: eventId,
      name: getFieldValue(eventFields, 'name'),
      event_subtitle: getFieldValue(eventFields, 'event_subtitle'),
      event_status: getFieldValue(eventFields, 'event_status'),
      event_start_date: getFieldValue(eventFields, 'event_start_date'),
      event_end_date: getFieldValue(eventFields, 'event_end_date'),
      display_partner_logo: getBooleanFieldValue(eventFields, 'display_partner_logo'),
      event_hero_image: getFieldReference(eventFields, 'event_hero_image'),
      event_description: extractRichTextValue(eventFields, 'event_description'),
      bag_arrival_date: getFieldValue(eventFields, 'bag_arrival_date'),
      bag_departure_date: getFieldValue(eventFields, 'bag_departure_date'),
      destination_address: destinationAddress,
      course_name: getFieldValue(eventFields, 'course_name'),
      host_name: getFieldValue(eventFields, 'host_name'),
      service_levels: getJsonFieldValue(eventFields, 'service_levels'),
      receiving_instructions: getFieldValue(eventFields, 'receiving_instructions'),
    };

    storageService.setItem('EVENT', storedEventData);
    return true;
  } catch (error) {
    console.error('Error storing event data:', error);
    return false;
  }
}

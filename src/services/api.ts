// API service for BC Club Flow application

import { storage } from './storage';
import { envConfig } from '../config/env';

// Utility function to find index by key-value pair
export function findIndexByKeyValue<T>(array: T[], key: keyof T, value: any): number {
  return array.findIndex(item => item[key] === value);
}

// Types for API responses
export interface Address {
  id: string;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  provinceCode: string;
  zip: string;
  country: string;
  countryCodeV2: string;
  company: string;
}

export interface Item {
  item_id: string;
  item_code: string;
}

// Enriched item interface with product and member data
export interface EnrichedItem {
  item_id: string;
  item_code: string;
  name: string;
  type: string;
  variant_id: string;
  dimensions: Dimensions;
  price: any; // Price object (can be customized)
  quantity: number;
  profileComplete: boolean;
  member: {
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string;
    id: string;
    vip: boolean;
    vip_membership_start_date: string | null;
    vip_membership_end_date: string | null;
  };
}

// Product types for products API
export interface CustomField {
  name: string;
  value: string;
}

export interface Dimensions {
  depth: string;
  height: string;
  weight: string;
  width: string;
}

export interface Product {
  store_id: string;
  id: string;
  name: string;
  description: string;
  variant_id: string;
  price: number;
  sku: string;
  tag: string;
  images: string;
  custom_fields: CustomField[];
  dimensions: Dimensions;
}

export interface ProductsResponse {
  x: number;
  data: Product[];
  epsid: string;
  duration: number;
  memory: string;
  core_version: string;
}

export interface CustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  displayName: string;
  tags: string[];
  addresses: Address[];
  defaultAddress: Address;
  vip: boolean;
  vip_membership_start_date: string;
  vip_membership_end_date: string;
  items: Item[];
}

export interface QRCodeSuccessResponse {
  x: number;
  data: {
    success: true;
    data: CustomerData;
    message: string;
  };
  duration: number;
  memory: string;
  epsid: string;
}

export interface QRCodeErrorResponse {
  x: number;
  data: {
    success: false;
    status: number;
    message: string;
  };
  duration: number;
  memory: string;
  epsid: string;
}

export type QRCodeResponse = QRCodeSuccessResponse | QRCodeErrorResponse;

export interface QRCodeRequest {
  code: string;
}

// Partner types
export interface PartnerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  displayName?: string;
  tags?: string[];
  items: Item[];
  // addresses and defaultAddress can vary in shape; keep them flexible
  addresses?: any;
  defaultAddress?: any;
}

export interface PartnerSuccessResponse {
  x: number;
  data: {
    success: true;
    message: string;
    data: PartnerData;
    user?: any;
  };
  duration: number;
  memory: string;
  epsid: string;
}

export interface PartnerErrorResponse {
  x: number;
  data: {
    success: false;
    status: number;
    message: string;
  };
  duration: number;
  memory: string;
  epsid: string;
}

export type PartnerResponse = PartnerSuccessResponse | PartnerErrorResponse;

// OTP types
export interface OtpSuccessResponse {
  x: number;
  data: {
    success: true;
    message: string;
    otp_info: {
      auth_id: string;
      expires_in: number;
      sent_at: string;
      email_sent?: boolean;
      phone_sent?: boolean;
    };
  };
  duration: number;
  memory: string;
  epsid: string;
}

export interface OtpErrorResponse {
  x: number;
  data: {
    success: false;
    status: number;
    message: string;
  };
  duration: number;
  memory: string;
  epsid: string;
}

export type OtpResponse = OtpSuccessResponse | OtpErrorResponse;

// Verify-auth types (same envelope as OTP)
export type VerifyAuthSuccessResponse = OtpSuccessResponse;
export type VerifyAuthErrorResponse = OtpErrorResponse;
export type VerifyAuthResponse = VerifyAuthSuccessResponse | VerifyAuthErrorResponse;

// Customer types
export interface CustomerSuccessResponse {
  x: number;
  data: {
    success: true;
    message: string;
    data: {
      id: string;
      email: string;
      phone: string;
      firstName: string;
      lastName: string | null;
      displayName: string;
    };
    items?: {
      item_id: string;
      item_code: string;
    };
  };
  duration: number;
  memory: string;
  epsid: string;
}

export interface CustomerErrorResponse {
  x: number;
  data: {
    success: false;
    exists: boolean;
    message: string;
    data?: CustomerData;
  };
  duration: number;
  memory: string;
  epsid: string;
}

export type CustomerResponse = CustomerSuccessResponse | CustomerErrorResponse;

// Location types
export interface LocationInfo {
  ip: string;
  location: {
    continent_code: string;
    continent_name: string;
    country_code2: string;
    country_code3: string;
    country_name: string;
    country_name_official?: string;
    country_capital?: string;
    state_prov?: string;
    state_code?: string;
    district?: string;
    city?: string;
    zipcode?: string;
    latitude?: string;
    longitude?: string;
    is_eu?: boolean;
    country_flag?: string;
    geoname_id?: string;
    country_emoji?: string;
  };
  country_metadata?: {
    calling_code?: string;
    tld?: string;
    languages?: string[];
  };
  currency?: {
    code?: string;
    name?: string;
    symbol?: string;
  };
}

export interface LocationResponse {
  x: number;
  data: LocationInfo;
  epsid: string;
  duration: number;
  memory: string;
  core_version?: string;
}

// AS config types
export interface CountryCode {
  short_name_with_code: string;
  short_name: string;
  code: string;
}

export interface AsConfigData {
  rates?: any;
  country_codes: CountryCode[];
  vip_price?: number;
  success?: boolean;
  message?: string;
}

export interface AsConfigResponse {
  x: number;
  data: AsConfigData;
  duration: number;
  memory: string;
  epsid: string;
}

// Quote types
export interface QuoteLocation {
  id: string;
  name: string;
  street1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  type: string;
  placeId: string;
  source: string;
  address: string;
}

export interface QuoteData {
  from: QuoteLocation;
  to: QuoteLocation;
}

// Rates API types
export interface RatesRequest {
  ship_from: {
    street1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  ship_to: {
    street1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  parcels: {
    quantity: number;
    dimensions: {
      depth: string;
      height: string;
      weight: string;
      width: string;
    };
  };
}

export interface ShippingRate {
  shipper_account: {
    id: string;
    slug: string;
    description: string;
  };
  service_type: string;
  service_name: string;
  pickup_deadline: string | null;
  booking_cut_off: string | null;
  delivery_date: string;
  transit_time: number;
  error_message: string | null;
  info_message: string | null;
  charge_weight: {
    value: number;
    unit: string;
  };
  total_charge: {
    amount: number;
    currency: string;
  };
  detailed_charges: Array<{
    type: string;
    charge: {
      amount: number;
      currency: string;
    };
  }>;
  bc_actual_costs: {
    amount: number;
    currency: string;
    margin_type: string;
  };
}

export interface RatesSuccessResponse {
  x: number;
  data: {
    success: true;
    rates: ShippingRate[];
    is_cached: boolean;
  };
  duration: number;
  memory: string;
  epsid: string;
}

export interface RatesErrorResponse {
  x: number;
  data: {
    success: false;
    status: number;
    message: string;
    errors: string;
  };
  duration: number;
  memory: string;
  epsid: string;
}

export type RatesResponse = RatesSuccessResponse | RatesErrorResponse;

// API service class
export class ApiService {
  private static instance: ApiService;
  private baseURL: string;
  private locURL: string;

  private constructor() {
    this.baseURL = envConfig.apiBaseUrl;
    this.locURL = envConfig.locUrl;
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Validate QR code and get customer/item details
   * @param code - 8 character QR code
   * @returns Promise with customer data or error
   */
  public async validateQRCode(code: string): Promise<QRCodeResponse> {
    try {
      // Validate code length
      if (!code || code.length !== 8) {
        throw new Error('QR code must be exactly 8 characters long.');
      }

      const response = await fetch(`${this.baseURL}/item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData: QRCodeResponse = await response.json();
      
      // Store customer data in localStorage on success
      if (this.isSuccessResponse(responseData)) {
        const storageSuccess = storage.setItemsOwner(responseData.data.data);
        if (!storageSuccess) {
          console.warn('Failed to store customer data in localStorage');
        } else {
          console.log('Customer data stored successfully in localStorage');
        }

        // Process and enrich items with product data
        await this.processAndStoreEnrichedItems(responseData.data.data, code);
      }
      
      return responseData;
    } catch (error) {
      console.error('API Error:', error);
      
      // Return a structured error response
      const errorResponse: QRCodeErrorResponse = {
        x: 400,
        data: {
          success: false,
          status: 400,
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
        duration: 0,
        memory: '0',
        epsid: '',
      };
      
      return errorResponse;
    }
  }

  /**
   * Check if the response indicates success
   * @param response - API response
   * @returns boolean indicating success
   */
  public isSuccessResponse(response: QRCodeResponse): response is QRCodeSuccessResponse {
    return response.data.success === true;
  }

  /**
   * Get error message from response
   * @param response - API response
   * @returns error message string
   */
  public getErrorMessage(response: QRCodeResponse): string {
    if (this.isSuccessResponse(response)) {
      return '';
    }
    return response.data.message;
  }

  /**
   * Get stored customer data from localStorage
   * @returns Customer data or null if not found
   */
  public getStoredCustomerData(): CustomerData | null {
    return storage.getItemsOwner<CustomerData>();
  }

  /**
   * Check if customer data is stored
   * @returns boolean indicating if data exists
   */
  public hasStoredCustomerData(): boolean {
    return storage.hasItemsOwner();
  }

  /**
   * Clear stored customer data
   * @returns boolean indicating success
   */
  public clearStoredCustomerData(): boolean {
    return storage.removeItemsOwner();
  }

  /**
   * Get products list
   * @returns Promise with products data
   */
  public async getProducts(): Promise<ProductsResponse> {
    try {
      const response = await fetch(`${this.baseURL}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ProductsResponse = await response.json();
      
      return data;
    } catch (error) {
      console.error('Products API Error:', error);
      
      // Return a structured error response
      const errorResponse: ProductsResponse = {
        x: 400,
        data: [],
        epsid: '',
        duration: 0,
        memory: '0',
        core_version: 'v10.0'
      };
      
      return errorResponse;
    }
  }

  /**
   * Get stored products data from localStorage
   * @returns Products data or null if not found
   */
  public getStoredProducts(): Product[] | null {
    const storedData = storage.getProducts<Product[]>();
    return storedData || null;
  }

  /**
   * Check if products data is stored
   * @returns boolean indicating if data exists
   */
  public hasStoredProducts(): boolean {
    return storage.hasProducts();
  }

  /**
   * Get partner details by email or phone
   */
  public async getPartner(payload: { email?: string; phone?: string }): Promise<PartnerResponse> {
    try {
      const response = await fetch(`${this.baseURL}/partner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PartnerResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Partner API Error:', error);
      const errorResponse: PartnerErrorResponse = {
        x: 400,
        data: {
          success: false,
          status: 400,
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
        duration: 0,
        memory: '0',
        epsid: '',
      };
      return errorResponse;
    }
  }

  /**
   * Send OTP to partner
   */
  public async sendOtp(payload: {
    type: 'email' | 'phone';
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  }): Promise<OtpResponse> {
    try {
      const response = await fetch(`${this.baseURL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OtpResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Send OTP API Error:', error);
      const errorResponse: OtpErrorResponse = {
        x: 400,
        data: {
          success: false,
          status: 400,
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
        duration: 0,
        memory: '0',
        epsid: '',
      };
      return errorResponse;
    }
  }

  /**
   * Verify authentication code
   */
  public async verifyAuth(payload: {
    code: string;
    phone?: string;
    email?: string;
  }): Promise<VerifyAuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/verify-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: VerifyAuthResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Verify Auth API Error:', error);
      const errorResponse: VerifyAuthErrorResponse = {
        x: 400,
        data: {
          success: false,
          status: 400,
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
        duration: 0,
        memory: '0',
        epsid: '',
      };
      return errorResponse;
    }
  }

  /**
   * Create customer
   */
  public async createCustomer(payload: {
    items: {
      item_id: string;
    };
    personal: {
      firstName: string;
      lastName: string;
      phoneCode: string;
      phone: string;
      email: string;
    };
  }): Promise<CustomerResponse> {
    try {
      const response = await fetch(`${this.baseURL}/customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CustomerResponse = await response.json();
      
      // Store customer data and enriched items on success or if customer exists
      if (data.data.success) {
        // Success response
        const successData = data as CustomerSuccessResponse;
        const customerData = successData.data.data;
        
        // Convert to CustomerData format for storage
        const customerDataForStorage: CustomerData = {
          id: customerData.id,
          firstName: customerData.firstName,
          lastName: customerData.lastName || '',
          email: customerData.email,
          phone: customerData.phone,
          displayName: customerData.displayName,
          tags: [],
          addresses: [],
          defaultAddress: {} as Address,
          vip: false,
          vip_membership_start_date: '',
          vip_membership_end_date: '',
          items: successData.data.items ? [{
            item_id: successData.data.items.item_id,
            item_code: successData.data.items.item_code,
          }] : [],
        };
        
        storage.setItemsOwner(customerDataForStorage);
        
        // Process and enrich items if item_code is available
        if (successData.data.items?.item_code) {
          await this.processAndStoreEnrichedItems(customerDataForStorage, successData.data.items.item_code);
        }
      } else if ((data as CustomerErrorResponse).data.exists) {
        // Customer exists response
        const errorData = data as CustomerErrorResponse;
        const customerData = errorData.data.data;
        
        if (customerData) {
          // Store items owner
          storage.setItemsOwner(customerData);
          
          // Process and enrich items if items are returned
          if (customerData.items && customerData.items.length > 0) {
            const codeToUse = customerData.items[0]?.item_code;
            if (codeToUse) {
              await this.processAndStoreEnrichedItems(customerData, codeToUse);
            }
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Create Customer API Error:', error);
      const errorResponse: CustomerErrorResponse = {
        x: 400,
        data: {
          success: false,
          exists: false,
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
        duration: 0,
        memory: '0',
        epsid: '',
      };
      return errorResponse;
    }
  }

  /**
   * Get user location info (IP-based)
   */
  public async getLocation(): Promise<LocationResponse> {
    try {
      const resp = await fetch(this.locURL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const responseData: LocationResponse = await resp.json();
      // cache
      storage.setLocation(responseData.data);
      return responseData;
    } catch (error) {
      console.error('Location API Error:', error);
      const fallback: LocationResponse = {
        x: 400,
        data: { ip: '', location: { continent_code: '', continent_name: '', country_code2: '', country_code3: '', country_name: '' } as any },
        epsid: '',
        duration: 0,
        memory: '0',
      };
      return fallback;
    }
  }

  /**
   * Fetch AS configuration and cache country codes
   */
  public async getAsConfig(): Promise<AsConfigResponse> {
    try {
      const resp = await fetch(`${this.baseURL}/fetch-as-config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const responseData: AsConfigResponse = await resp.json();
      if (responseData?.data?.country_codes?.length) {
        storage.setCountryCodes(responseData.data.country_codes);
      }
      return responseData;
    } catch (error) {
      console.error('AS Config API Error:', error);
      const fallback: AsConfigResponse = {
        x: 400,
        data: { country_codes: [] },
        duration: 0,
        memory: '0',
        epsid: ''
      } as any;
      return fallback;
    }
  }

  /**
   * Process and enrich items with product data
   * @param customerData - Customer data from QR validation
   * @param qrCode - QR code used for validation
   */
  private async processAndStoreEnrichedItems(customerData: CustomerData, qrCode: string): Promise<void> {
    try {
      // Get current product list
      let currentProductList = this.getStoredProducts();
      
      // If no products stored, fetch them
      if (!currentProductList || currentProductList.length === 0) {
        console.log('No products in storage, fetching from API...');
        const productsResponse = await this.getProducts();
        currentProductList = productsResponse.data;
      }

      if (!currentProductList || currentProductList.length === 0) {
        console.error('No products available for item enrichment');
        return;
      }

      // Find items that match the QR code
      const matchingItems = customerData.items.filter(item => item.item_code === qrCode);
      
      if (matchingItems.length === 0) {
        console.warn(`No items found for QR code: ${qrCode}`);
        return;
      }

      // Process each matching item
      const enrichedItems: EnrichedItem[] = [];
      
      for (const item of matchingItems) {
        const enrichedItem = await this.enrichItem(item, customerData, currentProductList);
        if (enrichedItem) {
          enrichedItems.push(enrichedItem);
        }
      }

      // Store enriched items (replace existing, don't merge)
      if (enrichedItems.length > 0) {
        const storageSuccess = storage.setEnrichedItems(enrichedItems);
        if (storageSuccess) {
          console.log(`Stored ${enrichedItems.length} enriched items`);
        } else {
          console.warn('Failed to store enriched items');
        }
      }
    } catch (error) {
      console.error('Error processing enriched items:', error);
    }
  }

  /**
   * Enrich a single item with product and member data
   * @param item - Item to enrich
   * @param customerData - Customer data
   * @param productList - List of products
   * @returns Enriched item or null if product not found
   */
  private async enrichItem(item: Item, customerData: CustomerData, productList: Product[]): Promise<EnrichedItem | null> {
    try {
      // Find product by item_id
      const productIndex = findIndexByKeyValue(productList, 'id', item.item_id);
      
      if (productIndex === -1) {
        console.warn(`Product not found for item_id: ${item.item_id}`);
        return null;
      }

      const product = productList[productIndex];
      
      // Create enriched item
      const enrichedItem: EnrichedItem = {
        item_id: item.item_id,
        item_code: item.item_code,
        name: product.name,
        type: product.tag,
        variant_id: product.variant_id,
        dimensions: product.dimensions,
        price: { amount: product.price, currency: 'USD' }, // Default price object
        quantity: 1,
        profileComplete: !!(customerData.firstName && (customerData.phone || customerData.email)),
        member: {
          firstName: customerData.firstName,
          lastName: customerData.lastName || '',
          phone: customerData.phone || '',
          email: customerData.email || '',
          id: customerData.id,
          vip: customerData.vip || false,
          vip_membership_start_date: customerData.vip_membership_start_date || null,
          vip_membership_end_date: customerData.vip_membership_end_date || null
        }
      };

      return enrichedItem;
    } catch (error) {
      console.error('Error enriching item:', error);
      return null;
    }
  }

  /**
   * Merge new enriched items with existing ones
   * @param existingItems - Existing enriched items
   * @param newItems - New enriched items to add
   * @returns Merged items array
   */
  private mergeEnrichedItems(existingItems: EnrichedItem[], newItems: EnrichedItem[]): EnrichedItem[] {
    const mergedItems = [...existingItems];
    
    for (const newItem of newItems) {
      const existingItemIndex = mergedItems.findIndex(
        item => item.item_code === newItem.item_code
      );
      
      if (existingItemIndex !== -1) {
        // Update existing item
        mergedItems[existingItemIndex] = {
          ...mergedItems[existingItemIndex],
          member: { ...newItem.member },
          price: { ...newItem.price },
          quantity: 1
        };
      } else {
        // Add new item
        mergedItems.push({ ...newItem });
      }
    }
    
    return mergedItems;
  }

  /**
   * Get stored enriched items from localStorage
   * @returns Enriched items or null if not found
   */
  public getStoredEnrichedItems(): EnrichedItem[] | null {
    return storage.getEnrichedItems<EnrichedItem[]>();
  }

  /**
   * Check if enriched items are stored
   * @returns boolean indicating if data exists
   */
  public hasStoredEnrichedItems(): boolean {
    return storage.hasEnrichedItems();
  }

  /**
   * Clear stored enriched items
   * @returns boolean indicating success
   */
  public clearStoredEnrichedItems(): boolean {
    return storage.removeEnrichedItems();
  }

  /**
   * Process and enrich all items from partner data (without QR code filter)
   * @param partnerData - Partner data with items
   */
  public async processAndStorePartnerItems(partnerData: PartnerData): Promise<void> {
    try {
      // Convert PartnerData to CustomerData format
      // Handle addresses: can be an object or array
      const addressesArray = Array.isArray(partnerData.addresses) 
        ? partnerData.addresses 
        : partnerData.addresses 
          ? [partnerData.addresses]
          : [];
      
      const defaultAddr = partnerData.defaultAddress || (Array.isArray(partnerData.addresses) 
        ? partnerData.addresses[0] 
        : partnerData.addresses) || {};

      const customerData: CustomerData = {
        id: partnerData.id,
        firstName: partnerData.firstName,
        lastName: partnerData.lastName,
        email: partnerData.email,
        phone: partnerData.phone,
        displayName: partnerData.displayName || `${partnerData.firstName} ${partnerData.lastName}`,
        tags: partnerData.tags || [],
        addresses: addressesArray as Address[],
        defaultAddress: defaultAddr as Address,
        vip: false, // Default to false, can be updated if partner data includes VIP info
        vip_membership_start_date: '',
        vip_membership_end_date: '',
        items: partnerData.items || []
      };

      // Get current product list
      let currentProductList = this.getStoredProducts();
      
      // If no products stored, fetch them
      if (!currentProductList || currentProductList.length === 0) {
        console.log('No products in storage, fetching from API...');
        const productsResponse = await this.getProducts();
        currentProductList = productsResponse.data;
      }

      if (!currentProductList || currentProductList.length === 0) {
        console.error('No products available for item enrichment');
        return;
      }

      if (!customerData.items || customerData.items.length === 0) {
        console.warn('No Golf bags registered yet');
        return;
      }

      // Process all items (not filtered by QR code)
      const enrichedItems: EnrichedItem[] = [];
      
      for (const item of customerData.items) {
        const enrichedItem = await this.enrichItem(item, customerData, currentProductList);
        if (enrichedItem) {
          enrichedItems.push(enrichedItem);
        }
      }
      

      // Store enriched items (replace existing, don't merge)
      if (enrichedItems.length > 0) {
        const storageSuccess = storage.setEnrichedItems(enrichedItems);
        if (storageSuccess) {
          console.log(`Stored ${enrichedItems.length} enriched items from partner data`);
        } else {
          console.warn('Failed to store enriched items');
        }
      }
    } catch (error) {
      console.error('Error processing partner items:', error);
    }
  }

  /**
   * Calculate shipping rates
   * @param payload - Rates calculation payload
   * @returns Rates response with shipping options
   */
  public async calculateRates(payload: RatesRequest): Promise<RatesResponse> {
    try {
      const response = await fetch(`${this.baseURL}/calculate-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RatesResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Rates API Error:', error);
      const errorResponse: RatesErrorResponse = {
        x: 400,
        data: {
          success: false,
          status: 400,
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          errors: 'Failed to calculate rates. Please try again.',
        },
        duration: 0,
        memory: '0',
        epsid: '',
      };
      return errorResponse;
    }
  }

  /**
   * Create Klaviyo event
   * @param payload - Klaviyo event payload
   * @returns Promise with response
   */
  public async createKlaviyoEvent(payload: {
    email?: string;
    phone_number?: string;
    from_city: string;
    to_city: string;
    shipping_service: string;
    location: {
      ip: string;
      latitude: number;
      longitude: number;
      city: string;
      country: string;
      zip: string;
    };
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/klaviyo-create-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Klaviyo API Error:', error);
      // Don't throw error - allow redirect to continue even if Klaviyo fails
      return null;
    }
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();

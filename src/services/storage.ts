// Storage service for managing local storage operations
import { envConfig } from '../config/env';

// Storage keys constants
export const STORAGE_KEYS = {
  SCANNER_PAGE: "_bc_scanner_page",
  CLUB_PARTNER: "_bc_club_partner",
  PRODUCTS: "_bc_products",
  ITEMS_OWNER: "_bc_items_owner",
  ENRICHED_ITEMS: "_bc_items",
  LOCATION: "_bc_location",
  COUNTRY_CODES: "_bc_country_codes",
  QUOTES: "_bc_quotes",
  QUOTE: "_bc_quote",
  CONTACT_INFO: "_bc_contact_info",
  APP_INITIALIZED: "_bc_app_initialized",
  EVENT: "_bc_event",
  PARTNER_REFERENCE: "_bc_partner_reference"
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

// Generic storage service class
export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Check if localStorage is available
   * @returns boolean indicating if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get storage key with environment suffix
   * Adds "_dev" suffix in non-production environments
   * @param key - Storage key
   * @returns Storage key with environment suffix if needed
   */
  private getStorageKey(key: StorageKey): string {
    const baseKey = STORAGE_KEYS[key];
    // Add "_dev" suffix if not in production
    if (envConfig.env !== 'production') {
      return `${baseKey}_dev`;
    }
    return baseKey;
  }

  /**
   * Set data in localStorage
   * @param key - Storage key
   * @param data - Data to store
   * @returns boolean indicating success
   */
  public setItem<T>(key: StorageKey, data: T): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      const storageKey = this.getStorageKey(key);
      const serializedData = JSON.stringify(data);
      localStorage.setItem(storageKey, serializedData);
      return true;
    } catch (error) {
      console.error(`Error setting localStorage item ${key}:`, error);
      return false;
    }
  }

  /**
   * Get data from localStorage
   * @param key - Storage key
   * @returns Parsed data or null if not found/error
   */
  public getItem<T>(key: StorageKey): T | null {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage is not available');
      return null;
    }

    try {
      const storageKey = this.getStorageKey(key);
      const item = localStorage.getItem(storageKey);
      
      if (item === null) {
        return null;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error getting localStorage item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from localStorage
   * @param key - Storage key
   * @returns boolean indicating success
   */
  public removeItem(key: StorageKey): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage item ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all storage items for this app
   * @returns boolean indicating success
   */
  public clearAll(): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      Object.keys(STORAGE_KEYS).forEach(key => {
        const storageKey = this.getStorageKey(key as StorageKey);
        localStorage.removeItem(storageKey);
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   * @param key - Storage key
   * @returns boolean indicating if key exists
   */
  public hasItem(key: StorageKey): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    try {
      const storageKey = this.getStorageKey(key);
      return localStorage.getItem(storageKey) !== null;
    } catch (error) {
      console.error(`Error checking localStorage item ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all storage keys for this app
   * @returns Array of storage keys
   */
  public getAllKeys(): string[] {
    if (!this.isLocalStorageAvailable()) {
      return [];
    }

    try {
      return Object.keys(STORAGE_KEYS).map(key => this.getStorageKey(key as StorageKey));
    } catch (error) {
      console.error('Error getting storage keys:', error);
      return [];
    }
  }

  /**
   * Get storage size information
   * @returns Object with storage size information
   */
  public getStorageInfo(): { used: number; available: number; total: number } {
    if (!this.isLocalStorageAvailable()) {
      return { used: 0, available: 0, total: 0 };
    }

    try {
      let used = 0;
      Object.keys(STORAGE_KEYS).forEach(key => {
        const storageKey = this.getStorageKey(key as StorageKey);
        const item = localStorage.getItem(storageKey);
        if (item) {
          used += item.length;
        }
      });

      // Estimate available space (this is approximate)
      const total = 5 * 1024 * 1024; // 5MB typical localStorage limit
      const available = total - used;

      return { used, available, total };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();

// Convenience functions for common operations
export const storage = {
  /**
   * Store items owner data
   * @param data - Customer data to store
   * @returns boolean indicating success
   */
  setClubPartner: <T>(data: T): boolean => {
    storageService.setItem('SCANNER_PAGE', "booking");
    return storageService.setItem('CLUB_PARTNER', data);
  },
  /**
   * Store items owner data
   * @param data - Customer data to store
   * @returns boolean indicating success
   */
  setItemsOwner: <T>(data: T): boolean => {
    storageService.setItem('SCANNER_PAGE', "profile");
    return storageService.setItem('ITEMS_OWNER', data);
  },

  /**
   * Get items owner data
   * @returns Customer data or null
   */
  getItemsOwner: <T>(): T | null => {
    return storageService.getItem<T>('ITEMS_OWNER');
  },
  
  clearLocalStorage: (): any => {
    storageService.removeItem('SCANNER_PAGE');
    storageService.removeItem('ENRICHED_ITEMS');
    storageService.removeItem('QUOTES');
    storageService.removeItem('ITEMS_OWNER');
    storageService.removeItem('CLUB_PARTNER');
    storageService.removeItem('CONTACT_INFO');
  },

  /**
   * Remove items owner data
   * @returns boolean indicating success
   */
  removeItemsOwner: (): boolean => {
    storageService.removeItem('SCANNER_PAGE');
    return storageService.removeItem('ITEMS_OWNER');
  },

  /**
   * Check if items owner data exists
   * @returns boolean indicating if data exists
   */
  hasItemsOwner: (): boolean => {
    return storageService.hasItem('ITEMS_OWNER');
  },

  /**
   * Store enriched items data
   * @param data - Enriched items data to store
   * @returns boolean indicating success
   */
  setEnrichedItems: <T>(data: T): boolean => {
    return storageService.setItem('ENRICHED_ITEMS', data);
  },

  /**
   * Get enriched items data
   * @returns Enriched items data or null
   */
  getEnrichedItems: <T>(): T | null => {
    return storageService.getItem<T>('ENRICHED_ITEMS');
  },

  /**
   * Remove enriched items data
   * @returns boolean indicating success
   */
  removeEnrichedItems: (): boolean => {
    return storageService.removeItem('ENRICHED_ITEMS');
  },

  /**
   * Check if enriched items data exists
   * @returns boolean indicating if data exists
   */
  hasEnrichedItems: (): boolean => {
    return storageService.hasItem('ENRICHED_ITEMS');
  },

  /**
   * Store location data
   */
  setLocation: <T>(data: T): boolean => {
    return storageService.setItem('LOCATION', data as any);
  },

  /**
   * Get location data
   */
  getLocation: <T>(): T | null => {
    return storageService.getItem<T>('LOCATION');
  },

  /**
   * Clear location data
   */
  removeLocation: (): boolean => {
    return storageService.removeItem('LOCATION');
  },

  /**
   * Has location data
   */
  hasLocation: (): boolean => {
    return storageService.hasItem('LOCATION');
  },

  /**
   * Country codes caching helpers
   */
  setCountryCodes: <T>(data: T): boolean => {
    return storageService.setItem('COUNTRY_CODES', data as any);
  },
  getCountryCodes: <T>(): T | null => {
    return storageService.getItem<T>('COUNTRY_CODES');
  },
  hasCountryCodes: (): boolean => {
    return storageService.hasItem('COUNTRY_CODES');
  },
  removeCountryCodes: (): boolean => {
    return storageService.removeItem('COUNTRY_CODES');
  },

  /**
   * Store products data
   * @param data - Products data to store
   * @returns boolean indicating success
   */
  setProducts: <T>(data: T): boolean => {
    return storageService.setItem('PRODUCTS', data);
  },

  /**
   * Get products data
   * @returns Products data or null
   */
  getProducts: <T>(): T | null => {
    return storageService.getItem<T>('PRODUCTS');
  },

  /**
   * Remove products data
   * @returns boolean indicating success
   */
  removeProducts: (): boolean => {
    return storageService.removeItem('PRODUCTS');
  },

  /**
   * Check if products data exists
   * @returns boolean indicating if data exists
   */
  hasProducts: (): boolean => {
    return storageService.hasItem('PRODUCTS');
  },

  /**
   * Store quotes data (from and to addresses)
   * @param data - Quote data to store (with from and to addresses)
   * @returns boolean indicating success
   */
  setQuotes: <T>(data: T): boolean => {
    return storageService.setItem('QUOTES', data);
  },

  /**
   * Get quotes data
   * @returns Quote data or null
   */
  getQuotes: <T>(): T | null => {
    return storageService.getItem<T>('QUOTES');
  },

  /**
   * Remove quotes data
   * @returns boolean indicating success
   */
  removeQuotes: (): boolean => {
    return storageService.removeItem('QUOTES');
  },

  /**
   * Check if quotes data exists
   * @returns boolean indicating if data exists
   */
  hasQuotes: (): boolean => {
    return storageService.hasItem('QUOTES');
  },

  /**
   * Store quote data (single quote with from and to addresses)
   * @param data - Quote data to store
   * @returns boolean indicating success
   */
  setQuote: <T>(data: T): boolean => {
    return storageService.setItem('QUOTE', data);
  },

  /**
   * Get quote data
   * @returns Quote data or null
   */
  getQuote: <T>(): T | null => {
    return storageService.getItem<T>('QUOTE');
  },

  /**
   * Remove quote data
   * @returns boolean indicating success
   */
  removeQuote: (): boolean => {
    return storageService.removeItem('QUOTE');
  },

  /**
   * Check if quote data exists
   * @returns boolean indicating if data exists
   */
  hasQuote: (): boolean => {
    return storageService.hasItem('QUOTE');
  },

  /**
   * Store contact info data
   * @param data - Contact info to store
   * @returns boolean indicating success
   */
  setContactInfo: <T>(data: T): boolean => {
    return storageService.setItem('CONTACT_INFO', data);
  },

  /**
   * Get contact info data
   * @returns Contact info or null
   */
  getContactInfo: <T>(): T | null => {
    return storageService.getItem<T>('CONTACT_INFO');
  },

  /**
   * Remove contact info data
   * @returns boolean indicating success
   */
  removeContactInfo: (): boolean => {
    return storageService.removeItem('CONTACT_INFO');
  },

  /**
   * Check if contact info data exists
   * @returns boolean indicating if data exists
   */
  hasContactInfo: (): boolean => {
    return storageService.hasItem('CONTACT_INFO');
  },

  /**
   * Store app initialized flag
   * @param data - App initialized flag value
   * @returns boolean indicating success
   */
  setAppInitialized: <T>(data: T): boolean => {
    return storageService.setItem('APP_INITIALIZED', data);
  },

  /**
   * Get app initialized flag
   * @returns App initialized flag or null
   */
  getAppInitialized: <T>(): T | null => {
    return storageService.getItem<T>('APP_INITIALIZED');
  },

  /**
   * Remove app initialized flag
   * @returns boolean indicating success
   */
  removeAppInitialized: (): boolean => {
    return storageService.removeItem('APP_INITIALIZED');
  },

  /**
   * Check if app initialized flag exists
   * @returns boolean indicating if flag exists
   */
  hasAppInitialized: (): boolean => {
    return storageService.hasItem('APP_INITIALIZED');
  }
};

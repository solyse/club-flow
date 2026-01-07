// Analytics Service
// Centralized Google Analytics and Microsoft UET (Universal Event Tracking) tracking functions for reuse across components

// Type definitions for window objects
interface AnalyticsServiceType {
  // Core methods
  isGtagAvailable: () => boolean;
  trackEvent: (eventName: string, eventParams?: Record<string, any>) => void;
  
  // Microsoft UET methods
  initMicrosoftUET: () => void;
  isMicrosoftUETAvailable: () => boolean;
  trackMicrosoftUET: (eventCategory: string, eventData?: Record<string, any>) => void;
  
  // OTP tracking
  trackOtpStart: (method: 'email' | 'phone') => void;
  trackOtpSuccess: (method: 'email' | 'phone', isNewUser: boolean) => void;
  trackOtpFailure: (method: 'email' | 'phone', reason?: string | null) => void;
  
  // Page tracking
  trackPageView: (pagePath: string, pageTitle?: string | null) => void;
  
  // User interaction tracking
  trackUserAction: (action: string, category: string, label?: string | null, value?: number | null) => void;
  trackFormSubmission: (formName: string, success: boolean, errorMessage?: string | null) => void;
  trackButtonClick: (buttonName: string, location?: string | null) => void;
  
  // Business-specific tracking
  trackBookingEvent: (eventType: string, bookingData?: Record<string, any>) => void;
  trackQrScan: (scanType: string, success: boolean) => void;
}

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    uetq?: Array<Record<string, any>>;
    AnalyticsService?: AnalyticsServiceType;
  }
}

/**
 * Check if Google Analytics (gtag) is available
 * @returns {boolean} - True if gtag is available, false otherwise
 */
function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Initialize Microsoft UET queue if not already initialized
 * @returns {void}
 */
function initMicrosoftUET(): void {
  if (typeof window !== 'undefined' && !window.uetq) {
    window.uetq = [];
  }
}

/**
 * Check if Microsoft UET is available
 * @returns {boolean} - True if UET is available, false otherwise
 */
function isMicrosoftUETAvailable(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Track an event in Microsoft UET
 * @param {string} eventCategory - The event category (ec)
 * @param {Record<string, any>} eventData - Event data object
 * @returns {void}
 */
function trackMicrosoftUET(eventCategory: string, eventData: Record<string, any> = {}): void {
  if (isMicrosoftUETAvailable()) {
    try {
      initMicrosoftUET();
      const uetEvent: Record<string, any> = {
        'ec': eventCategory,
        ...eventData
      };
      if (window.uetq) {
        window.uetq.push(uetEvent);
      }
    } catch (error) {
      console.error('Error tracking Microsoft UET event:', error);
    }
  }
}

/**
 * Track a custom event in Google Analytics
 * @param {string} eventName - The name of the event
 * @param {Record<string, any>} eventParams - Event parameters object
 * @returns {void}
 */
function trackEvent(eventName: string, eventParams: Record<string, any> = {}): void {
  if (isGtagAvailable() && window.gtag) {
    try {
      window.gtag('event', eventName, eventParams);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  } else {
    console.warn('Google Analytics (gtag) is not available');
  }
}

// Track last OTP start to prevent duplicate fires
let lastOtpStartTime: number | null = null;
let lastOtpStartMethod: 'email' | 'phone' | null = null;
const OTP_START_DEBOUNCE_MS = 2000; // 2 seconds debounce to prevent duplicate fires

/**
 * Track OTP start event
 * Fires exactly once each time user initiates OTP request
 * Does not fire on page load
 * Must include method: 'phone' | 'email'
 * 
 * @param {'email' | 'phone'} method - Authentication method ('email' or 'phone')
 * @returns {void}
 */
function trackOtpStart(method: 'email' | 'phone'): void {
  // Strict validation: method must be exactly 'email' or 'phone'
  if (method !== 'email' && method !== 'phone') {
    console.warn('Invalid OTP method. Expected "email" or "phone", got:', method);
    return;
  }
  
  // Prevent duplicate fires within debounce window (same method)
  const now = Date.now();
  if (lastOtpStartTime && 
      lastOtpStartMethod === method && 
      (now - lastOtpStartTime) < OTP_START_DEBOUNCE_MS) {
    console.warn('OTP start event already fired recently for method:', method);
    return;
  }
  
  // Update last fire time and method
  lastOtpStartTime = now;
  lastOtpStartMethod = method;
  
  // Track in Google Analytics with method parameter
  trackEvent('otp_start', {
    method: method
  });
  
  // Track in Microsoft UET with method parameter
  trackMicrosoftUET('otp_start', {
    'method': method
  });
}

// Track last OTP success to prevent duplicate fires
let lastOtpSuccessTime: number | null = null;
let lastOtpSuccessKey: string | null = null;
const OTP_SUCCESS_DEBOUNCE_MS = 2000; // 2 seconds debounce to prevent duplicate fires

/**
 * Track OTP verification success
 * Fires immediately after backend OTP validation success
 * Requires backend to return isNewUser boolean
 * Includes both method and user_type
 * Never fires on failed OTP attempts
 * Never fires twice for the same success event
 * 
 * @param {'email' | 'phone'} method - Authentication method ('email' or 'phone')
 * @param {boolean} isNewUser - Whether the user is new (true) or returning (false)
 * @returns {void}
 */
function trackOtpSuccess(method: 'email' | 'phone', isNewUser: boolean): void {
  // Strict validation: method must be exactly 'email' or 'phone'
  if (method !== 'email' && method !== 'phone') {
    console.warn('Invalid OTP method. Expected "email" or "phone", got:', method);
    return;
  }
  
  // Validate isNewUser is a boolean
  if (typeof isNewUser !== 'boolean') {
    console.warn('Invalid isNewUser. Expected boolean, got:', isNewUser);
    return;
  }
  
  // Create unique key for this success event (method + user_type)
  const userType = isNewUser ? 'new' : 'returning';
  const successKey = `${method}_${userType}`;
  
  // Prevent duplicate fires within debounce window (same method + user_type)
  const now = Date.now();
  if (lastOtpSuccessTime && 
      lastOtpSuccessKey === successKey && 
      (now - lastOtpSuccessTime) < OTP_SUCCESS_DEBOUNCE_MS) {
    console.warn('OTP success event already fired recently for:', successKey);
    return;
  }
  
  // Update last fire time and key
  lastOtpSuccessTime = now;
  lastOtpSuccessKey = successKey;
  
  // Track in Google Analytics with method and user_type
  trackEvent('otp_verification_success', {
    method: method,
    user_type: userType
  });
  
  // Track in Microsoft UET with method and user_type
  trackMicrosoftUET('otp_verification_success', {
    'method': method,
    'user_type': userType
  });
}

/**
 * Track OTP verification failure
 * @param {'email' | 'phone'} method - Authentication method ('email' or 'phone')
 * @param {string | null} reason - Optional reason for failure
 * @returns {void}
 */
function trackOtpFailure(method: 'email' | 'phone', reason: string | null = null): void {
  if (!method || (method !== 'email' && method !== 'phone')) {
    console.warn('Invalid OTP method. Expected "email" or "phone"');
    return;
  }
  
  const eventParams: Record<string, any> = {
    method: method
  };
  
  const uetData: Record<string, any> = {
    'method': method
  };
  
  if (reason) {
    eventParams.reason = reason;
    uetData.reason = reason;
  }
  
  // Track in Google Analytics
  trackEvent('otp_failure', eventParams);
  
  // Track in Microsoft UET
  trackMicrosoftUET('otp_failure', uetData);
}

/**
 * Track page view
 * @param {string} pagePath - The path of the page
 * @param {string | null} pageTitle - Optional page title
 * @returns {void}
 */
function trackPageView(pagePath: string, pageTitle: string | null = null): void {
  if (isGtagAvailable() && window.gtag) {
    try {
      const config: Record<string, any> = {
        page_path: pagePath
      };
      
      if (pageTitle) {
        config.page_title = pageTitle;
      }
      
      window.gtag('config', 'GA_MEASUREMENT_ID', config);
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }
}

/**
 * Track user action (generic)
 * @param {string} action - The action name (e.g., 'button_click', 'form_submit')
 * @param {string} category - The category of the action (e.g., 'engagement', 'navigation')
 * @param {string | null} label - Optional label for the action
 * @param {number | null} value - Optional numeric value
 * @returns {void}
 */
function trackUserAction(
  action: string, 
  category: string, 
  label: string | null = null, 
  value: number | null = null
): void {
  const eventParams: Record<string, any> = {
    action: action,
    category: category
  };
  
  if (label) {
    eventParams.label = label;
  }
  
  if (value !== null) {
    eventParams.value = value;
  }
  
  trackEvent('user_action', eventParams);
}

/**
 * Track form submission
 * @param {string} formName - Name of the form
 * @param {boolean} success - Whether the submission was successful
 * @param {string | null} errorMessage - Optional error message if submission failed
 * @returns {void}
 */
function trackFormSubmission(
  formName: string, 
  success: boolean, 
  errorMessage: string | null = null
): void {
  const eventParams: Record<string, any> = {
    form_name: formName,
    success: success
  };
  
  if (errorMessage) {
    eventParams.error_message = errorMessage;
  }
  
  trackEvent('form_submit', eventParams);
}

/**
 * Track button click
 * @param {string} buttonName - Name/identifier of the button
 * @param {string | null} location - Location/context where button was clicked
 * @returns {void}
 */
function trackButtonClick(buttonName: string, location: string | null = null): void {
  const eventParams: Record<string, any> = {
    button_name: buttonName
  };
  
  if (location) {
    eventParams.location = location;
  }
  
  trackEvent('button_click', eventParams);
}

/**
 * Track booking/order related events
 * @param {string} eventType - Type of booking event ('start', 'complete', 'cancel', etc.)
 * @param {Record<string, any>} bookingData - Optional booking data
 * @returns {void}
 */
function trackBookingEvent(eventType: string, bookingData: Record<string, any> = {}): void {
  const eventParams: Record<string, any> = {
    event_type: eventType,
    ...bookingData
  };
  
  trackEvent('booking_event', eventParams);
}

/**
 * Track QR code scan
 * @param {string} scanType - Type of scan ('club', 'item', 'manual', etc.)
 * @param {boolean} success - Whether the scan was successful
 * @returns {void}
 */
function trackQrScan(scanType: string, success: boolean): void {
  trackEvent('qr_scan', {
    scan_type: scanType,
    success: success
  });
}

// Create analytics service object
const AnalyticsService = {
  // Core methods
  isGtagAvailable,
  trackEvent,
  
  // Microsoft UET methods
  initMicrosoftUET,
  isMicrosoftUETAvailable,
  trackMicrosoftUET,
  
  // OTP tracking
  trackOtpStart,
  trackOtpSuccess,
  trackOtpFailure,
  
  // Page tracking
  trackPageView,
  
  // User interaction tracking
  trackUserAction,
  trackFormSubmission,
  trackButtonClick,
  
  // Business-specific tracking
  trackBookingEvent,
  trackQrScan
};

// Make service available globally
if (typeof window !== 'undefined') {
  window.AnalyticsService = AnalyticsService;
}

export default AnalyticsService;


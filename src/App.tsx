import { useState, useEffect, useCallback } from 'react';
import { AccessStep } from './components/AccessStep';
import { VerifyStep } from './components/VerifyStep';
import { RegisterStep } from './components/RegisterStep';
import { ProgressIndicator } from './components/ProgressIndicator';
import { Header } from './components/Header';
import { Toaster } from './components/ui/sonner';
import { Loader } from './components/Loader';
import { CustomerData, Product, EnrichedItem, apiService, LocationInfo, CountryCode, QuoteData, RatesResponse, ShippingRate } from './services/api';
import { storage } from './services/storage';
import { envConfig } from './config/env';
import { ClubAccessComponent } from './components/ClubAccessComponent';

type Step = 'access' | 'verify' | 'register' | 'booking' | 'quote';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('access');
  const [contactInfo, setContactInfo] = useState('');
  const [userExists, setUserExists] = useState(false);
  const [currentProductList, setCurrentProductList] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState<string>('');
  const [enrichedItems, setEnrichedItems] = useState<EnrichedItem[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [countryCodes, setCountryCodes] = useState<CountryCode[] | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[] | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    products: true,
    location: true,
    asConfig: true,
  });

  // Helper to update loading state
  const setLoadingComplete = useCallback((key: keyof typeof loadingStates) => {
    setLoadingStates((prev) => {
      const updated = { ...prev, [key]: false };
      // Check if all loading is complete
      if (!updated.products && !updated.location && !updated.asConfig) {
        setIsInitialLoading(false);
      }
      return updated;
    });
  }, []);

  // Clear ITEMS_OWNER and ENRICHED_ITEMS on first app load only
  useEffect(() => {
    const hasBeenInitialized = storage.hasAppInitialized();
    
    if (!hasBeenInitialized) {
      // First time app load - clear the data
      storage.removeItemsOwner();
      storage.removeEnrichedItems();
      storage.removeContactInfo();
      // Mark that app has been initialized
      storage.setAppInitialized('true');
    }
  }, []);

  // Load all initial data in strict sequential order
  useEffect(() => {
    const loadInitialData = async () => {
      // 1. Load AS config (country codes) - cache-first
      const loadAsConfig = async () => {
        try {
          const cached = storage.getCountryCodes<CountryCode[]>();
          if (cached && cached.length) {
            setCountryCodes(cached);
            setLoadingComplete('asConfig');
            return;
          }
          const resp = await apiService.getAsConfig();
          if (resp?.data?.country_codes) {
            setCountryCodes(resp.data.country_codes);
            setLoadingComplete('asConfig');
          }
        } catch (e) {
          console.error('Error loading AS config:', e);
          setLoadingComplete('asConfig');
        }
      };

      // 2. Load IP-based location - cache-first
      const loadLocation = async () => {
        try {
          const cached = storage.getLocation<LocationInfo>();
          if (cached) {
            setCurrentLocation(cached);
            setLoadingComplete('location');
            return;
          }

          const resp = await apiService.getLocation();
          if (resp?.data) {
            setCurrentLocation(resp.data);
          }
          setLoadingComplete('location');
        } catch (e) {
          console.error('Error loading location:', e);
          setLoadingComplete('location');
        }
      };

      // 3. Load products - cache-first
      const loadProducts = async () => {
        try {
          setProductsError('');
          
          // Cache-first: check storage service
          const cachedProducts = storage.getProducts<Product[]>();
          if (cachedProducts && cachedProducts.length > 0) {
            setCurrentProductList(cachedProducts);
            setLoadingComplete('products');
            return;
          }

          // Fetch products from API
          const response = await apiService.getProducts();
          if (response.data && response.data.length > 0) {
            setCurrentProductList(response.data);
            // Cache for subsequent loads
            storage.setProducts<Product[]>(response.data);
          } else {
            setProductsError('No products available');
          }
          setLoadingComplete('products');
        } catch (error) {
          console.error('Error loading products:', error);
          setProductsError('Failed to load products');
          setLoadingComplete('products');
        }
      };

      // 4. Load quote and rates
      const loadQuoteAndRates = async () => {
        try {
          // Check for quote in storage
          const quote = storage.getQuote<QuoteData>();
          if (!quote) {
            return;
          }
          
          // Validate quote data has required fields
          if (!quote.from || !quote.to) {
            console.warn('Invalid quote data in storage');
            return;
          }

          // Always replace _bc_quotes with current _bc_quote
          storage.setQuotes(quote);

          setQuoteData(quote);
          setIsLoadingRates(true);
          setRatesError(null);

          // Prepare rates API payload
          const ratesPayload = {
            ship_from: {
              street1: quote.from.street1,
              city: quote.from.city,
              state: quote.from.state,
              postal_code: quote.from.postal_code,
              country: quote.from.country,
            },
            ship_to: {
              street1: quote.to.street1,
              city: quote.to.city,
              state: quote.to.state,
              postal_code: quote.to.postal_code,
              country: quote.to.country,
            },
            parcels: {
              item_id: envConfig.itemId,
              item_name: "Standard Golf bags",
              quantity: 1,
              dimensions: {
                depth: '14',
                height: '48',
                weight: '48',
                width: '14',
              },
            },
          };

          // Call rates API
          const ratesResponse = await apiService.calculateRates(ratesPayload);

          if (ratesResponse.data.success) {
            setShippingRates(ratesResponse.data.rates);
            setCurrentStep('quote');
          } else {
            const errorMessage = 'message' in ratesResponse.data 
              ? ratesResponse.data.message 
              : 'Failed to calculate rates';
            setRatesError(errorMessage);
            setCurrentStep('quote'); // Still show quote step to display error
          }
        } catch (error) {
          console.error('Error loading quote and rates:', error);
          setRatesError('Failed to load shipping rates. Please try again.');
        } finally {
          setIsLoadingRates(false);
        }
      };

      // Execute in strict sequential order
      await loadAsConfig();
      await loadLocation();
      await loadProducts();
      await loadQuoteAndRates();
    };

    loadInitialData();
  }, [setLoadingComplete]);

  // Load enriched items on app initialization (independent)
  useEffect(() => {
    const loadEnrichedItems = () => {
      const storedItems = apiService.getStoredEnrichedItems();
      if (storedItems) {
        setEnrichedItems(storedItems);
      }
    };

    loadEnrichedItems();
  }, []);

  const handleAccessSubmit = (contact: string) => {
    setContactInfo(contact);
    // Simulate sending OTP
    setCurrentStep('verify');
  };

  const handleVerifySubmit = (code: string, hasPartner: boolean) => {
    setUserExists(hasPartner);
    
    if (hasPartner) {
      // User is a partner - proceed to booking
      setCurrentStep('booking');
    } else {
      // No partner data - show registration
      setCurrentStep('register');
    }
  };

  const handleRegisterSubmit = (userData: any) => {
    // Simulate registration
    setCurrentStep('booking');
  };

  const handleQRSuccess = (customerData: CustomerData) => {
    // Handle successful QR code validation
    // Refresh enriched items from localStorage
    const updatedItems = apiService.getStoredEnrichedItems();
    if (updatedItems) {
      setEnrichedItems(updatedItems);
    }
    
    // You can store customer data in state or proceed to next step
    setCurrentStep('booking'); // Skip verification if QR code is valid
  };

  const handleBack = () => {
    if (currentStep === 'verify') {
      setCurrentStep('access');
    } else if (currentStep === 'register') {
      setCurrentStep('verify');
    }
  };

  
// Common method to redirect to booking page
const redirectToBooking = async () => {
  setCurrentStep('booking');
  
  // Create Klaviyo event before redirecting
  try {
    // Get contact info from storage
    const storedContactInfo = storage.getContactInfo<{ email?: string; phone?: string }>();
    
    // Get quote data (from state or storage)
    const quote = quoteData || storage.getQuote<QuoteData & { shipping_options?: { id: string; title: string } }>();
    
    // Build Klaviyo payload if we have the required data
    if (quote && quote.from && quote.to && currentLocation) {
      const shippingService = 'Standard';
      
      const klaviyoPayload = {
        email: storedContactInfo?.email,
        phone_number: storedContactInfo?.phone,
        from_city: quote.from.city || quote.from.name || '',
        to_city: quote.to.city || quote.to.name || '',
        shipping_service: shippingService,
        location: {
          ip: currentLocation.ip || '',
          latitude: parseFloat(currentLocation.location.latitude || '0'),
          longitude: parseFloat(currentLocation.location.longitude || '0'),
          city: currentLocation.location.city || '',
          country: currentLocation.location.country_name || '',
          zip: currentLocation.location.zipcode || '',
        },
      };

      // Call Klaviyo API before redirecting (with timeout to prevent blocking)
      const klaviyoPromise = apiService.createKlaviyoEvent(klaviyoPayload);
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second timeout
      
      await Promise.race([klaviyoPromise, timeoutPromise]).catch((error) => {
        console.error('Failed to create Klaviyo event:', error);
      });
    }
  } catch (error) {
    console.error('Error preparing Klaviyo event:', error);
    // Continue with redirect even if Klaviyo fails
  }

  storage.removeQuote();
  storage.removeAppInitialized();
  const redirectUrl = `${envConfig.websiteUrl}/club/?${envConfig.bagCaddieCode}`;
  window.location.href = redirectUrl;
};
  // Redirect to booking page when step is 'booking'
  useEffect(() => {
    if (currentStep === 'booking') {
      // Clear app initialization flag before redirect      
      redirectToBooking();
    }
  }, [currentStep]);

  // Show quote view if quote data exists
  if (currentStep === 'quote' && quoteData && shippingRates) {
    return (
      <div className="min-h-screen bg-white">
        <Loader isLoading={isLoadingRates} />
        <Toaster position="top-right" />
        <ClubAccessComponent
          entryMode="QuickQuote"
          from={quoteData.from.name || quoteData.from.address}
          to={quoteData.to.name || quoteData.to.address}
          rates={shippingRates}
          quoteData={quoteData}
          onComplete={handleAccessSubmit}
          onQRSuccess={handleQRSuccess}
          redirectToBooking={redirectToBooking}
        />
      </div>
    );
  }

  // Show error if rates failed to load
  if (currentStep === 'quote' && ratesError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 text-xl font-semibold mb-2">Unable to Load Rates</h2>
            <p className="text-red-600 mb-4">{ratesError}</p>
            <button
              onClick={() => setCurrentStep('access')}
              className="bg-[#C8A654] text-white px-6 py-2 rounded-lg hover:bg-[#B89544] transition-colors"
            >
              Continue to Access
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
       {/* Header */}
       <Header destination={quoteData?.to?.name || quoteData?.to?.address} />
      <Loader isLoading={isInitialLoading || isLoadingRates} />
      <Toaster  position="top-right"/>
      {productsError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm text-center">
              {productsError}
            </p>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <ProgressIndicator 
          currentStep={currentStep === 'access' || currentStep === 'verify' || currentStep === 'register' ? 1 : currentStep === 'booking' ? 3 : 1} 
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
        <div className=" mx-auto" style={{ maxWidth: '480px' }}>
          {currentStep === 'access' && (
            <>
              <AccessStep onSubmit={handleAccessSubmit} onQRSuccess={handleQRSuccess} />
            </>
          )}
          
          {currentStep === 'verify' && (
            <VerifyStep 
              contactInfo={contactInfo}
              onSubmit={handleVerifySubmit}
              onBack={handleBack}
              redirectToBooking={redirectToBooking}
            />
          )}
          
          {currentStep === 'register' && (
            <RegisterStep 
              contactInfo={contactInfo}
              onSubmit={handleRegisterSubmit}
              onBack={handleBack}
              products={currentProductList}
            />
          )}
          
          {currentStep === 'booking' && (
            <div className="text-center py-8 sm:py-12 px-4">
              <div className="mb-4 sm:mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-[#C8A654] flex items-center justify-center">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="mb-3">Access Verified!</h2>
              <p className="text-gray-600 mb-6 sm:mb-8">
                You're all set. Proceeding to the booking page...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

import { useState, useEffect, useCallback, useRef } from 'react';
import { AccessStep } from './components/AccessStep';
import { type TabType } from './components/AccessTabs';
import { VerifyModal } from './components/VerifyModal';
import { RegisterStep } from './components/RegisterStep';
import { ProgressIndicator } from './components/ProgressIndicator';
import { Header } from './components/Header';
import { Toaster } from './components/ui/sonner';
import { Loader } from './components/Loader';
import { CustomerData, Product, EnrichedItem, apiService, LocationInfo, CountryCode, QuoteData, RatesResponse, ShippingRate, AsConfigData, PlaceDetailsResponse, QuoteLocation, EventResponse, EventMetaObject } from './services/api';
import { generateEventQuote, storeEventData } from './services/quoteUtils';
import { storage, storageService } from './services/storage';
import { envConfig } from './config/env';
import { ClubAccessComponent } from './components/ClubAccessComponent';
import { InternationalAddressModal } from './components/InternationalAddressModal';
import { EventHero } from './components/EventHero';


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
  const [asConfigData, setAsConfigData] = useState<AsConfigData | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[] | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isInternationalModalOpen, setIsInternationalModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [eventData, setEventData] = useState<EventMetaObject | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventPartnerLogo, setEventPartnerLogo] = useState<string | null>(null);
  const [eventPartnerDisplayName, setEventPartnerDisplayName] = useState<string | null>(null);
  const eventLoadingRef = useRef(false); // Prevent duplicate API calls
  const loadedEventIdRef = useRef<string | null>(null); // Track which event ID we've loaded
  const defaultTab: TabType = 'mobile';
  const [loadingStates, setLoadingStates] = useState({
    products: true,
    location: true,
    asConfig: true,
    event: false,
  });

  // Helper to update loading state
  const setLoadingComplete = useCallback((key: keyof typeof loadingStates) => {
    setLoadingStates((prev) => {
      const updated = { ...prev, [key]: false };
      // Check if all loading is complete (excluding event which loads separately)
      if (!updated.products && !updated.location && !updated.asConfig) {
        setIsInitialLoading(false);
      }
      return updated;
    });
  }, []);

  // Handle query parameters: mode (login/quote/event) and event (EventId)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const eventId = urlParams.get('event');

    // If no query parameters exist, add mode=login
    if (urlParams.toString() === '') {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('mode', 'login');
      window.history.replaceState({}, '', newUrl.toString());
    } else if (!mode && !eventId) {
      // If no mode but has other params, assume mode=login
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('mode', 'login');
      window.history.replaceState({}, '', newUrl.toString());
    } else if (eventId && mode !== 'event') {
      // If event ID exists but mode is not 'event', set mode=event
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('mode', 'event');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  // Clear ITEMS_OWNER and ENRICHED_ITEMS on first app load only
  useEffect(() => {
    const hasBeenInitialized = storage.hasAppInitialized();

    if (!hasBeenInitialized) {
      // First time app load - clear the data
      storage.clearLocalStorage();
      // Mark that app has been initialized
      storage.setAppInitialized('true');
    }
  }, []);

  // Load all initial data in strict sequential order
  useEffect(() => {
    const loadInitialData = async () => {
      // 1. Load AS config (country codes) - cache-first
      // Only call API once, even if country codes are cached
      const loadAsConfig = async () => {
        try {
          const cached = storage.getCountryCodes<CountryCode[]>();
          if (cached && cached.length) {
            setCountryCodes(cached);
          }

          // Always fetch AS config to get latest data (including rates config)
          // This ensures we have the full config for shipping service determination
          const resp = await apiService.getAsConfig();
          if (resp?.data) {
            setAsConfigData(resp.data);
            // Update country codes if not already set from cache
            if (!cached && resp.data.country_codes) {
              setCountryCodes(resp.data.country_codes);
            }
          }
          setLoadingComplete('asConfig');
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
          // Check for mode=quote query parameter
          const urlParams = new URLSearchParams(window.location.search);
          const mode = urlParams.get('mode');
          const pickup = urlParams.get('pickup');
          const destination = urlParams.get('destination');

          let quote: QuoteData | null = null;

          // Check if we have pickup and destination URL params
          if (mode === 'quote' && pickup && destination) {
            // Call place-details API for both pickup and destination
            setIsLoadingRates(true);
            setRatesError(null);

            try {
              const [pickupResponse, destinationResponse] = await Promise.all([
                apiService.getPlaceDetails(pickup),
                apiService.getPlaceDetails(destination)
              ]);

              // Parse address components for both locations
              const pickupAddress = apiService.parseAddressComponents(pickupResponse.data.addressComponents);
              const destinationAddress = apiService.parseAddressComponents(destinationResponse.data.addressComponents);

              // Build QuoteLocation objects
              const fromLocation: QuoteLocation = {
                id: '',
                name: pickupResponse.data.displayName.text || pickup,
                street1: pickupAddress.street1 || pickupResponse.data.formattedAddress,
                city: pickupAddress.city,
                state: pickupAddress.state,
                postal_code: pickupAddress.postal_code,
                country: pickupAddress.country || 'US',
                type: 'location',
                placeId: '',
                source: 'url',
                address: pickupResponse.data.formattedAddress,
              };

              const toLocation: QuoteLocation = {
                id: '',
                name: destinationResponse.data.displayName.text || destination,
                street1: destinationAddress.street1 || destinationResponse.data.formattedAddress,
                city: destinationAddress.city,
                state: destinationAddress.state,
                postal_code: destinationAddress.postal_code,
                country: destinationAddress.country || 'US',
                type: 'location',
                placeId: '',
                source: 'url',
                address: destinationResponse.data.formattedAddress,
              };

              quote = {
                from: fromLocation,
                to: toLocation,
              };

              // Store quote data
              storage.setQuotes(quote);
              setQuoteData(quote);
            } catch (error) {
              console.error('Error fetching place details:', error);
              setRatesError('Failed to load location details. Please try again.');
              setIsLoadingRates(false);
              return;
            }
          } else {
            // Fallback to storage quote if no URL params
            quote = storage.getQuote<QuoteData>();
            if (mode !== 'quote' || !quote) {
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
          }

          // Check if either from or to country is non-USA
          const isFromNonUSA = quote.from.country &&
            quote.from.country.toUpperCase() !== 'US' &&
            quote.from.country.toUpperCase() !== 'USA';
          const isToNonUSA = quote.to.country &&
            quote.to.country.toUpperCase() !== 'US' &&
            quote.to.country.toUpperCase() !== 'USA';

          if (isFromNonUSA || isToNonUSA) {
            // Show international address modal
            setIsInternationalModalOpen(true);
            setIsLoadingRates(false);
            return; // Don't proceed with rates calculation
          }

          setIsLoadingRates(true);
          setRatesError(null);

          // Prepare rates API payload
          const ratesPayload = {
            ship_from: {
              street1: quote.from.street1 || quote.from.name,
              city: quote.from.city,
              state: quote.from.state,
              postal_code: quote.from.postal_code,
              country: quote.from.country,
            },
            ship_to: {
              street1: quote.to.street1 || quote.to.name,
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
            setShippingRates([]);
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

  // Load event data when mode=event and event ID is present
  useEffect(() => {
    const loadEventData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const eventId = urlParams.get('event');

      // Prevent duplicate calls: check if already loading or if we've already loaded this event
      if (eventLoadingRef.current || (eventId && loadedEventIdRef.current === eventId)) {
        return;
      }

      if (mode === 'event' && eventId) {
        // Set loading flag to prevent duplicate calls
        eventLoadingRef.current = true;
        loadedEventIdRef.current = eventId;
        setIsLoadingEvent(true);
        setEventError(null);
        setLoadingStates(prev => ({ ...prev, event: true }));
        try {
          const response = await apiService.getEvent({ event_id: eventId });
          if (response.data.success) {
            const successResponse = response.data as { success: true; message: string; events: EventMetaObject };
            if (successResponse.events) {
              setEventData(successResponse.events);

              // Store event data with specified fields
              storeEventData(successResponse.events, eventId);

              // Extract customer ID from club field and fetch partner logo
              const clubField = successResponse.events.fields.find(f => f.key === 'club');
              if (clubField?.value) {
                // Extract customer ID number from GID format: "gid://shopify/Customer/8199091683544"
                const customerIdMatch = clubField.value.match(/\/Customer\/(\d+)$/);
                if (customerIdMatch && customerIdMatch[1]) {
                  const customerId = customerIdMatch[1];
                  try {
                    const partnerResponse = await apiService.getPartner({ id: customerId });
                    if (partnerResponse.data.success && partnerResponse.data.data) {
                      const partnerData = partnerResponse.data.data;

                      // Store partner data in CLUB_PARTNER
                      storageService.setItem('CLUB_PARTNER', partnerData);

                      if (partnerData.logo) {
                        setEventPartnerLogo(partnerData.logo);
                      }
                      if (partnerData.displayName) {
                        setEventPartnerDisplayName(partnerData.displayName);
                      }
                    }
                  } catch (partnerError) {
                    console.error('Error loading partner logo:', partnerError);
                    // Don't fail the event load if partner logo fails
                  }
                }
              }
            } else {
              setEventError(successResponse.message || 'Failed to load event details');
            }
          } else {
            setEventError(response.data.message || 'Failed to load event details');
          }
        } catch (error) {
          console.error('Error loading event:', error);
          setEventError('Failed to load event details. Please try again.');
          // Reset loaded event ID on error so we can retry
          loadedEventIdRef.current = null;
        } finally {
          setIsLoadingEvent(false);
          setLoadingStates(prev => ({ ...prev, event: false }));
          eventLoadingRef.current = false;
        }
      }
    };

    loadEventData();
  }, []); // Empty dependency array - only run once on mount

  const handleAccessSubmit = (contact: string) => {
    setContactInfo(contact);
    // Open verification modal instead of changing step
    setIsVerifyModalOpen(true);
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

    // If we have event data, generate quote from customer address to event destination
    if (eventData) {
      generateEventQuote(eventData, customerData);
    }

    // You can store customer data in state or proceed to next step
    setCurrentStep('booking'); // Skip verification if QR code is valid
  };

  const handleBack = () => {
    if (currentStep === 'register') {
      // If on register step, go back to access
      setCurrentStep('access');
    }
    // For verify modal, it's handled by the modal's onClose
  };


  // Common method to redirect to booking page
  const redirectToBooking = async () => {
    setIsVerifyModalOpen(false);
    setCurrentStep('booking');

    // Create Klaviyo event before redirecting
    try {
      // Get contact info from storage
      const storedContactInfo = storage.getContactInfo<{ email?: string; phone?: string }>();

      // Get quote data (from state or storage)
      const quote = quoteData || storage.getQuote<QuoteData & { shipping_options?: { id: string; title: string } }>();

      // Build Klaviyo payload if we have the required data and we're in production
      if (envConfig.env === 'production' && quote && quote.from && quote.to && currentLocation) {
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
    // Only remove items owner if we have event data
    if (eventData) {
      storage.removeItemsOwner();
    }

    // Determine which code to use for redirect
    let redirectCode = envConfig.bagCaddieCode;
    let redirectUrl = `${envConfig.websiteUrl}/club/?${redirectCode}`;
    // Get quote data (from state or storage)
    const quote = quoteData || storage.getQuote<QuoteData & { shipping_options?: { id: string; title: string } }>();
    if (eventData) {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const eventId = urlParams.get('event');
      if (mode === 'event' && eventId) {
        redirectUrl = `${envConfig.websiteUrl}/pages/scanner/?event=${eventId}`;
      }
    } else if (quote && quote.from && quote.to) {
      redirectUrl = `${envConfig.websiteUrl}/pages/scanner/`;
    }
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
          ratesError={ratesError}
          entryMode="QuickQuote"
          from={quoteData.from.name || quoteData.from.address}
          to={quoteData.to.name || quoteData.to.address}
          rates={shippingRates}
          quoteData={quoteData}
          asConfigData={asConfigData}
          onComplete={handleAccessSubmit}
          onQRSuccess={handleQRSuccess}
          redirectToBooking={redirectToBooking}
          defaultTab={defaultTab}
        />
      </div>
    );
  }

  // Get current mode from URL
  const getCurrentMode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode');
  };

  // Only show event banner if we have valid event data
  const shouldShowEventBanner = eventData !== null && eventData !== undefined && !isLoadingEvent && !eventError;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      {/* Event Hero Section - Only display if we have valid event data */}
      {(shouldShowEventBanner && eventData) ? (
        <EventHero
          eventData={eventData}
          partnerLogo={eventPartnerLogo}
          partnerDisplayName={eventPartnerDisplayName}
        />
      ) : (
        <Header destination={quoteData?.to?.name || quoteData?.to?.address} />
      )}
      <Loader isLoading={isInitialLoading || isLoadingRates || isLoadingEvent} />

      <Toaster position="top-right" />
      {eventError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm text-center">
              {eventError}
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
        <div className="mx-auto" style={{ maxWidth: '500px' }}>
          {currentStep === 'access' && (
            <>
              <AccessStep onSubmit={handleAccessSubmit} onQRSuccess={handleQRSuccess} defaultTab={defaultTab} />
              {/* <HelpfulTipsCard /> */}
            </>
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
          {/* International Address Modal */}
          <InternationalAddressModal
            isOpen={isInternationalModalOpen}
            onClose={() => {
              setIsInternationalModalOpen(false);
              // Clear the quote so user can start fresh
              storage.removeQuote();
              setQuoteData(null);
            }}
          />

          {/* Verify Modal */}
          <VerifyModal
            isOpen={isVerifyModalOpen}
            onClose={() => {
              setIsVerifyModalOpen(false);
            }}
            contactInfo={contactInfo}
            onSubmit={handleVerifySubmit}
            redirectToBooking={redirectToBooking}
            eventData={eventData}
          />
        </div>
      </main>
    </div>
  );
}

export default App;

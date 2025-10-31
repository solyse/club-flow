import { useState, useEffect, useCallback } from 'react';
import { AccessStep } from './components/AccessStep';
import { VerifyStep } from './components/VerifyStep';
import { RegisterStep } from './components/RegisterStep';
import { ProgressIndicator } from './components/ProgressIndicator';
import { HelpfulTipsCard } from './components/HelpfulTipsCard';
import { Header } from './components/Header';
import { Toaster } from './components/ui/sonner';
import { Loader } from './components/Loader';
import { CustomerData, Product, EnrichedItem, apiService, LocationInfo, CountryCode } from './services/api';
import { storage } from './services/storage';
import { envConfig } from './config/env';

type Step = 'access' | 'verify' | 'register' | 'booking';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('access');
  const [contactInfo, setContactInfo] = useState('');
  const [userExists, setUserExists] = useState(false);
  const [currentProductList, setCurrentProductList] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState<string>('');
  const [enrichedItems, setEnrichedItems] = useState<EnrichedItem[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [countryCodes, setCountryCodes] = useState<CountryCode[] | null>(null);
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
    const APP_INITIALIZED_KEY = '_bc_app_initialized';
    const hasBeenInitialized = localStorage.getItem(APP_INITIALIZED_KEY);
    
    if (!hasBeenInitialized) {
      // First time app load - clear the data
      storage.removeItemsOwner();
      storage.removeEnrichedItems();
      // Mark that app has been initialized
      localStorage.setItem(APP_INITIALIZED_KEY, 'true');
    }
  }, []);

  // Load products on app initialization
  useEffect(() => {
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
      } catch (error) {
        console.error('Error loading products:', error);
        setProductsError('Failed to load products');
      } finally {
        setLoadingComplete('products');
      }
    };

    loadProducts();
  }, [setLoadingComplete]);

  // Load enriched items on app initialization
  useEffect(() => {
    const loadEnrichedItems = () => {
      const storedItems = apiService.getStoredEnrichedItems();
      if (storedItems) {
        setEnrichedItems(storedItems);
      }
    };

    loadEnrichedItems();
  }, []);

  // Load IP-based location on app initialization (use cache first)
  useEffect(() => {
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
      } catch (e) {
        // ignore
      } finally {
        setLoadingComplete('location');
      }
    };
    loadLocation();
  }, [setLoadingComplete]);

  // Load AS config (country codes) on app initialization (cache-first)
  useEffect(() => {
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
        }
      } catch (e) {
        // ignore
      } finally {
        setLoadingComplete('asConfig');
      }
    };
    loadAsConfig();
  }, [setLoadingComplete]);

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

  // Redirect to booking page when step is 'booking'
  useEffect(() => {
    if (currentStep === 'booking') {
      // Clear app initialization flag before redirect
      localStorage.removeItem('_bc_app_initialized');
      const redirectUrl = `${envConfig.websiteUrl}/club/?${envConfig.bagcaddieCode}`;
      window.location.href = redirectUrl;
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-white">
      <Loader isLoading={isInitialLoading} />
      <Toaster />
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
        <div className="max-w-[480px] mx-auto">
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

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Smartphone, Plane, Clock, Truck, MapPin, Flag, Mail, Phone, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BcClubIcon } from './ui/BcClubIcon';
import { PhoneInput } from './ui/PhoneInput';
import { usePhoneValidation } from './usePhoneValidation';
import { toast } from 'sonner';
import { getHeroImage } from '../data/heroImages';
import { ShippingRate, QuoteData, CustomerData, apiService, LocationInfo, AsConfigData } from '../services/api';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { envConfig } from '../config/env';
import { storage } from '../services/storage';
import { WelcomeHeading } from './WelcomeHeading';
import { QRScanModal } from './QRScanModal';
import { RegisterStep } from './RegisterStep';
import { Product } from '../services/api';
import { RateFallback } from './RateFallback';
interface ClubAccessComponentProps {
  ratesError?: string;
  entryMode: 'QuickQuote' | 'StartJourney';
  from?: string;
  to?: string;
  rates?: ShippingRate[];
  quoteData?: QuoteData;
  asConfigData?: AsConfigData | null;
  onComplete?: (contactInfo: string) => void;
  onQRSuccess?: (customerData: CustomerData) => void;
  redirectToBooking?: () => void | Promise<void>;
}

interface ShippingOption {
  id: 'overnight' | 'expedited' | 'standard';
  icon: typeof Plane;
  title: string;
  subtitle: string;
  price: string;
  duration: string;
  shipperInfo?: any;
}

// Helper to map service types to icons and categories
const getServiceIcon = (serviceType: string): typeof Plane => {
  if (serviceType.includes('overnight') || serviceType.includes('first')) {
    return Plane;
  }
  if (serviceType.includes('2_day') || serviceType.includes('expedited')) {
    return Clock;
  }
  return Truck;
};

// Helper to format transit time
const formatTransitTime = (transitTime: number): string => {
  if (transitTime === 1) {
    return '1 Business Day';
  }
  return `${transitTime} Business Days`;
};

// Helper to format price
const formatPrice = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to process shipping rates
const processShippingRates = (
  rates: ShippingRate[],
  isDomestic: boolean,
  shippingService: string
): {
  prices: { standard: number; expedited: number; overnight: number };
  shipperInfo: {
    standard: any;
    expedited: any;
    overnight: any;
  };
  vip_discount: {
    standard: number | null;
    expedited: number | null;
    overnight: number | null;
  };
} => {
  const prices = {
    standard: 0,
    expedited: 0,
    overnight: 0,
  };

  const vip_discount = {
    standard: null as number | null,
    expedited: null as number | null,
    overnight: null as number | null,
  };

  const shipperInfo = {
    standard: {} as any,
    expedited: {} as any,
    overnight: {} as any,
  };
  if (isDomestic) {
    // Process domestic rates
    const serviceTypes =
      shippingService.toLowerCase() === 'ups'
        ? {
          standard: 'ups_ground',
          expedited: 'ups_3_day_select',
          overnight: ['ups_next_day_air_saver', 'ups_next_day_air'],
        }
        : {
          standard: 'fedex_ground',
          expedited: 'fedex_2_day',
          overnight: ['fedex_standard_overnight', 'fedex_priority_overnight'],
        };

    // Find and process each service type
    Object.entries(serviceTypes).forEach(([service, type]) => {
      const rate = Array.isArray(type)
        ? rates.find((r) => type.includes(r.service_type))
        : rates.find((r) => r.service_type === type);

      if (rate && rate.bc_actual_costs && rate.bc_actual_costs.amount !== undefined && rate.bc_actual_costs.amount !== null) {
        const amount = parseFloat(String(rate.bc_actual_costs.amount));
        if (!isNaN(amount) && amount > 0) {
          prices[service as keyof typeof prices] = amount;
          vip_discount[service as keyof typeof vip_discount] =
            (rate.bc_actual_costs as any).vip_discount || null;
          shipperInfo[service as keyof typeof shipperInfo] = {
            shipper_id: rate.shipper_account.id,
            service_name: rate.service_name,
            service_type: rate.service_type,
            charge_weight: rate.charge_weight,
            detailed_charges: rate.detailed_charges,
            total_charge: rate.total_charge,
            delivery_date: rate.delivery_date,
            transit_time: rate.transit_time,
          };
        }
      }
    });
  } else {
    // Process international rates
    const rate = rates[0];
    if (rate && rate.bc_actual_costs && rate.bc_actual_costs.amount !== undefined && rate.bc_actual_costs.amount !== null) {
      const amount = parseFloat(String(rate.bc_actual_costs.amount));
      if (!isNaN(amount) && amount > 0) {
        prices.standard = amount;
        prices.expedited = amount;
        prices.overnight = amount;
        vip_discount.standard = (rate.bc_actual_costs as any).vip_discount || null;
        vip_discount.expedited = (rate.bc_actual_costs as any).vip_discount || null;
        vip_discount.overnight = (rate.bc_actual_costs as any).vip_discount || null;
        const shipperData = {
          shipper_id: rate.shipper_account.id,
          service_type: rate.service_type,
          service_name: rate.service_name,
          charge_weight: rate.charge_weight,
          detailed_charges: rate.detailed_charges,
          total_charge: rate.total_charge,
          delivery_date: rate.delivery_date,
          transit_time: rate.transit_time,
        };
        shipperInfo.standard = shipperData;
        shipperInfo.expedited = shipperData;
        shipperInfo.overnight = shipperData;
      }
    }
  }

  return { prices, shipperInfo, vip_discount };
};

export function ClubAccessComponent({
  ratesError,
  entryMode,
  from,
  to,
  rates,
  quoteData,
  asConfigData,
  onComplete,
  onQRSuccess,
  redirectToBooking
}: ClubAccessComponentProps) {
  const [contact, setContact] = useState('');
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [error, setError] = useState<string>('');
  const [showQRScan, setShowQRScan] = useState(false);
  const [inputMode, setInputMode] = useState<'mobile' | 'email'>('mobile');
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [contactInfo, setContactInfo] = useState('');
  const [showRegisterStep, setShowRegisterStep] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [customTransit, setCustomTransit] = useState<{
    standard: number;
    expedited: number;
    overnight: number;
  }>({
    standard: 5,
    expedited: 2,
    overnight: 1,
  });
  const [localRatesError, setLocalRatesError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get location from storage and extract calling code
  const location = storage.getLocation<LocationInfo>();
  const callingCode = location?.country_metadata?.calling_code || '+1';
  const phone = usePhoneValidation(callingCode);
  // Auto-focus the input field when component mounts
  useEffect(() => {
    if (inputRef.current && !showOtpVerification) {
      inputRef.current.focus();
    }
  }, [showOtpVerification]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0 && showOtpVerification) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer, showOtpVerification]);

  // Load products from storage
  useEffect(() => {
    const loadProducts = () => {
      const cachedProducts = storage.getProducts<Product[]>();
      if (cachedProducts && cachedProducts.length > 0) {
        setProducts(cachedProducts);
      }
    };
    loadProducts();
  }, []);

  // Process rates and generate shipping options
  useEffect(() => {
    const generateShippingOptions = async () => {
      if (!rates || rates.length === 0) {
        setShippingOptions([]);
        setLocalRatesError('No shipping rates available');
        return;
      }

      try {
        // Use AS config from props (loaded once in App.tsx)
        const shippingService =
          (asConfigData?.rates as any)?.shipping_service || 'fedex';

        // Determine if shipping is domestic (same country)
        const isDomestic =
          quoteData?.from?.country === quoteData?.to?.country &&
          quoteData?.from?.country?.toUpperCase() === 'US';

        // Process rates
        const { prices, shipperInfo, vip_discount } = processShippingRates(
          rates,
          isDomestic,
          shippingService
        );

        // Validate that all three service types have valid prices
        const missingServices: string[] = [];
        
        // Check standard service - validate price and that rate was found
        const isStandardValid = 
          prices.standard !== undefined &&
          prices.standard !== null &&
          !isNaN(prices.standard) &&
          prices.standard > 0 &&
          Object.keys(shipperInfo.standard).length > 0;
        
        if (!isStandardValid) {
          missingServices.push('standard');
        }

        // Check expedited service - validate price and that rate was found
        const isExpeditedValid = 
          prices.expedited !== undefined &&
          prices.expedited !== null &&
          !isNaN(prices.expedited) &&
          prices.expedited > 0 &&
          Object.keys(shipperInfo.expedited).length > 0;
        
        if (!isExpeditedValid) {
          missingServices.push('expedited');
        }

        // Check overnight service - validate price and that rate was found
        const isOvernightValid = 
          prices.overnight !== undefined &&
          prices.overnight !== null &&
          !isNaN(prices.overnight) &&
          prices.overnight > 0 &&
          Object.keys(shipperInfo.overnight).length > 0;
        
        if (!isOvernightValid) {
          missingServices.push('overnight');
        }

        // If any service is missing or has invalid price, set error
        if (missingServices.length > 0) {
          const serviceNames = missingServices.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
          setLocalRatesError(`Unable to calculate rates for ${serviceNames} service${missingServices.length > 1 ? 's' : ''}. Please try again.`);
          setShippingOptions([]);
          return;
        }

        // Clear any previous error if all prices are valid
        setLocalRatesError(null);

        // Get transit times (use processed values or defaults)
        const transitTimes = {
          standard: shipperInfo.standard.transit_time || 5,
          expedited: shipperInfo.expedited.transit_time || 2,
          overnight: shipperInfo.overnight.transit_time || 1,
        };

        // Update custom transit times
        setCustomTransit(transitTimes);

        // Helper to format duration
        const formatDuration = (transitTime: number): string => {
          return transitTime === 1
            ? '1 Business Day'
            : `${transitTime} Business Days`;
        };

        // Generate shipping options array
        const options: ShippingOption[] = [
          {
            id: 'overnight',
            icon: Plane,
            title: 'Overnight',
            price: prices.overnight > 0 ? formatPrice(prices.overnight) : '$0',
            subtitle: 'Fastest Delivery',
            duration: '1 Business Day',
            shipperInfo: shipperInfo.overnight,
          },
          {
            id: 'expedited',
            icon: Clock,
            title: 'Expedited',
            price: prices.expedited > 0 ? formatPrice(prices.expedited) : '$0',
            subtitle: 'Best Value',
            duration: '2 Business Days',
            shipperInfo: shipperInfo.expedited,
          },
          {
            id: 'standard',
            icon: Truck,
            title: 'Standard',
            price: prices.standard > 0 ? formatPrice(prices.standard) : '$0',
            subtitle: 'Most Economical',
            duration: '3–6 Business Days',
            shipperInfo: shipperInfo.standard,
          },
        ];

        setShippingOptions(options);
      } catch (error) {
        console.error('Error generating shipping options:', error);
        setShippingOptions([]);
        setLocalRatesError('Failed to process shipping rates. Please try again.');
      }
    };

    if (entryMode === 'QuickQuote' && rates) {
      generateShippingOptions();
    }
  }, [rates, quoteData, entryMode, asConfigData]);

  const validateEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);

  // Compute form validity based on current mode
  const isFormValid = isEmailMode
    ? contact.trim() !== '' && validateEmail(contact.trim())
    : phone.isValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const raw = contact.trim();
    if (isEmailMode) {
      if (!raw) return;
      if (!validateEmail(raw)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    setIsLoading(true);
    setOtpError('');

    try {
      // For mobile, if no country code is provided, add +1 (US) as default
      // let phoneValue = raw.trim();
      // if (!isEmailMode && !phoneValue.startsWith('+')) {
      //   phoneValue = `+1${phoneValue}`;
      // }
      const normalizedPhone = !isEmailMode ? phone.value : '';
      const payload = isEmailMode
        ? { email: raw }
        : { phone: normalizedPhone };

      // Try to get partner first
      const partnerResp = await apiService.getPartner(payload);
      const partnerSuccess = (partnerResp as any)?.data?.success === true;
      const partner = partnerSuccess ? (partnerResp as any).data.data : null;

      // Send OTP
      const otpPayload = {
        type: isEmailMode ? 'email' as const : 'phone' as const,
        first_name: partner?.firstName || 'User',
        last_name: partner?.lastName || '',
        email: isEmailMode ? raw : undefined,
        phone: !isEmailMode ? normalizedPhone : undefined,
      };

      const otpResp = await apiService.sendOtp(otpPayload);
      const otpSuccess = (otpResp as any)?.data?.success === true;

      if (otpSuccess) {
        // Store selected shipping option in quote (only for QuickQuote mode)        
        if (entryMode === 'QuickQuote' && selectedShippingOption) {
          try {
            const quote = storage.getQuote<QuoteData>();
            if (quote) {
              (quote as any).shipping_options = selectedShippingOption;
              storage.setQuote(quote);
            }
          } catch (error) {
            console.error('Error updating quote with shipping option:', error);
          }
        }

        toast.success('Verification code sent!');
        setContactInfo(isEmailMode ? raw : normalizedPhone);
        setShowOtpVerification(true);
        setResendTimer(30);
        setCanResend(false);
      } else {
        setOtpError((otpResp as any)?.data?.message || 'Failed to send verification code.');
        toast.error((otpResp as any)?.data?.message || 'Failed to send verification code.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOtpError('Unable to send verification code. Please try again.');
      toast.error('Unable to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpCode.length !== 6) {
      setOtpError('Please enter a 6-digit code.');
      return;
    }

    setIsVerifying(true);
    setOtpError('');

    try {
      const isEmail = contactInfo.includes('@');
      const payload = {
        code: otpCode,
        email: isEmail ? contactInfo : undefined,
        phone: !isEmail ? contactInfo : undefined,
      };

      const resp = await apiService.verifyAuth(payload);
      const ok = (resp as any)?.data?.success === true;

      if (ok) {
        toast.success('Code verified successfully');
        // Check if partner exists
        let hasPartner = false;
        let partnerData = null;
        try {
          const partnerPayload = isEmail
            ? { email: contactInfo }
            : { phone: contactInfo };

          const partnerResp = await apiService.getPartner(partnerPayload);
          hasPartner = (partnerResp as any)?.data?.success === true;

          // If partner exists, store itemsOwner and enrich items
          if (hasPartner) {
            partnerData = (partnerResp as any).data.data;
            if (partnerData) {
              storage.setItemsOwner(partnerData);
              // If partner has items, enrich and store them
              if (partnerData.items && partnerData.items.length > 0) {
                try {
                  await apiService.processAndStorePartnerItems(partnerData);
                } catch (err) {
                  console.error('Error enriching partner items:', err);
                  // Continue even if enrichment fails
                }
              }
            }
          }
          //store the partner data in localStorage
          storage.setContactInfo(partnerPayload);
          redirectToBooking();
        } catch (partnerErr) {
          // If partner check fails, assume no partner
          console.error('Error checking partner:', partnerErr);
          hasPartner = false;
        }

      } else {
        setOtpError((resp as any)?.data?.message || 'Invalid verification code');
        toast.error((resp as any)?.data?.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpError('Unable to verify code. Please try again.');
      toast.error('Unable to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setOtpError('');

    try {
      const isEmail = contactInfo.includes('@');
      const partnerPayload = isEmail
        ? { email: contactInfo }
        : { phone: contactInfo };

      const partnerResp = await apiService.getPartner(partnerPayload);
      const partner = (partnerResp as any)?.data?.success === true
        ? (partnerResp as any).data.data
        : null;

      const otpPayload = {
        type: isEmail ? 'email' as const : 'phone' as const,
        first_name: partner?.firstName || 'User',
        last_name: partner?.lastName || '',
        email: isEmail ? contactInfo : undefined,
        phone: !isEmail ? contactInfo : undefined,
      };

      const otpResp = await apiService.sendOtp(otpPayload);
      const otpSuccess = (otpResp as any)?.data?.success === true;

      if (otpSuccess) {
        toast.success('Verification code resent!');
        setResendTimer(30);
        setCanResend(false);
        setOtpCode('');
      } else {
        setOtpError((otpResp as any)?.data?.message || 'Failed to resend verification code.');
        toast.error((otpResp as any)?.data?.message || 'Failed to resend verification code.');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setOtpError('Unable to resend verification code. Please try again.');
      toast.error('Unable to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Conditional content based on entry mode
  const content = {
    QuickQuote: {
      header: 'Confirm your trip details',
      subheading: 'New or returning member — verify once and travel with ease.',
      ctaText: 'Continue to Booking',
      helperText: "We'll save your quote and take you directly to your booking, where you'll confirm your preferred service.",
    },
    StartJourney: {
      header: 'Welcome to BagCaddie Club',
      subheading: 'Enter your mobile number to verify and continue.',
      ctaText: 'Continue Your Journey',
      helperText: "You'll be able to plan and book your next trip with ease.",
    },
  };

  const currentContent = content[entryMode];
  const showQuoteCards = entryMode === 'QuickQuote';
  // Get the hero image based on the destination
  const heroImageUrl = to ? getHeroImage(to) : getHeroImage('');
  if (entryMode === 'QuickQuote') {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Hero Section with Background Image */}
        <div className="relative h-[60vh] min-h-[500px] w-full overflow-visible">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImageUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
            <div className="max-w-5xl mx-auto w-full flex justify-center">
              {/* Location Display with Translucent Background */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-black/30 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/20">
                  {/* From Location */}
                  <div className="flex items-center gap-3 mb-4">
                    {quoteData?.from?.source === 'bc_club' ? (
                      <BcClubIcon type="BcClub" strokeWidth={1} size={30} color="currentColor" className="w-7 h-7 text-white" />
                    ) :
                      quoteData?.from?.type === 'club' ? (
                        <BcClubIcon type="GolfClub" strokeWidth={1} size={30} color="#FFFFFF" className="w-7 h-7 text-white" />
                      ) : (
                        <MapPin className="w-7 h-7 text-white" strokeWidth={2} />
                      )}
                    <h1
                      className="text-white"
                      style={{
                        fontSize: 'clamp(28px, 4vw, 48px)',
                        fontWeight: 400,
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: 1.2
                      }}
                    >
                      {from}
                    </h1>
                  </div>

                  {/* Arrow */}
                  <div className="ml-10 mb-4">
                    <ArrowRight className="w-6 h-6 text-white rotate-90" strokeWidth={2} />
                  </div>

                  {/* To Location */}
                  <div className="flex items-center gap-3">
                    {quoteData?.to?.source === 'bc_club' ? (
                      <BcClubIcon type="BcClub" strokeWidth={1} size={30} color="currentColor" className="w-7 h-7 text-white" />
                    ) :
                      quoteData?.to?.type === 'club' ? (
                        <BcClubIcon type="GolfClub" strokeWidth={1} size={30} color="#FFFFFF" className="w-7 h-7 text-white" />
                      ) : (
                        <Flag className="w-7 h-7 text-white" strokeWidth={2} />
                      )}

                    <h1
                      className="text-white"
                      style={{
                        fontSize: 'clamp(28px, 4vw, 48px)',
                        fontWeight: 400,
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: 1.2
                      }}
                    >
                      {to}
                    </h1>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Quote Cards - Half in hero, half out */}
        {(ratesError || localRatesError) ? (
          <>
            <RateFallback
              entryMode="QuickQuote"              
            />
          </>
        ) : (
          <>
            <div className="relative -mt-24 z-20 px-4 pb-8">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {shippingOptions.length > 0 && (
                    shippingOptions.map((option, index) => {
                      const isSelected = selectedShippingOption?.id === option.id;
                      return (
                        <motion.button
                          key={option.id}
                          type="button"
                          // onClick={() => setSelectedShippingOption(option)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 + index * 0.1, duration: 0.4 }}
                          className={`bg-white rounded-2xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] transition-all duration-300 text-left w-full ${isSelected
                            ? 'ring-2 ring-[#D4AF37] border-2 border-[#D4AF37] bg-[#FFF7E8]'
                            : 'border-2 border-transparent hover:border-[#D4AF37]/30'
                            }`}
                        >
                          {/* Icon and Title */}
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`flex items-center justify-center w-9 h-9 rounded-full ${isSelected ? 'bg-[#D4AF37]' : 'bg-[#D4AF37]/10'
                                }`}>
                                <option.icon
                                  className={`w-4.5 h-4.5 ${isSelected ? 'text-white' : 'text-[#D4AF37]'}`}
                                  strokeWidth={2}
                                />
                              </div>
                              <h3
                                className="text-[#111111]"
                                style={{ fontSize: '18px', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}
                              >
                                {option.title}
                              </h3>
                            </div>
                            {/* Selection Indicator */}
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Subtitle */}
                          <p
                            className="text-[#D4AF37] mb-2.5"
                            style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}
                          >
                            {option.subtitle}
                          </p>

                          {/* Price */}
                          <div
                            className="text-[#111111] mb-1.5"
                            style={{ fontSize: '28px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
                          >
                            {option.price}
                          </div>

                          {/* Duration */}
                          <p
                            className="text-[#666666]"
                            style={{ fontSize: '13px', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}
                          >
                            {option.duration}
                          </p>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}


        {/* Welcome Section */}
        <div className="max-w-6xl mx-auto px-4 pt-0 pb-6 text-center">
          <WelcomeHeading
            style={{ color: '#111111' }}
            title="Welcome to BagCaddie Club"
            subheading="A concierge-level experience for smart travelers."
            withAnimation={true}
          />
        </div>

        {/* Authentication Form or Register Step */}
        {!showRegisterStep ? (
          <div className="max-w-6xl mx-auto px-4 pb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-white rounded-2xl border border-gray-200 px-8 pb-8 pt-8 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                {/* OTP Verification Form */}
                {showOtpVerification ? (
                  <form onSubmit={handleOtpVerification} className="space-y-5">
                    <div className="text-center mb-6">
                      <h2
                        className="text-[#111111] mb-2"
                        style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
                      >
                        Enter Verification Code
                      </h2>
                      <p
                        className="text-[#666666]"
                        style={{ fontSize: '14px', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}
                      >
                        We sent a 6-digit code to {contactInfo}
                      </p>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otpCode}
                        onChange={(value) => {
                          setOtpCode(value);
                          setOtpError('');
                        }}
                        autoFocus
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {/* Error Message */}
                    {otpError && (
                      <div className="text-center">
                        <p className="text-red-600 text-sm">{otpError}</p>
                      </div>
                    )}

                    {/* Resend Code */}
                    <div className="text-center">
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isResending}
                          className="text-[#D4AF37] hover:text-[#c29d2f] hover:underline transition-colors disabled:opacity-50"
                          style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}
                        >
                          {isResending ? 'Sending...' : 'Resend code'}
                        </button>
                      ) : (
                        <p
                          className="text-[#888888]"
                          style={{ fontSize: '14px', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}
                        >
                          Resend code in {resendTimer}s
                        </p>
                      )}
                    </div>

                    {/* Back Button */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtpVerification(false);
                          setOtpCode('');
                          setOtpError('');
                          setResendTimer(30);
                          setCanResend(false);
                        }}
                        className="text-[#888888] hover:text-[#111111] transition-colors"
                        style={{ fontSize: '14px', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}
                      >
                        ← Back
                      </button>
                    </div>

                    {/* Verify Button */}
                    <button
                      type="submit"
                      disabled={isVerifying || otpCode.length !== 6}
                      className="w-full h-14 bg-[#D4AF37] text-[#111111] rounded-xl hover:bg-[#C49A2E] hover:shadow-[0_6px_16px_rgba(212,175,55,0.4)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      style={{ fontSize: '16px', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}
                    >
                      {isVerifying ? (
                        <>
                          <div className="w-5 h-5 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Continue</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Contact Input Form */
                  <form onSubmit={handleSubmit} className="space-y-5 bc-auth-form">
                    <p className="text-gray-900 mb-4 px-2" style={{ fontSize: '13px' }}>
                      New or returning member — verify once and travel with ease.
                    </p>
                    <div className="mb-4">
                      <Label htmlFor="contact" className="mb-2 flex items-center gap-2">
                        {isEmailMode ? <Mail className="w-4 h-4 text-gray-500" /> : <Phone className="w-4 h-4 text-gray-500" />}
                        {isEmailMode ? 'Email address' : 'Mobile number'}
                      </Label>

                      {isEmailMode ? (
                        <Input
                          autoFocus={true}
                          id="contact"
                          type="email"
                          placeholder="Enter your email"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          className="w-full h-11"
                        />
                      ) : (
                        <PhoneInput
                          value={phone.value}
                          onChange={phone.setValue}
                          isValid={phone.isValid}
                          countryCode={phone.countryCode}
                          nationalNumber={phone.nationalNumber}
                        />

                      )}

                      <p className="text-sm text-gray-500 mt-2">
                        {isEmailMode
                          ? "We'll send a 6-digit code to your email."
                          : "We'll send a 6-digit code to verify your identity."}
                      </p>

                      {error && (
                        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2">
                          <p className="text-xs text-red-700">{error}</p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsEmailMode(!isEmailMode);
                          if (isEmailMode) {
                            // Switching to phone mode - clear email
                            setContact('');
                          }
                        }}
                        className="text-sm text-[#C8A654] mt-2 hover:underline"
                      >
                        {isEmailMode ? 'Use mobile number instead →' : 'Use email instead →'}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#C8A654] hover:bg-[#B89544] text-white h-11 rounded-lg"
                      disabled={isLoading || !isFormValid}
                    >
                      {isLoading ? 'Checking…' : 'Continue'}
                    </Button>

                    <p className="text-center text-sm text-gray-500 mt-3">
                      Next: Verify your 6-digit code.
                    </p>
                  </form>
                )}
              </div>
              {/* Divider */}
              <div className="flex items-center gap-4 pt-4 sm:pt-6 pb-3 sm:pb-4 max-w-[420px] mx-auto">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-sm text-gray-500">or</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>
              {/* QR Scan Option */}
              <button
                onClick={() => setShowQRScan(true)}
                className="w-full bg-white rounded-xl p-4 sm:p-6 border-2 border border-gray-200 hover:border-[#C8A654] transition-colors group  mx-auto block"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full bg-gray-100 group-hover:bg-[#C8A654]/10 flex items-center justify-center transition-colors">
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-[#C8A654] transition-colors" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
                      Scan or Enter Your 8-Digit BagCaddie Tag Code
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      If you already have a BagCaddie tag, scan or enter your code here.
                    </div>
                  </div>
                </div>
              </button>
              {showQRScan && (
                <QRScanModal
                  onClose={() => setShowQRScan(false)}
                  onSuccess={(customerData) => {
                    onQRSuccess?.(customerData);
                    setShowQRScan(false);
                  }}
                />
              )}
            </motion.div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 pb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="max-w-lg mx-auto"
            >
              <RegisterStep
                contactInfo={contactInfo}
                products={products}
                onSubmit={(userData) => {
                  // Handle registration completion
                  redirectToBooking();
                }}
                onBack={() => {
                  setShowRegisterStep(false);
                  setShowOtpVerification(false);
                  setOtpCode('');
                  setOtpError('');
                }}
              />
            </motion.div>
          </div>
        )}
      </div>
    );
  }

}

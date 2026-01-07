import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { QRScanModal } from './QRScanModal';
import { CustomerData, apiService, LocationInfo } from '../services/api';
import { PhoneInput } from './ui/PhoneInput';
import { usePhoneValidation } from './usePhoneValidation';
import { WelcomeHeading } from './WelcomeHeading';
import { storage } from '../services/storage';
import AnalyticsService from '../services/analytics';

interface AccessStepProps {
  onSubmit: (contact: string) => void;
  onQRSuccess?: (customerData: CustomerData) => void;
}

export function AccessStep({ onSubmit, onQRSuccess }: AccessStepProps) {
  const [contact, setContact] = useState('');
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [showQRScan, setShowQRScan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Get location from storage and extract calling code
  const location = storage.getLocation<LocationInfo>();
  const callingCode = location?.country_metadata?.calling_code || '+1';
  const phone = usePhoneValidation(callingCode);
  const validateEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);

  // Compute form validity based on current mode
  const isFormValid = isEmailMode
    ? contact.trim() !== '' && validateEmail(contact.trim())
    : phone.isValid;

  // Auto-focus email input when switching to email mode
  useEffect(() => {
    if (isEmailMode && emailInputRef.current) {
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [isEmailMode]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isEmailMode) {
      const email = contact.trim();
      if (!email) return;

      if (!validateEmail(email)) {
        setError('Please enter a valid email address.');
        return;
      }

      try {
        setIsLoading(true);
        const resp = await apiService.getPartner({ email });
        const partnerSuccess = (resp as any)?.data?.success === true;

        if (partnerSuccess) {
          const partner = (resp as any).data.data;
          const otpPayload = {
            type: 'email' as const,
            first_name: partner?.firstName || '',
            last_name: partner?.lastName || '',
            email: partner?.email || email,
          };

          const otpResp = await apiService.sendOtp(otpPayload);
          const otpSuccess = (otpResp as any)?.data?.success === true;

          if (otpSuccess) {
            // Track OTP start event
            AnalyticsService.trackOtpStart('email');
            console.log("OTP Start Fired", { method: 'email' });

            if (partner?.items && partner.items.length > 0) {
              try {
                await apiService.processAndStorePartnerItems(partner);
              } catch (err) {
                console.error('Error enriching partner items:', err);
              }
            }
            onSubmit(email);
          } else {
            setError((otpResp as any)?.data?.message || 'Failed to send verification code.');
          }
        } else {
          // User not found, send OTP to provided email
          const otpPayload = {
            type: 'email' as const,
            first_name: 'BagCaddie Member',
            last_name: '',
            email,
          };

          const otpResp = await apiService.sendOtp(otpPayload);
          const otpSuccess = (otpResp as any)?.data?.success === true;

          if (otpSuccess) {
            // Track OTP start event
            AnalyticsService.trackOtpStart('email');
            console.log("OTP Start Fired", { method: 'email' });
            onSubmit(email);
          } else {
            setError((otpResp as any)?.data?.message || 'Failed to send verification code.');
          }
        }
      } catch (err) {
        setError('Unable to verify user. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Phone mode
      if (!phone.isValid) {
        setError('Please enter a valid phone number.');
        return;
      }

      try {
        setIsLoading(true);
        const resp = await apiService.getPartner({ phone: phone.value });
        const partnerSuccess = (resp as any)?.data?.success === true;

        if (partnerSuccess) {
          const partner = (resp as any).data.data;
          const otpPayload = {
            type: 'phone' as const,
            first_name: partner?.firstName || '',
            last_name: partner?.lastName || '',
            phone: partner?.phone || phone.value,
          };

          const otpResp = await apiService.sendOtp(otpPayload);
          const otpSuccess = (otpResp as any)?.data?.success === true;

          if (otpSuccess) {
            // Track OTP start event
            AnalyticsService.trackOtpStart('phone');
            console.log("OTP Start Fired", { method: 'phone' });
            if (partner?.items && partner.items.length > 0) {
              try {
                await apiService.processAndStorePartnerItems(partner);
              } catch (err) {
                console.error('Error enriching partner items:', err);
              }
            }
            onSubmit(phone.value);
          } else {
            setError((otpResp as any)?.data?.message || 'Failed to send verification code.');
          }
        } else {
          // User not found, send OTP to provided phone
          const otpPayload = {
            type: 'phone' as const,
            first_name: 'BagCaddie Member',
            last_name: '',
            phone: phone.value,
          };

          const otpResp = await apiService.sendOtp(otpPayload);
          const otpSuccess = (otpResp as any)?.data?.success === true;

          if (otpSuccess) {
            // Track OTP start event
            AnalyticsService.trackOtpStart('phone');
            console.log("OTP Start Fired", { method: 'phone' });
            onSubmit(phone.value);
          } else {
            setError((otpResp as any)?.data?.message || 'Failed to send verification code.');
          }
        }
      } catch (err) {
        setError('Unable to verify user. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <div className="text-center mb-4 sm:mb-6">
        <WelcomeHeading
          style={{ color: '#111111' }}
          title="Welcome to BagCaddie Club"
          subheading="Enter your mobile number to verify and continue your BagCaddie Club booking."
          withAnimation={true}
        />
      </div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-4 hover:ring-2 hover:ring-[#C8A654] hover:border-[#C8A654] focus-within:ring-2 focus-within:ring-[#C8A654] focus-within:border-[#C8A654] transition-all max-w-[480px] mx-auto"
          style={{ maxWidth: '480px' }}
        >

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="contact" className="mb-2 flex items-center gap-2">
                {isEmailMode ? <Mail className="w-4 h-4 text-gray-500" /> : <Phone className="w-4 h-4 text-gray-500" />}
                {isEmailMode ? 'Email address' : 'Mobile number'}
              </Label>

              {isEmailMode ? (
                <Input
                  ref={emailInputRef}
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
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 pt-4 sm:pt-6 pb-3 sm:pb-4 mx-auto" style={{ maxWidth: '480px' }}>
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
        {/* QR Scan Option */}
        <button
          onClick={() => setShowQRScan(true)}
          className="w-full bg-white rounded-xl p-4 sm:p-6 border-2 border border-gray-200 hover:border-[#C8A654] transition-colors group mx-auto block"
          style={{ maxWidth: '480px' }}
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
    </>
  );
}


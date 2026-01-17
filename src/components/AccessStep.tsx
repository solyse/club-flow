import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRScanModal } from './QRScanModal';
import { CustomerData, apiService, LocationInfo } from '../services/api';
import { usePhoneValidation } from './usePhoneValidation';
import { WelcomeHeading } from './WelcomeHeading';
import { storage } from '../services/storage';
import AnalyticsService from '../services/analytics';
import { type TabType } from './AccessTabs';
import { AccessForm } from './AccessForm';

interface AccessStepProps {
  onSubmit: (contact: string) => void;
  onQRSuccess?: (customerData: CustomerData) => void;
  defaultTab?: TabType;
}

export function AccessStep({ onSubmit, onQRSuccess, defaultTab = 'email' }: AccessStepProps) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [contact, setContact] = useState('');
  const [clubCode, setClubCode] = useState<string[]>(Array(8).fill(''));
  const [showQRScan, setShowQRScan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClubCode, setIsLoadingClubCode] = useState(false);
  const [error, setError] = useState<string>('');
  const clubCodeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get location from storage and extract calling code
  const location = storage.getLocation<LocationInfo>();
  const callingCode = location?.country_metadata?.calling_code || '+1';
  const phone = usePhoneValidation(callingCode);
  const validateEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);

  // Compute form validity based on active tab
  const isFormValid =
    activeTab === 'mobile' ? phone.isValid :
      activeTab === 'email' ? (contact.trim() !== '' && validateEmail(contact.trim())) :
        activeTab === 'club_code' ? clubCode.every(char => char !== '') :
          false;


  // Club code input handlers
  const handleClubCodeChange = (index: number, value: string) => {
    // Allow alphanumeric characters (letters and numbers)
    if (value && !/^[A-Za-z0-9]$/.test(value)) return;

    const newCode = [...clubCode];
    newCode[index] = value.toUpperCase(); // Convert to uppercase for consistency
    setClubCode(newCode);
    setError('');

    // Auto-advance to next input
    if (value && index < 7) {
      clubCodeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleClubCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !clubCode[index] && index > 0) {
      clubCodeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleClubCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 8);
    // Allow alphanumeric characters and convert to uppercase
    const chars = pastedData.split('').filter(char => /^[A-Za-z0-9]$/.test(char));

    const newCode = [...clubCode];
    chars.forEach((char, index) => {
      if (index < 8) {
        newCode[index] = char.toUpperCase();
      }
    });
    setClubCode(newCode);
    setError('');

    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex(c => !c);
    if (nextEmptyIndex !== -1) {
      clubCodeInputRefs.current[nextEmptyIndex]?.focus();
    } else {
      clubCodeInputRefs.current[7]?.focus();
    }
  };

  const isClubCodeComplete = clubCode.every(char => char !== '');

  // Handle club code submission
  const handleClubCodeSubmit = async () => {
    if (!isClubCodeComplete) return;
    setIsLoadingClubCode(true);
    setError('');

    try {
      const qrCode = clubCode.join('');
      const response = await apiService.validateQRCode(qrCode);

      if (apiService.isSuccessResponse(response)) {
        // Success - call the onSuccess callback with customer data
        onQRSuccess?.(response.data.data);
      } else {
        // Error - show error message
        setError(apiService.getErrorMessage(response));
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('QR Code validation error:', err);
    } finally {
      setIsLoadingClubCode(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'club_code') {
      // Handle club code submission
      await handleClubCodeSubmit();
      return;
    }

    if (activeTab === 'email') {
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
    } else if (activeTab === 'mobile') {
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
          title="Welcome to BagCaddie"
          subheading="Get your golf bags and luggage delivered to your next destination while you enjoy the journey."
          withAnimation={true}
        />
      </div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200 mb-4 hover:ring-2 hover:ring-[#B3802B] hover:border-[#B3802B] focus-within:ring-2 focus-within:ring-[#B3802B] focus-within:border-[#B3802B] transition-all max-w-[560px] mx-auto">
          <AccessForm
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setError('');
            }}
            phone={phone}
            contact={contact}
            onContactChange={setContact}
            clubCode={clubCode}
            onClubCodeChange={handleClubCodeChange}
            onClubCodeKeyDown={handleClubCodeKeyDown}
            onClubCodePaste={handleClubCodePaste}
            isFormValid={isFormValid}
            isLoading={isLoading}
            isLoadingClubCode={isLoadingClubCode}
            error={error}
            onSubmit={handleSubmit}
            onQRScanClick={() => setShowQRScan(true)}
            clubCodeInputRefs={clubCodeInputRefs}
          />
        </div>

        {/* QR Scan Modal */}
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


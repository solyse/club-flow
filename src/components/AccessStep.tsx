import { useState } from 'react';
import { Mail, Phone, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { QRScanModal } from './QRScanModal';
import { CustomerData, apiService } from '../services/api';

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

  const validateEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
  const validatePhone = (value: string) => /^\+[0-9]{7,15}$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const raw = contact.trim();
    if (!raw) return;

    if (isEmailMode) {
      if (!validateEmail(raw)) {
        setError('Please enter a valid email address.');
        return;
      }
    } else {
      // If no country code is provided, add +1 (US) as default
      let phoneNumber = raw.trim();
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = `+1${phoneNumber}`;
      }
      // Normalize phone number (strip spaces/dashes, keep + and digits)
      const normalized = phoneNumber.replace(/[^0-9+]/g, '');
      if (!validatePhone(normalized)) {
        setError('Please enter a valid phone number.');
        return;
      }
    }

    try {
      setIsLoading(true);
      // For phone, ensure country code is present
      let phoneValue = raw.trim();
      if (!isEmailMode && !phoneValue.startsWith('+')) {
        phoneValue = `+1${phoneValue}`;
      }
      const normalizedPhone = !isEmailMode ? phoneValue.replace(/[^0-9+]/g, '') : '';
      
      const payload = isEmailMode
        ? { email: raw }
        : { phone: normalizedPhone };

      const resp = await apiService.getPartner(payload);
      const partnerSuccess = (resp as any)?.data?.success === true;
      if (partnerSuccess) {
        const partner = (resp as any).data.data;
        const otpPayload = {
          type: isEmailMode ? 'email' as const : 'phone' as const,
          first_name: partner?.firstName || '',
          last_name: partner?.lastName || '',
          email: partner?.email || undefined,
          phone: partner?.phone || undefined,
        };

        const otpResp = await apiService.sendOtp(otpPayload);
        const otpSuccess = (otpResp as any)?.data?.success === true;
        if (otpSuccess) {
          // If partner has items, enrich and store them
          if (partner?.items && partner.items.length > 0) {
            try {
              await apiService.processAndStorePartnerItems(partner);
            } catch (err) {
              console.error('Error enriching partner items:', err);
              // Continue even if enrichment fails
            }
          }
          // Ensure phone has country code
          let finalContact = raw.trim();
          if (!isEmailMode && !finalContact.startsWith('+')) {
            finalContact = `+1${finalContact}`;
          }
          const finalPhone = !isEmailMode ? finalContact.replace(/[^0-9+]/g, '') : finalContact;
          onSubmit(isEmailMode ? finalContact : finalPhone);
        } else {
          setError((otpResp as any)?.data?.message || 'Failed to send verification code.');
        }
      } else {
        // If user not found, still send OTP to provided contact
        const otpPayload = {
          type: isEmailMode ? 'email' as const : 'phone' as const,
          first_name: 'User',
          last_name: '',
          email: isEmailMode ? raw : undefined,
          phone: !isEmailMode ? normalizedPhone : undefined,
        };

        const otpResp = await apiService.sendOtp(otpPayload);
        const otpSuccess = (otpResp as any)?.data?.success === true;
        if (otpSuccess) {
          // Ensure phone has country code
          let finalContact = raw.trim();
          if (!isEmailMode && !finalContact.startsWith('+')) {
            finalContact = `+1${finalContact}`;
          }
          const finalPhone = !isEmailMode ? finalContact.replace(/[^0-9+]/g, '') : finalContact;
          onSubmit(isEmailMode ? finalContact : finalPhone);
        } else {
          setError((otpResp as any)?.data?.message || 'Failed to send verification code.');
        }
      }
    } catch (err) {
      setError('Unable to verify user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="mb-4 sm:mb-6"  style={{ fontSize: '36px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Welcome to BagCaddie Club</h2>
        <p className="text-gray-900 mb-4 px-2">
          New or returning member — verify once and travel with ease.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-4 hover:ring-2 hover:ring-[#C8A654] hover:border-[#C8A654] focus-within:ring-2 focus-within:ring-[#C8A654] focus-within:border-[#C8A654] transition-all max-w-[420px] mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="contact" className="mb-2 flex items-center gap-2">
              {isEmailMode ? <Mail className="w-4 h-4 text-gray-500" /> : <Phone className="w-4 h-4 text-gray-500" />}
              {isEmailMode ? 'Email address' : 'Mobile number'}
            </Label>
            
            {isEmailMode ? (
              <Input
                id="contact"
                type="email"
                placeholder="Enter your email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full h-11"
              />
            ) : (
              <Input
                id="contact"
                type="tel"
                placeholder="Enter your mobile number"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full h-11"
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
                setContact('');
              }}
              className="text-sm text-[#C8A654] mt-2 hover:underline"
            >
              {isEmailMode ? 'Use mobile number instead →' : 'Use email instead →'}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#C8A654] hover:bg-[#B89544] text-white h-11 rounded-lg"
            disabled={!contact.trim() || isLoading}
          >
            {isLoading ? 'Checking…' : 'Continue'}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-3">
            Next: Verify your 6-digit code.
          </p>
        </form>
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
        className="w-full bg-white rounded-xl p-4 sm:p-6 border-2 border border-gray-200 hover:border-[#C8A654] transition-colors group max-w-[420px] mx-auto block"
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
    </>
  );
}


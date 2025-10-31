import { useState, useEffect } from 'react';
import { Mail, Phone, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { QRScanModal } from './QRScanModal';
import { CustomerData, apiService, CountryCode, LocationInfo } from '../services/api';
import { storage } from '../services/storage';

interface AccessStepProps {
  onSubmit: (contact: string) => void;
  onQRSuccess?: (customerData: CustomerData) => void;
}

export function AccessStep({ onSubmit, onQRSuccess }: AccessStepProps) {
  const [contact, setContact] = useState('');
  const [countryCode, setCountryCode] = useState<string>('+1');
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [showQRScan, setShowQRScan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [countryCodeOptions, setCountryCodeOptions] = useState<CountryCode[]>([]);

  // Load country codes and default from cached location
  useEffect(() => {
    const codes = storage.getCountryCodes<CountryCode[]>() || [];
    if (codes.length === 0) return;
    
    setCountryCodeOptions(codes);
    
    const loc = storage.getLocation<LocationInfo>();
    const callCode = loc?.country_metadata?.calling_code;
    const normalizeCode = (s: string) => s?.replace(/[^+\d]/g, '').trim();
    
    let finalCode = '+1'; // Default fallback
    
    if (callCode && typeof callCode === 'string') {
      // Normalize the calling code from location
      const normalizedCallCode = normalizeCode(callCode);
      
      // Find matching country code from the options - check all codes
      const matchingCode = codes.find((c) => {
        const normalizedOption = normalizeCode(c.code || '');
        return normalizedOption === normalizedCallCode;
      });
      
      if (matchingCode) {
        finalCode = normalizeCode(matchingCode.code || '');
      } else {
        // If exact match not found, try to find by partial match (e.g., +1-268 matches +1)
        const partialMatch = codes.find((c) => {
          const normalizedOption = normalizeCode(c.code || '');
          return normalizedOption.startsWith(normalizedCallCode) || normalizedCallCode.startsWith(normalizedOption);
        });
        if (partialMatch) {
          finalCode = normalizeCode(partialMatch.code || '');
        }
      }
    } else if (codes.length > 0) {
      // If no location, use first available code or +1
      finalCode = normalizeCode(codes[0]?.code || '+1');
    }
    
    // Ensure the code exists in the options list
    const codeExists = codes.some((c) => {
      const normalizedOption = normalizeCode(c.code || '');
      return normalizedOption === finalCode;
    });
    
    if (codeExists || codes.length === 0) {
      setCountryCode(finalCode);
    } else {
      // Fallback to first code if the matched code doesn't exist in list
      setCountryCode(normalizeCode(codes[0]?.code || '+1'));
    }
  }, []);

  // Ensure countryCode is valid when options change
  useEffect(() => {
    if (countryCodeOptions.length === 0) return;
    
    const normalizeCode = (s: string) => s?.replace(/[^+\d]/g, '').trim();
    const normalizedCurrent = normalizeCode(countryCode);
    
    // Check if current countryCode exists in options
    const exists = countryCodeOptions.some((c) => {
      const normalizedOption = normalizeCode(c.code || '');
      return normalizedOption === normalizedCurrent;
    });
    
    if (!exists) {
      // Current code doesn't exist, try to find from location or use first available
      const loc = storage.getLocation<LocationInfo>();
      const callCode = loc?.country_metadata?.calling_code;
      
      if (callCode && typeof callCode === 'string') {
        const normalizedCallCode = normalizeCode(callCode);
        const matching = countryCodeOptions.find((c) => {
          const normalizedOption = normalizeCode(c.code || '');
          return normalizedOption === normalizedCallCode;
        });
        
        if (matching) {
          setCountryCode(normalizeCode(matching.code || ''));
          return;
        }
      }
      
      // Fallback to first available code
      const firstCode = normalizeCode(countryCodeOptions[0]?.code || '+1');
      setCountryCode(firstCode);
    }
  }, [countryCodeOptions, countryCode]);

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
      // Build E.164-like phone string from country code + input (strip spaces/dashes)
      const normalized = `${countryCode}${raw}`.replace(/[^0-9+]/g, '');
      if (!validatePhone(normalized)) {
        setError('Please enter a valid phone number including country code.');
        return;
      }
    }

    try {
      setIsLoading(true);
      const payload = isEmailMode
        ? { email: raw }
        : { phone: `${countryCode}${raw}`.replace(/[^0-9+]/g, '') };

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
          const finalContact = isEmailMode ? raw : `${countryCode}${raw}`.replace(/[^0-9+]/g, '');
          onSubmit(finalContact);
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
          phone: !isEmailMode ? `${countryCode}${raw}`.replace(/[^0-9+]/g, '') : undefined,
        };

        const otpResp = await apiService.sendOtp(otpPayload);
        const otpSuccess = (otpResp as any)?.data?.success === true;
        if (otpSuccess) {
          const finalContact = isEmailMode ? raw : `${countryCode}${raw}`.replace(/[^0-9+]/g, '');
          onSubmit(finalContact);
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
        <h1 className="mb-4 sm:mb-6">Welcome to BagCaddie Club</h1>
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
              <div className="flex gap-2">
                <Select 
                  value={countryCode} 
                  onValueChange={setCountryCode}
                  key={countryCodeOptions.length > 0 ? 'loaded' : 'default'}
                >
                  <SelectTrigger className="w-24 !h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {countryCodeOptions.length
                      ? (() => {
                          const normalizeCode = (s: string) => s?.replace(/[^+\d]/g, '').trim();
                          const seen = new Set<string>();
                          const uniqueCodes: CountryCode[] = [];
                          
                          countryCodeOptions.forEach((c) => {
                            const normalized = normalizeCode(c.code || '');
                            if (normalized && !seen.has(normalized)) {
                              seen.add(normalized);
                              uniqueCodes.push(c);
                            }
                          });
                          
                          return uniqueCodes.map((c) => {
                            const value = normalizeCode(c.code || '');
                            if (!value) return null;
                            return (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            );
                          });
                        })()
                      : (
                          <>
                            <SelectItem value="+1">+1</SelectItem>
                            <SelectItem value="+44">+44</SelectItem>
                            <SelectItem value="+61">+61</SelectItem>
                            <SelectItem value="+91">+91</SelectItem>
                          </>
                        )}
                  </SelectContent>
                </Select>
                <Input
                  id="contact"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="flex-1 h-11"
                />
              </div>
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


import { useMemo, useState, useEffect } from 'react';
import { Check, Mail, ArrowLeft, ClipboardList, Info } from 'lucide-react';
import { ProgressIndicator } from './ProgressIndicator';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PhoneInput } from './ui/PhoneInput';
import { usePhoneValidation, extractCountryCode } from './usePhoneValidation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import { apiService, Product, LocationInfo } from '../services/api';
import { storage } from '../services/storage';
import { envConfig } from '../config/env';

interface RegisterStepProps {
  contactInfo: string;
  onSubmit: (userData: any) => void;
  onBack: () => void;
  products?: Product[];
  partnerLogo?: string | null;
  partnerDisplayName?: string | null;
}

export function RegisterStep({ contactInfo, onSubmit, onBack, products = [], partnerLogo, partnerDisplayName }: RegisterStepProps) {
  const isEmail = contactInfo.includes('@');
  const productOptions = useMemo(() => products || [], [products]);
  const defaultProductId = useMemo(() => {
    const configuredId = envConfig.itemId;
    const found = productOptions.some((p) => String(p.id) === configuredId);
    if (found) return configuredId;
    return productOptions.length > 0 ? productOptions[0].id : '';
  }, [productOptions]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: isEmail ? contactInfo : '',
    phone: !isEmail ? contactInfo : '',
    itemType: defaultProductId,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const phone = usePhoneValidation(extractCountryCode(contactInfo) || '+1');
  useEffect(() => {
    if (!isEmail && contactInfo) phone.setValue(contactInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Extract phone code and phone number from current form phone value
  const getPhoneCodeAndNumber = (): { phoneCode: string; phone: string } => {
    if (isEmail) {
      // Get phone code from location cache
      const location = storage.getLocation<LocationInfo>();
      const phoneCode = location?.country_metadata?.calling_code || '+1';
      return { phoneCode, phone: formData.phone.replace(/[^0-9]/g, '') };
    }
    const phoneWithCode = (formData.phone || contactInfo).trim();
    const codeMatch = phoneWithCode.match(/^(\+[0-9]{1,4})/);
    const phoneCode = codeMatch ? codeMatch[1] : '+1';
    const phoneNumber = codeMatch
      ? phoneWithCode.replace(codeMatch[1], '').replace(/[^0-9]/g, '')
      : phoneWithCode.replace(/[^0-9]/g, '').slice(-10);
    return { phoneCode, phone: phoneNumber };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation: firstName and itemType are required
    if (!formData.firstName || !formData.itemType) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validation: email or phone (at least one required)
    const hasEmail = formData.email.trim() !== '';
    const hasPhone = formData.phone.trim() !== '';

    if (!hasEmail && !hasPhone) {
      setError('Please provide either email or phone number.');
      return;
    }

    try {
      setIsLoading(true);

      // Build payload based on which contact method is provided
      const personalPayload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || '',
      };

      // Priority: If email is provided, only send email (exclude phoneCode and phone)
      // If only phone is provided (no email), send phoneCode and phone
      if (hasEmail) {
        personalPayload.email = formData.email.trim();
        // Explicitly exclude phoneCode and phone when email is provided
      } else if (hasPhone) {
        // Only phone is provided (no email), include phone and phoneCode
        const { phoneCode, phone } = getPhoneCodeAndNumber();
        personalPayload.phoneCode = phoneCode;
        personalPayload.phone = phone;
      }

      const payload = {
        items: {
          item_id: formData.itemType,
        },
        personal: personalPayload,
      };

      const response = await apiService.createCustomer(payload);

      if (response.data.success) {
        toast.success('Profile created successfully!');
        onSubmit(formData);
      } else if ((response.data as any).exists) {
        // Customer already exists - still proceed
        toast.info(response.data.message || 'Customer already exists');
        onSubmit(formData);
      } else {
        const errorMsg = response.data.message || 'Failed to create profile. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Unable to create profile. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validation: firstName and itemType are required, email OR phone at least one required
  const hasEmail = formData.email ? formData.email.trim() !== '' : false;
  const hasPhone = formData.phone ? formData.phone.trim() !== '' : false;
  const isFormValid = formData.firstName.trim() !== '' &&
    formData.itemType !== '' &&
    (hasEmail || hasPhone);

  return (
    <div className="max-w-2xl mx-auto">
     
      {/* Welcome card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
        <div className="mb-6 flex justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-medium mb-1 text-[#121110]">Welcome to BagCaddie Club</h2>
            {partnerLogo && (
             <p className="text-sm text-[#121110]">for {partnerDisplayName} Members</p>
            )}
            <p className="text-[#d4af37] text-sm">Complete your profile to activate your Icon Golf travel benefits.</p>
          </div>
          {partnerLogo && (
            <div>
              <img
                src={partnerLogo}
                alt={partnerDisplayName || 'Partner Logo'}
                className="max-h-10 md:max-h-12 w-auto object-contain"
              />
            </div>
          )}
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-gray-700">
            <ClipboardList className="w-4 h-4 text-gray-600" />
            Get Started
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-solid rounded mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-500">Add your name & contact</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-solid rounded mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-500">Choose your product</span>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-solid rounded mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-500">Continue to booking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#121110] mb-4">Complete Your Profile</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="firstName" className="text-sm text-gray-700 mb-1.5 block">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Enter first name"
                className="h-10"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm text-gray-700 mb-1.5 block">
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Enter last name"
                className="h-10"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4">
            <Label htmlFor="email" className="text-sm text-gray-700 mb-1.5 block">
              Email {hasEmail ? '' : hasPhone ? '(optional)' : <span className="text-red-500">*</span>}
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={hasPhone ? 'Enter your email (optional)' : 'email@example.com'}
                  className="h-10 pl-10 bc-email-input"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
              {isEmail && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Verified</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <Label htmlFor="phone" className="text-sm text-gray-700 mb-1.5 block">
              Mobile Phone
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <PhoneInput
                  value={phone.value}
                  onChange={(v) => {
                    phone.setValue(v);
                    setFormData((prev) => ({ ...prev, phone: v }));
                  }}
                  isValid={phone.isValid}
                  countryCode={phone.countryCode}
                  nationalNumber={phone.nationalNumber}
                />
              </div>
              {!isEmail && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* Info message based on verification method */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              {isEmail
                ? 'Your email is verified. You can add a phone number if you\'d like.'
                : 'Your phone is verified from login. Please add an email address to complete your profile.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="px-6"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              className="bg-[#B3802B] hover:bg-[#9a6d24] text-white px-6"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Registering...' : 'Continue to My Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

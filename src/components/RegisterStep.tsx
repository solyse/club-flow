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
import { apiService, Product } from '../services/api';
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

      // Build payload: include email and/or phone whenever provided
      const personalPayload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || '',
      };

      if (hasEmail) {
        personalPayload.email = formData.email.trim();
      }
      if (hasPhone) {
        personalPayload.phoneCode = phone.countryCode ?? '+1';
        personalPayload.phone = phone.nationalNumber;
      }

      const payload: {
        items: { item_id: string };
        personal: typeof personalPayload;
        partner?: string;
      } = {
        items: {
          item_id: formData.itemType,
        },
        personal: personalPayload,
      };

      // If we have partner reference (e.g. from ?partner_code= URL), pass numeric ID in payload
      const partnerRef = storage.getPartnerReference<{ id: string }>();
      if (partnerRef?.id) {
        // Extract numeric ID from Shopify GID (e.g. "gid://shopify/Customer/8778100277464" -> "8778100277464")
        const numericId = partnerRef.id.split('/').pop();
        if (numericId) {
          payload.partner = numericId;
        }
      }

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

  // Partner checklist content: use partner_reference_details when available, else fallback
  const partnerRef = storage.getPartnerReference<any>();
  const partnerChecklist = partnerRef?.partner_reference_details?.[0]?.checklists?.[0];

  const checklistOne: [string, string] = (
    Array.isArray(partnerChecklist?.checklist_one) && partnerChecklist.checklist_one.length >= 1
      ? [
          partnerChecklist.checklist_one[0],
          (partnerChecklist.checklist_one[1] as string) ?? '',
        ]
      : ['Complete your member profile', 'Add your contact details so we can coordinate your travel and shipments smoothly.']
  );

  const checklistTwo: [string, string] = (
    Array.isArray(partnerChecklist?.checklist_two) && partnerChecklist.checklist_two.length >= 1
      ? [
          partnerChecklist.checklist_two[0],
          (partnerChecklist.checklist_two[1] as string) ?? '',
        ]
      : ['Personalize your bag tags', ' Most members create one for their golf bag and another for luggage or a spouse. Additional tags can be added anytime.']
  );

  const checklistThree: [string, string] = (
    Array.isArray(partnerChecklist?.checklist_three) && partnerChecklist.checklist_three.length >= 1
      ? [
          partnerChecklist.checklist_three[0],
          (partnerChecklist.checklist_three[1] as string) ?? '',
        ]
      : [' Save your home and club addresses', ' Store your home and preferred golf clubs for faster, more accurate bookings.']
  );

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
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-700">{checklistOne[0]}</div>
                {checklistOne[1] && (
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">{checklistOne[1]}</div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-solid rounded mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-700">{checklistTwo[0]}</div>
                {checklistTwo[1] && (
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">{checklistTwo[1]}</div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-solid rounded mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-700">{checklistThree[0]}</div>
                {checklistThree[1] && (
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">{checklistThree[1]}</div>
                )}
              </div>
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

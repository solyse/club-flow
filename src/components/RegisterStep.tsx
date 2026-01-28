import { useMemo, useState } from 'react';
import { User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
}

export function RegisterStep({ contactInfo, onSubmit, onBack, products = [] }: RegisterStepProps) {
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

  // Extract phone code and phone number from contactInfo
  const getPhoneCodeAndNumber = (): { phoneCode: string; phone: string } => {
    if (isEmail) {
      // Get phone code from location cache
      const location = storage.getLocation<LocationInfo>();
      const phoneCode = location?.country_metadata?.calling_code || '+1';
      return { phoneCode, phone: formData.phone.replace(/[^0-9]/g, '') };
    } else {
      // Extract from contactInfo (e.g., "+8801915076890")
      const phoneWithCode = contactInfo.trim();
      
      // Try to extract country code
      // Pattern: starts with + followed by 1-4 digits
      const codeMatch = phoneWithCode.match(/^(\+[0-9]{1,4})/);
      const phoneCode = codeMatch ? codeMatch[1] : '+1';
      
      // Get phone number without country code
      const phoneNumber = codeMatch 
        ? phoneWithCode.replace(codeMatch[1], '').replace(/[^0-9]/g, '')
        : phoneWithCode.replace(/[^0-9]/g, '').slice(-10); // Take last 10 digits if no code found
      
      return { phoneCode, phone: phoneNumber };
    }
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
    <div>
      <div className="text-center mb-6 sm:mb-10 px-2">
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <User className="w-7 h-7 sm:w-8 sm:h-8 text-gray-600" />
        </div>
        <h1 className="mb-4 sm:mb-6">Create Your BagCaddie Profile</h1>
        <p className="text-gray-900">
          Just a few details to get your shipment started.
        </p>
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">Email {hasEmail ? '' : hasPhone ? '(optional)' : <span className="text-red-500">*</span>}</Label>
              <Input
                id="email"
                type="email"
                placeholder={hasPhone ? 'Enter your email (optional)' : 'Enter your email *'}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number {hasPhone ? '' : hasEmail ? '(optional)' : <span className="text-red-500">*</span>}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={hasEmail ? 'Enter your phone number (optional)' : 'Enter your phone number *'}
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="itemType">Item Type <span className="text-red-500">*</span></Label>
              <Select
                value={formData.itemType}
                onValueChange={(value) => handleChange('itemType', value)}
              >
                <SelectTrigger id="itemType">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.length > 0 ? (
                    productOptions.map((p) => (
                      <SelectItem 
                        key={String(p.id)} 
                        value={String(p.id)}
                      >
                        {p.name || 'Unknown Product'}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No products available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-black hover:bg-gray-800 text-white text-sm sm:text-base"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Creating...' : 'Continue to Booking'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useRef, useEffect } from 'react';
import { Mail, Phone, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PhoneInput } from './ui/PhoneInput';
import { AccessTabs, type TabType } from './AccessTabs';

interface PhoneValidation {
  value: string;
  isValid: boolean;
  countryCode: string;
  nationalNumber: string;
  setValue: (value: string) => void;
}

interface AccessFormProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  // Mobile tab props
  phone: PhoneValidation;
  // Email tab props
  contact: string;
  onContactChange: (value: string) => void;
  // Club code tab props
  clubCode: string[];
  onClubCodeChange: (index: number, value: string) => void;
  onClubCodeKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClubCodePaste: (e: React.ClipboardEvent) => void;
  // Form props
  isFormValid: boolean;
  isLoading: boolean;
  isLoadingClubCode: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onQRScanClick: () => void;
  // Optional props
  emailAutoFocus?: boolean;
  clubCodeInputRefs?: React.MutableRefObject<(HTMLInputElement | null)[]>;
}

export function AccessForm({
  activeTab,
  onTabChange,
  phone,
  contact,
  onContactChange,
  clubCode,
  onClubCodeChange,
  onClubCodeKeyDown,
  onClubCodePaste,
  isFormValid,
  isLoading,
  isLoadingClubCode,
  error,
  onSubmit,
  onQRScanClick,
  emailAutoFocus = false,
  clubCodeInputRefs,
}: AccessFormProps) {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const internalClubCodeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const refsToUse = clubCodeInputRefs || internalClubCodeInputRefs;

  // Auto-focus email input when switching to email tab
  useEffect(() => {
    if (activeTab === 'email' && emailInputRef.current) {
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [activeTab]);

  return (
    <>
      {/* Tabs */}
      <AccessTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          onTabChange(tab);
        }}
      />

      <form onSubmit={onSubmit}>
        {/* Mobile Tab Content */}
        {activeTab === 'mobile' && (
          <div className="mb-4">
            <Label htmlFor="contact" className="mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              Mobile number
            </Label>
            <PhoneInput
              value={phone.value}
              onChange={phone.setValue}
              isValid={phone.isValid}
              countryCode={phone.countryCode}
              nationalNumber={phone.nationalNumber}
            />
            <p className="text-sm text-gray-500 mt-2">
              We'll send a 6-digit code to verify your identity.
            </p>
          </div>
        )}

        {/* Email Tab Content */}
        {activeTab === 'email' && (
          <div className="mb-4">
            <Label htmlFor="contact" className="mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              Email address
            </Label>
            <Input
              ref={emailInputRef}
              autoFocus={emailAutoFocus}
              id="contact"
              type="email"
              placeholder="Enter your email"
              value={contact}
              onChange={(e) => onContactChange(e.target.value)}
              className="w-full h-11"
            />
            <p className="text-sm text-gray-500 mt-2">
              We'll send a 6-digit code to your email.
            </p>
          </div>
        )}

        {/* Club Code Tab Content */}
        {activeTab === 'club_code' && (
          <div className="mb-4">
            <h3 className="mb-4 text-[#111111] text-sm sm:text-base">
              Enter the 8-digit code from your bag tag
            </h3>

            {/* 8-digit input boxes */}
            <div className="flex justify-center gap-1 sm:gap-1 mb-6 bc-otp-inputs">
              {clubCode.map((char, index) => (
                <input
                  key={index}
                  ref={(el) => (refsToUse.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={char}
                  placeholder=""
                  onChange={(e) => onClubCodeChange(index, e.target.value)}
                  onKeyDown={(e) => onClubCodeKeyDown(index, e)}
                  onPaste={index === 0 ? onClubCodePaste : undefined}
                  className="w-[38px] h-[40px] sm:w-[52px] sm:h-[50px] px-[3px] sm:px-[8px] text-center text-base sm:text-lg border-1 border-gray-300 rounded-[6px] focus:border-[#C8A654] focus:ring-2 focus:ring-[#C8A654] focus:outline-none transition-all"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Scan QR Code Button */}
            <Button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onQRScanClick();
              }}
              className="w-[140px] mb-4 border-[#C8A654] text-[#C8A654] bg-[rgba(179,128,43,0.08)] rounded-[6px] h-[30px] px-2 hover:bg-[#C8A654]/10"
            >
              <Camera className="w-4 h-4 mr-1" />
              Scan QR code
            </Button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-2">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Continue Button */}
        <Button
          type="submit"
          className="w-full bg-[#B3802B] hover:bg-[#B89544] text-white h-11 rounded-lg"
          disabled={(activeTab === 'club_code' ? isLoadingClubCode : isLoading) || !isFormValid}
        >
          {activeTab === 'club_code'
            ? (isLoadingClubCode ? 'Validating…' : 'Continue')
            : (isLoading ? 'Checking…' : 'Continue')
          }
        </Button>

        {/* Helper text */}
        {activeTab !== 'club_code' && (
          <p className="text-center text-sm text-gray-500 mt-3">
            Next: Verify your 6-digit code.
          </p>
        )}
      </form>
    </>
  );
}

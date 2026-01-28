import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { toast } from 'sonner';
import { apiService, EventMetaObject } from '../services/api';
import { storage } from '../services/storage';
import AnalyticsService from '../services/analytics';
import { generateEventQuote } from '../services/quoteUtils';

interface VerifyStepProps {
  contactInfo: string;
  onSubmit: (code: string, hasPartner: boolean) => void;
  onBack: () => void;
  redirectToBooking: () => void | Promise<void>;
  onSetCurrentStep: (step: string) => void;
  eventData?: EventMetaObject | null;
}

export function VerifyStep({ contactInfo, onSubmit, onBack, redirectToBooking, onSetCurrentStep, eventData }: VerifyStepProps) {
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const isEmail = contactInfo.includes('@');

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) return;

    try {
      setIsLoading(true);
      const isEmail = contactInfo.includes('@');
      const payload = {
        code,
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
          // Track OTP success event
          AnalyticsService.trackOtpSuccess(isEmail ? 'email' : 'phone', true);
          console.log("OTP Success Fired", { method: isEmail ? 'email' : 'phone', isNewUser: true });
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

              // If we have event data, generate quote from partner address to event destination
              if (eventData) {
                generateEventQuote(eventData, partnerData);
              }
            }
            storage.setContactInfo(partnerPayload);
            redirectToBooking();
          } else {
            storage.setContactInfo(partnerPayload);
            onSetCurrentStep('register');
          }


        } catch (partnerErr) {
          // If partner check fails, assume no partner
          console.error('Error checking partner:', partnerErr);
          hasPartner = false;
        }

      } else {
        setError((resp as any)?.data?.message || 'Invalid verification code');
        toast.error((resp as any)?.data?.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('Unable to verify code. Please try again.');
      toast.error('Unable to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;

    try {
      setIsResending(true);
      setError('');
      const isEmail = contactInfo.includes('@');
      const partnerPayload = isEmail
        ? { email: contactInfo }
        : { phone: contactInfo };

      // Try to get partner info first
      const resp = await apiService.getPartner(partnerPayload);
      const partnerSuccess = (resp as any)?.data?.success === true;
      let partner = null;

      if (partnerSuccess) {
        partner = (resp as any).data.data;
      }

      // Always send OTP, regardless of partner found
      const otpPayload = {
        type: isEmail ? ('email' as const) : ('phone' as const),
        first_name: partner?.firstName || 'User',
        last_name: partner?.lastName || '',
        email: partner?.email || (isEmail ? contactInfo : undefined),
        phone: partner?.phone || (!isEmail ? contactInfo : undefined),
      };

      const otpResp = await apiService.sendOtp(otpPayload);
      const otpSuccess = (otpResp as any)?.data?.success === true;

      if (otpSuccess) {
        // Track OTP start event
        AnalyticsService.trackOtpStart(isEmail ? 'email' : 'phone');
        console.log("OTP Start Fired", { method: isEmail ? 'email' : 'phone' });
        setResendTimer(30);
        setCanResend(false);
        setCode('');
        toast.success('Code resent successfully');
      } else {
        const errorMsg = (otpResp as any)?.data?.message || 'Failed to resend verification code.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Unable to resend code. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Resend OTP error:', err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div>
      <div className="text-left mb-6">
        <p className="text-gray-900">
          Enter the 6-digit code sent to your {isEmail ? 'email' : 'phone'}
        </p>
      </div>

      <div className="bg-white">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="flex justify-start mb-6">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value)}
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="!border-[#d1d5db] !border !rounded-[6px] h-[40px] w-[46px] min-[430px]:w-[55px] data-[active=true]:!border-[#c8a654]" />
                  <InputOTPSlot index={1} className="!border-[#d1d5db] !border !rounded-[6px] h-[40px] w-[46px] min-[430px]:w-[55px] data-[active=true]:!border-[#c8a654]" />
                  <InputOTPSlot index={2} className="!border-[#d1d5db] !border !rounded-[6px] h-[40px] w-[46px] min-[430px]:w-[55px] data-[active=true]:!border-[#c8a654]" />
                  <InputOTPSlot index={3} className="!border-[#d1d5db] !border !rounded-[6px] h-[40px] w-[46px] min-[430px]:w-[55px] data-[active=true]:!border-[#c8a654]" />
                  <InputOTPSlot index={4} className="!border-[#d1d5db] !border !rounded-[6px] h-[40px] w-[46px] min-[430px]:w-[55px] data-[active=true]:!border-[#c8a654]" />
                  <InputOTPSlot index={5} className="!border-[#d1d5db] !border !rounded-[6px] h-[40px] w-[46px] min-[430px]:w-[55px] data-[active=true]:!border-[#c8a654]" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <div className="text-left mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="text-left mb-6">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className={`text-sm bg-[rgba(179,128,43,0.08)] rounded-[6px] h-[10px] px-2 ${isResending ? 'text-gray-400 cursor-not-allowed bg-transparent' : 'text-[#C8A654] hover:text-[#B89544]'}`}
                >
                  {isResending ? (
                    'Sending...'
                  ) : (
                    <>
                      Resend code
                    </>
                  )}
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Didn't get it? Resend code in {resendTimer}s
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end align-stretch gap-3">
            <Button
              type="button"
              onClick={onBack}
              className="flex-1 max-w-[100px] bg-gray-200 text-gray-900"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#C8A654] hover:bg-[#B89544] text-white max-w-[100px]"
              disabled={code.length !== 6 || isLoading}
            >
              {isLoading ? 'Verifying…' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

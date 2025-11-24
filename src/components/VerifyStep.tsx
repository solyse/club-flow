import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { toast } from 'sonner';
import { apiService } from '../services/api';
import { storage } from '../services/storage';

interface VerifyStepProps {
  contactInfo: string;
  onSubmit: (code: string, hasPartner: boolean) => void;
  onBack: () => void;
  redirectToBooking: () => void;
}

export function VerifyStep({ contactInfo, onSubmit, onBack, redirectToBooking }: VerifyStepProps) {
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');

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
        
        // onSubmit(code, hasPartner);
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
      <div className="text-center mb-6 sm:mb-10 px-2">
        <h1 className="mb-4 sm:mb-6">Verify Your Code</h1>
        <p className="text-gray-900">
          Enter the 6-digit code we sent to
        </p>
        <p className="font-medium text-gray-900 mt-1 break-words">{contactInfo}</p>
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="flex justify-center mb-6">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value)}
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

            {error && (
              <div className="text-center mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="text-center mb-6">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className={`text-sm ${isResending ? 'text-gray-400 cursor-not-allowed' : 'text-[#C8A654] hover:text-[#B89544]'}`}
                >
                  {isResending ? (
                    'Sending...'
                  ) : (
                    <>
                      Didn't get it? <span className="underline">Resend code</span>
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

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#C8A654] hover:bg-[#B89544] text-white"
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

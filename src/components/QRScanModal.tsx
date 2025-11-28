import { useState, useRef, useEffect } from 'react';
import type { QRScannerRef } from './QRScanner';
import { Camera, Hash, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { apiService, CustomerData } from '../services/api';
import { QRScanner } from './QRScanner';

interface QRScanModalProps {
  onClose: () => void;
  onSuccess?: (customerData: CustomerData) => void;
}

export function QRScanModal({ onClose, onSuccess }: QRScanModalProps) {
  const [mode, setMode] = useState<'scan' | 'enter'>('scan');
  const [code, setCode] = useState<string[]>(Array(8).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isScannerPaused, setIsScannerPaused] = useState(false);
  const [shouldStopScanner, setShouldStopScanner] = useState(false);
  const scannerRef = useRef<QRScannerRef | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastApiCallTimeRef = useRef<number>(0);
  const isApiCallInProgressRef = useRef<boolean>(false);

  // Stop scanner when switching away from scan mode
  useEffect(() => {
    if (mode !== 'scan') {
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
      setShouldStopScanner(true);
      setIsScannerPaused(false);
    } else {
      // Reset when switching back to scan mode
      setShouldStopScanner(false);
      setIsScannerPaused(false);
    }
  }, [mode]);

  const handleCodeChange = (index: number, value: string) => {
    // Allow alphanumeric characters (letters and numbers)
    if (value && !/^[A-Za-z0-9]$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.toUpperCase(); // Convert to uppercase for consistency
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 8);
    // Allow alphanumeric characters and convert to uppercase
    const chars = pastedData.split('').filter(char => /^[A-Za-z0-9]$/.test(char));
    
    const newCode = [...code];
    chars.forEach((char, index) => {
      if (index < 8) {
        newCode[index] = char.toUpperCase();
      }
    });
    setCode(newCode);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex(c => !c);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[7]?.focus();
    }
  };

  const isCodeComplete = code.every(digit => digit !== '');

  const handleContinue = async () => {
    if (!isCodeComplete) return;
    setIsLoading(true);
    setError('');
    
    try {
      const qrCode = code.join('');
      const response = await apiService.validateQRCode(qrCode);
      
      if (apiService.isSuccessResponse(response)) {
        // Success - call the onSuccess callback with customer data
        onSuccess?.(response.data.data);        
        onClose();
      } else {
        // Error - show error message
        setError(apiService.getErrorMessage(response));
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('QR Code validation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup scanner when modal closes
  const handleModalClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
    }
    setShouldStopScanner(true);
    setIsScannerPaused(false);
    // Reset scanner state
    lastScannedCodeRef.current = null;
    lastApiCallTimeRef.current = 0;
    isApiCallInProgressRef.current = false;
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {mode === 'scan' ? 'Scan your bag QR Code' : 'Enter QR Code'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {mode === 'scan' 
              ? "Position your BagCaddie tag's QR code within the camera frame to scan it."
              : "Enter the 8-digit code from your bag tag."
            }
          </DialogDescription>
        </DialogHeader>
        
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={mode === 'scan' ? 'default' : 'outline'}
            className={mode === 'scan' ? 'flex-1 bg-[#C8A654] hover:bg-[#B89544] text-white text-xs sm:text-sm' : 'flex-1 text-xs sm:text-sm'}
            onClick={() => {
              if (mode !== 'scan') {
                // Stop scanner if switching to scan mode from enter mode
                setMode('scan');
                setError('');
              }
            }}
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden xs:inline">Scan QR Code</span>
            <span className="xs:hidden">Scan</span>
          </Button>
          <Button
            type="button"
            variant={mode === 'enter' ? 'default' : 'outline'}
            className={mode === 'enter' ? 'flex-1 bg-[#C8A654] hover:bg-[#B89544] text-white text-xs sm:text-sm' : 'flex-1 text-xs sm:text-sm'}
            onClick={() => {
              if (mode !== 'enter') {
                // Stop scanner when switching to enter mode
                if (scannerRef.current) {
                  scannerRef.current.stop();
                }
                setShouldStopScanner(true);
                setIsScannerPaused(false);
                setMode('enter');
                setError('');
              }
            }}
          >
            <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden xs:inline">Enter QR Code</span>
            <span className="xs:hidden">Enter</span>
          </Button>
        </div>

        <div className="py-4">
          {mode === 'scan' ? (
            // Scan Mode
            <div>
              <QRScanner
                  ref={scannerRef}
                  onScanSuccess={async (code) => {
                    // Prevent multiple API calls for the same code
                    const now = Date.now();
                    const timeSinceLastCall = now - lastApiCallTimeRef.current;
                    const MIN_TIME_BETWEEN_CALLS = 2000; // 2 seconds between calls for same code
                    
                    // Skip if:
                    // 1. Same code was just scanned recently (within 2 seconds)
                    // 2. An API call is already in progress
                    // 3. Same code is being processed
                    if (
                      isApiCallInProgressRef.current ||
                      (lastScannedCodeRef.current === code && timeSinceLastCall < MIN_TIME_BETWEEN_CALLS)
                    ) {
                      return;
                    }
                    
                    // Update tracking
                    lastScannedCodeRef.current = code;
                    lastApiCallTimeRef.current = now;
                    isApiCallInProgressRef.current = true;
                    
                    // Pause scanning while validating
                    setIsScannerPaused(true);
                    setIsLoading(true);
                    setError('');
                    
                    try {
                      const response = await apiService.validateQRCode(code);
                      
                      if (apiService.isSuccessResponse(response)) {
                        // Success - stop scanner and call success callback
                        setShouldStopScanner(true);
                        scannerRef.current?.stop();
                        onSuccess?.(response.data.data);
                        onClose();
                      } else {
                        // Error - resume scanning and show error message
                        setError(apiService.getErrorMessage(response));
                        setIsScannerPaused(false); // Resume scanning
                        // Clear last scanned code so same code can be retried after delay
                        setTimeout(() => {
                          lastScannedCodeRef.current = null;
                        }, 3000);
                      }
                    } catch (err) {
                      // Error - resume scanning and show error message
                      setError('An unexpected error occurred. Please try again.');
                      console.error('QR Code validation error:', err);
                      setIsScannerPaused(false); // Resume scanning
                      // Clear last scanned code so same code can be retried after delay
                      setTimeout(() => {
                        lastScannedCodeRef.current = null;
                      }, 3000);
                    } finally {
                      setIsLoading(false);
                      isApiCallInProgressRef.current = false;
                    }
                  }}
                  onError={(errorMessage) => {
                    setError(errorMessage);
                  }}
                  onClose={() => {
                    setShouldStopScanner(true);
                    onClose();
                  }}
                  shouldStopOnScan={shouldStopScanner}
                  isPaused={isScannerPaused}
                />
                
                {/* Error message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                
                {/* Loading overlay */}
                {isLoading && (
                  <div className="mt-4 flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#C8A654] mr-2" />
                    <p className="text-sm text-gray-600">Validating QR code...</p>
                  </div>
                )}
              </div>
          ) : (
            // Enter Mode
            <div className="text-center">
              <h3 className="mb-4 sm:mb-6 text-[#111111] text-sm sm:text-base">
                Enter 8 digit code<br />on bag tag
              </h3>
              
              {/* 8-digit input boxes */}
              <div className="flex justify-center gap-1 sm:gap-2 mb-6 sm:mb-8 bc-otp-inputs">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    placeholder=""
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-9 h-12 sm:w-12 sm:h-16 text-center text-base sm:text-lg border-2 border-gray-300 rounded-lg focus:border-[#C8A654] focus:ring-2 focus:ring-[#C8A654] focus:outline-none transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#C8A654] hover:bg-[#B89544] text-white"
                  disabled={!isCodeComplete || isLoading}
                  onClick={handleContinue}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

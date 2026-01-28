import { useState, useRef, useEffect } from 'react';
import type { QRScannerRef } from './QRScanner';
import { Loader2 } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isScannerPaused, setIsScannerPaused] = useState(false);
  const [shouldStopScanner, setShouldStopScanner] = useState(false);
  const scannerRef = useRef<QRScannerRef | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastApiCallTimeRef = useRef<number>(0);
  const isApiCallInProgressRef = useRef<boolean>(false);

  // Reset scanner state when modal opens
  useEffect(() => {
    setError('');
    setShouldStopScanner(false);
    setIsScannerPaused(false);
    lastScannedCodeRef.current = null;
    lastApiCallTimeRef.current = 0;
    isApiCallInProgressRef.current = false;
  }, []);

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
      <DialogContent
        className="sm:max-w-[500px] max-h-[50vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Scan your BagCaddie Tag
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Position the QR code on your bag tag within the frame
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <QRScanner
            ref={scannerRef}
            onScanSuccess={async (code, type) => {
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
                const response = await apiService.validateQRCode(code, type);

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
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';

interface QRScannerProps {
  onScanSuccess: (code: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  shouldStopOnScan?: boolean; // If true, stops scanning immediately when code is found. If false, keeps scanning.
  isPaused?: boolean; // If true, pauses scanning (e.g., during API call)
}

export interface QRScannerRef {
  stop: () => void;
}

declare global {
  interface Window {
    ZXing: any;
  }
}

export const QRScanner = forwardRef<QRScannerRef, QRScannerProps>(
  ({ onScanSuccess, onError, onClose, shouldStopOnScan = false, isPaused = false }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  // Extract and validate code from URL
  const extractCodeFromURL = (url: string): string | null => {
    try {
      // Check if URL contains "item"
      if (!url.toLowerCase().includes('item')) {
        return null;
      }

      // Extract code from URL pattern: https://bagcaddie.com/item/?KW0UXZT3
      let code: string | null = null;

      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname.toLowerCase();
        
        // Check if pathname contains "item"
        if (!pathname.includes('item')) {
          return null;
        }

        // Try to get code from query parameters
        // Pattern: /item/?CODE or /item?CODE
        const searchParams = urlObj.search;
        if (searchParams) {
          // Extract from query string like ?KW0UXZT3 (no parameter name)
          const queryMatch = searchParams.match(/\?([A-Za-z0-9]{8})$/);
          if (queryMatch && queryMatch[1]) {
            code = queryMatch[1];
          } else {
            // Try query parameters
            const codeParam = urlObj.searchParams.get('code') || 
                             urlObj.searchParams.get('c') || 
                             urlObj.searchParams.get('id');
            if (codeParam) {
              code = codeParam;
            }
          }
        } else {
          // Try to extract from path like /item/CODE
          const pathMatch = pathname.match(/\/item\/([A-Za-z0-9]{8})/i);
          if (pathMatch && pathMatch[1]) {
            code = pathMatch[1];
          }
        }
      } catch {
        // If URL parsing fails, try regex extraction
        // Pattern: /item/?CODE
        const match = url.match(/\/item\/?\?([A-Za-z0-9]{8})/i);
        if (match && match[1]) {
          code = match[1];
        } else {
          // Try to extract any 8-character alphanumeric code near "item"
          const codeMatch = url.match(/item[\/\?]([A-Za-z0-9]{8})/i);
          if (codeMatch && codeMatch[1]) {
            code = codeMatch[1];
          }
        }
      }

      // Validate code is exactly 8 characters alphanumeric
      if (code && /^[A-Za-z0-9]{8}$/.test(code)) {
        return code.toUpperCase();
      }

      return null;
    } catch (err) {
      console.error('Error extracting code from URL:', err);
      return null;
    }
  };

  const startScanning = useCallback(async () => {
    try {
      if (!window.ZXing) {
        if (isMountedRef.current) {
          setError('QR scanner library not loaded');
          onError?.('QR scanner library not loaded');
          setIsLoading(false);
        }
        return;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Check if component is still mounted
      if (!isMountedRef.current || !videoRef.current) {
        // Clean up stream if component unmounted
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        return;
      }

      try {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Play video with error handling
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }

        // Double check component is still mounted after play
        if (!isMountedRef.current) {
          stopScanning();
          return;
        }

        setIsScanning(true);

        // Initialize ZXing reader
        const { BrowserMultiFormatReader } = window.ZXing;
        if (!BrowserMultiFormatReader) {
          throw new Error('ZXing BrowserMultiFormatReader not available');
        }

        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        // Start decoding
        codeReader.decodeFromVideoDevice(
          null, // Use default camera
          videoRef.current,
          (result: any, err: any) => {
            // Skip processing if component unmounted or paused
            if (!isMountedRef.current || isPaused) {
              return;
            }

            if (result) {
              const scannedText = result.getText();
              console.log('scannedText', scannedText);
              const extractedCode = extractCodeFromURL(scannedText);
              console.log('extractedCode', extractedCode);
              if (extractedCode) {
                // Only stop scanning if shouldStopOnScan is true
                // Otherwise, continue scanning and let parent handle the API call
                if (shouldStopOnScan) {
                  stopScanning();
                }
                
                // Call success callback with extracted code
                onScanSuccess(extractedCode);
              } else {
                // Invalid QR code format - show error but keep scanning
                console.warn('Invalid QR code format');
                if (isMountedRef.current) {
                  setError('Invalid QR code format. Please scan a valid BagCaddie tag.');
                  // Clear error after 3 seconds
                  setTimeout(() => {
                    if (isMountedRef.current) {
                      setError('');
                    }
                  }, 3000);
                }
              }
            } else if (err && err.name !== 'NotFoundException') {
              // NotFoundException is normal when no QR code is detected
              // Only set error for actual errors, not NotFoundException
              // if (err.name !== 'NotFoundException' && !error) {
              //   console.error('Scanning error:', err);
              // }
            }
          }
        );
      } catch (playError: any) {
        // Handle play() interruption errors
        if (playError.name !== 'AbortError' && playError.name !== 'NotAllowedError') {
          if (isMountedRef.current) {
            const errorMsg = 'Failed to start camera. Please try again.';
            setError(errorMsg);
            onError?.(errorMsg);
            setIsLoading(false);
            setIsScanning(false);
          }
        }
        // Clean up stream on error
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        if (isMountedRef.current && playError.name === 'AbortError' || playError.name === 'NotAllowedError') {
          setIsLoading(false);
          setIsScanning(false);
        }
      }
    } catch (err: any) {
      if (!isMountedRef.current) {
        return;
      }
      
      const errorMessage = err.name === 'NotAllowedError' 
        ? 'Camera access denied. Please allow camera permissions.'
        : err.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : err.message || 'Failed to access camera. Please try again.';
      
      setError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false);
      setIsScanning(false);
    }
  }, [isPaused, shouldStopOnScan, onScanSuccess, onError]);

  // Load ZXing library and start scanning
  useEffect(() => {
    // Prevent re-initialization if already initialized
    // Don't prevent if there's just a scan error (invalid QR code) - allow retry
    if (codeReaderRef.current || streamRef.current) {
      return;
    }

    let script: HTMLScriptElement | null = null;
    let mounted = true;

    const loadLibrary = () => {
      // Check if already loaded
      if (window.ZXing) {
        if (mounted) {
          setIsLoading(false);
          startScanning();
        }
        return;
      }

      script = document.createElement('script');
      script.src = 'https://unpkg.com/@zxing/library@latest';
      script.async = true;
      script.onload = () => {
        if (mounted) {
          setIsLoading(false);
          startScanning();
        }
      };
      script.onerror = () => {
        if (mounted) {
          setError('Failed to load QR scanner library');
          setIsLoading(false);
          onError?.('Failed to load QR scanner library');
        }
      };
      document.body.appendChild(script);
    };

    loadLibrary();

    return () => {
      mounted = false;
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      stopScanning();
    };
  }, [startScanning, onError, error]);

  const stopScanning = () => {
    setIsScanning(false);

    // Stop ZXing reader
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (err) {
        // Ignore errors during cleanup
      }
      codeReaderRef.current = null;
    }

    // Stop camera stream
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (err) {
        // Ignore errors during cleanup
      }
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
        videoRef.current.load(); // Reset video element
      } catch (err) {
        // Ignore errors during cleanup
      }
    }
  };

  // Expose stop method via ref
  useImperativeHandle(ref, () => ({
    stop: stopScanning,
  }));

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopScanning();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B3802B] mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading scanner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="aspect-video bg-gray-900 rounded-lg mb-4 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 sm:w-64 h-[100%] sm:h-64 border-2 sm:border-4 border-solid border-[#B3802B] rounded-lg relative">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-solid border-[#B3802B]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-solid border-[#B3802B]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-solid border-[#B3802B]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-solid border-[#B3802B]" />
          </div>
        </div>
        
        {/* Scanning indicator */}
        {isScanning && (
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
              Position QR code in frame
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
    </div>
  );
});

QRScanner.displayName = 'QRScanner';

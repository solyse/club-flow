import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  isLoading: boolean;
}

export function Loader({ isLoading }: LoaderProps) {
  // Prevent scrolling when loader is visible
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-sm"
      style={{ 
        pointerEvents: 'all',
        userSelect: 'none',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        // Prevent all keyboard interactions
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onContextMenu={(e) => {
        // Prevent right-click menu
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onDragStart={(e) => {
        // Prevent drag
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Loading application"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-[#C8A654] animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 mb-1">
            Loading...
          </p>
          <p className="text-sm text-gray-600">
            Please wait while we load the application...
          </p>
        </div>
      </div>
    </div>
  );
}


import { motion } from 'framer-motion';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function RateSpinnerOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Backdrop with blurred hero image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${ImageWithFallback})`,
          filter: 'blur(8px)',
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>
      
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative flex flex-col items-center gap-6 px-4"
      >
        {/* Gold Spinner */}
        <div className="relative" style={{ width: '80px', height: '80px' }}>
          {/* Outer ring with shadow */}
          <div className="quote-spinner-outer-ring" />
          
          {/* Animated spinner */}
          <motion.div
            className="quote-spinner-inner-ring"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </div>
        
        {/* Text */}
        <div className="text-center max-w-md">
          <h2 
            className="text-white mb-2"
            style={{ 
              fontSize: '24px', 
              fontWeight: 500, 
              fontFamily: 'Inter, sans-serif',
              opacity: 0.85
            }}
          >
            Securing the best rates…
          </h2>
          <p 
            className="text-white"
            style={{ 
              fontSize: '16px', 
              fontWeight: 400, 
              fontFamily: 'Inter, sans-serif',
              opacity: 0.7
            }}
          >
            Preparing options for your journey.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

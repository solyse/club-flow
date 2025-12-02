import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Smartphone, Plane, Clock, Truck, MapPin, Flag, Mail, Phone, Camera,Info } from 'lucide-react';
import { PlaceholderShippingCard } from './PlaceholderShippingCard';
import { RateFallbackBanner } from './RateFallbackBanner';
import { RateSpinnerOverlay } from './RateSpinnerOverlay';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getHeroImage } from '../data/heroImages';
import { ShippingRate, QuoteData, CustomerData } from '../services/api';
import { BcClubIcon } from './ui/BcClubIcon';

interface RateFallbackDemoProps {
  entryMode: 'QuickQuote' | 'StartJourney';
  from?: string;
  to?: string;
  rates?: ShippingRate[];
  quoteData?: QuoteData;
  onComplete?: (contactInfo: string) => void;
  onQRSuccess?: (customerData: CustomerData) => void;
  redirectToBooking?: () => void | Promise<void>;
}

const placeholderOptions = [
  {
    id: 'overnight',
    icon: Plane,
    title: 'Overnight',
    subtitle: 'Fastest Delivery',
    transitTime: '1 Business Day',
  },
  {
    id: 'expedited',
    icon: Clock,
    title: 'Expedited',
    subtitle: 'Best Value',
    transitTime: '2 Business Days',
  },
  {
    id: 'standard',
    icon: Truck,
    title: 'Standard',
    subtitle: 'Most Economical',
    transitTime: '3–5 Business Days',
  },
];

export function RateFallbackDemo({ entryMode, from, to, rates, quoteData, onComplete, onQRSuccess, redirectToBooking }: RateFallbackDemoProps) {
  const [screen, setScreen] = useState<'spinner' | 'fallback'>('spinner');
  
  // Auto-transition from spinner to fallback after 2 seconds
  useEffect(() => {
    if (screen === 'spinner') {
      const timer = setTimeout(() => {
        setScreen('fallback');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const handleRestart = () => {
    setScreen('spinner');
  };
  const heroImageUrl = to ? getHeroImage(to) : getHeroImage('');
  return (
    <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Spinner Screen */}
      <AnimatePresence>
        {screen === 'spinner' && <RateSpinnerOverlay />}
      </AnimatePresence>

      {/* Fallback Content (shows after spinner) */}
      {screen === 'fallback' && (
        <>
          {/* Hero Section */}
          <div className="relative h-[60vh] w-full overflow-visible">
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroImageUrl})` }}
              >
                <div className="absolute inset-0 bg-black/35" />
              </div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-black/30 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/20">
                  {/* From Location */}
                  <div className="flex items-center gap-3 mb-4">
                    {quoteData?.from?.source === 'bc_club' ? (
                      <BcClubIcon type="BcClub" strokeWidth={1} size={30} color="currentColor" className="w-7 h-7 text-white" />
                    ) :
                      quoteData?.from?.type === 'club' ? (
                        <BcClubIcon type="GolfClub" strokeWidth={1} size={30} color="#FFFFFF" className="w-7 h-7 text-white" />
                      ) : (
                        <MapPin className="w-7 h-7 text-white" strokeWidth={2} />
                      )}
                    <h1
                      className="text-white"
                      style={{
                        fontSize: 'clamp(28px, 4vw, 48px)',
                        fontWeight: 400,
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: 1.2
                      }}
                    >
                      {from}
                    </h1>
                  </div>

                  {/* Arrow */}
                  <div className="ml-10 mb-4">
                    <ArrowRight className="w-6 h-6 text-white rotate-90" strokeWidth={2} />
                  </div>

                  {/* To Location */}
                  <div className="flex items-center gap-3">
                    {quoteData?.to?.source === 'bc_club' ? (
                      <BcClubIcon type="BcClub" strokeWidth={1} size={30} color="currentColor" className="w-7 h-7 text-white" />
                    ) :
                      quoteData?.to?.type === 'club' ? (
                        <BcClubIcon type="GolfClub" strokeWidth={1} size={30} color="#FFFFFF" className="w-7 h-7 text-white" />
                      ) : (
                        <Flag className="w-7 h-7 text-white" strokeWidth={2} />
                      )}

                    <h1
                      className="text-white"
                      style={{
                        fontSize: 'clamp(28px, 4vw, 48px)',
                        fontWeight: 400,
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: 1.2
                      }}
                    >
                      {to}
                    </h1>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Overlapping Cards Section */}
          <div className="relative z-30 -mt-[180px] mb-8">
            <div className="max-w-6xl mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                {/* Placeholder Cards Section */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
                    {placeholderOptions.map((option, index) => (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
                      >
                        <PlaceholderShippingCard {...option} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Fallback Banner */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <RateFallbackBanner />
                </motion.div>
              </div>
            </div>
          </div>         
        </>
      )}
    </div>
  );
}

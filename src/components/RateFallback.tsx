import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, Clock, Truck, MapPin } from 'lucide-react';
import { PlaceholderShippingCard } from './PlaceholderShippingCard';
import { RateFallbackBanner } from './RateFallbackBanner';

interface RateFallbackProps {
  entryMode: 'QuickQuote' | 'StartJourney';  
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

export function RateFallback({ entryMode }: RateFallbackProps) {
  
  return (
    <div style={{ marginTop: '70px' }}>
     

      {/* Fallback Content (shows after spinner) */}
        <>
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
    </div>
  );
}

import { Search, ShoppingCart } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { defaultHeroImage } from '../data/heroImages';

export function Header() {
  return (
    <>
      {/* Hero Section */}
      <div className="relative h-64 sm:h-80 lg:h-96 w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src={defaultHeroImage}
            alt="Golf course landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <h2 className="text-white text-4xl sm:text-5xl lg:text-6xl tracking-wide text-center px-4">
            Create Your Journey
          </h2>
        </div>
      </div>
    </>
  );
}

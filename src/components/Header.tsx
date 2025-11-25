import { ImageWithFallback } from './figma/ImageWithFallback';
import { defaultHeroImage, defaultHeroVideo, getHeroImage, hasHeroImage } from '../data/heroImages';

interface HeaderProps {
  destination?: string;
}

export function Header({ destination }: HeaderProps) {
  // Check if destination has a specific hero image
  const hasSpecificHeroImage = destination ? hasHeroImage(destination) : false;
  const heroImageUrl = destination ? getHeroImage(destination) : defaultHeroImage;
  const shouldUseVideo = !hasSpecificHeroImage;

  return (
    <>
      {/* Hero Section */}
      <div className="relative h-64 sm:h-80 lg:h-96 w-full overflow-hidden">
        {/* Background - Video or Image */}
        <div className="absolute inset-0">
          {shouldUseVideo ? (
            <>
              {/* Video Background */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                poster={defaultHeroImage}
              >
                <source src={defaultHeroVideo} type="video/mp4" />
                {/* Fallback image if video fails to load */}
                <ImageWithFallback
                  src={defaultHeroImage}
                  alt="Golf course landscape"
                  className="w-full h-full object-cover"
                />
              </video>
            </>
          ) : (
            /* Image Background */
            <ImageWithFallback
              src={heroImageUrl}
              alt="Golf course landscape"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl tracking-wide text-center px-4">
            Create Your Journey
          </h1>
        </div>
      </div>
    </>
  );
}

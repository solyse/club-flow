import { motion } from 'framer-motion';
import { EventMetaObject } from '../services/api';

interface EventHeroProps {
  eventData: EventMetaObject;
  partnerLogo?: string | null;
  partnerDisplayName?: string | null;
}

// Helper function to get field value by key
const getFieldValue = (fields: EventMetaObject['fields'], key: string): string | null => {
  const field = fields.find(f => f.key === key);
  return field?.value || null;
};

// Helper function to get boolean field value by key
const getBooleanFieldValue = (fields: EventMetaObject['fields'], key: string): boolean => {
  const field = fields.find(f => f.key === key);
  if (!field) return false;
  // Handle both string "true"/"false" and boolean values
  if (typeof field.jsonValue === 'boolean') {
    return field.jsonValue;
  }
  if (field.value === 'true' || field.jsonValue === 'true') {
    return true;
  }
  return false;
};

// Helper function to get field reference by key
const getFieldReference = (fields: EventMetaObject['fields'], key: string): any | null => {
  const field = fields.find(f => f.key === key);
  return field?.reference || null;
};

// Helper function to format date
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
};

// Helper function to format date range
const formatDateRange = (startDate: string | null, endDate: string | null): string => {
  if (!startDate && !endDate) return '';
  if (!endDate) return formatDate(startDate);
  if (!startDate) return formatDate(endDate);
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // If same month and year: "January 21–25, 2026"
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      const month = start.toLocaleDateString('en-US', { month: 'long' });
      const startDay = start.getDate();
      const endDay = end.getDate();
      const year = start.getFullYear();
      return `${month} ${startDay}–${endDay}, ${year}`;
    }
    
    // If same year but different months: "January 21 – February 5, 2026"
    if (start.getFullYear() === end.getFullYear()) {
      const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
      const startDay = start.getDate();
      const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
      const endDay = end.getDate();
      const year = start.getFullYear();
      return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
    }
    
    // Different years: "January 21, 2025 – January 25, 2026"
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  } catch (error) {
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  }
};

export function EventHero({ eventData, partnerLogo, partnerDisplayName }: EventHeroProps) {
  const eventName = getFieldValue(eventData.fields, 'name');
  const eventSubtitle = getFieldValue(eventData.fields, 'event_subtitle');
  const eventStartDate = getFieldValue(eventData.fields, 'event_start_date');
  const eventEndDate = getFieldValue(eventData.fields, 'event_end_date');
  const heroImageRef = getFieldReference(eventData.fields, 'event_hero_image');
  const heroImageUrl = heroImageRef?.preview?.image?.url || '';
  const displayPartnerLogo = getBooleanFieldValue(eventData.fields, 'display_partner_logo');

  const dateRange = formatDateRange(eventStartDate, eventEndDate);

  return (
    <div className="relative h-[300px] sm:h-[350px] md:h-[450px] w-full overflow-visible">
      {/* Background Image */}
      {heroImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <div className="max-w-5xl mx-auto w-full flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center">
              {/* Partner Logo - Only show if display_partner_logo is true */}
              {displayPartnerLogo && partnerLogo && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={partnerLogo}
                    alt={partnerDisplayName || 'Partner Logo'}
                    className="max-h-16 md:max-h-20 w-auto object-contain"
                  />
                </div>
              )}
              {/* Event Name */}
              {eventName && (
                <h1
                  className="text-white mb-2"
                  style={{
                    fontSize: 'clamp(28px, 4vw, 48px)',
                    fontWeight: 400,
                    lineHeight: 1.2,
                  }}
                >
                  {eventName}
                </h1>
              )}

              {/* Event Subtitle */}
              {eventSubtitle && (
                <p className="text-base md:text-xl text-white/85 mb-3">
                  {eventSubtitle}
                </p>
              )}

              {/* Event Date Range */}
              {dateRange && (
                <p className="text-base md:text-xl text-white/85">
                  {dateRange}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

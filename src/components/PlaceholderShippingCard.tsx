import { LucideIcon } from 'lucide-react';

interface PlaceholderShippingCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  transitTime: string;
}

export function PlaceholderShippingCard({
  icon: Icon,
  title,
  subtitle,
  transitTime,
}: PlaceholderShippingCardProps) {
  return (
    <div 
      className="relative bg-white border-[1.5px] border-[#D4AF37] rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition-all duration-200"
      style={{ 
        fontFamily: 'Inter, sans-serif',
        padding: '24px 28px'
      }}
    >
      {/* Header Row: Icon + Service Level Name */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#D4AF37]/10">
          <Icon className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <h3 
          className="text-[#111111]"
          style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
        >
          {title}
        </h3>
      </div>

      {/* Gold Badge (Sub-Badge Text) */}
      <div className="mb-4 ml-[52px]">
        <span 
          className="text-[#D4AF37]"
          style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}
        >
          {subtitle}
        </span>
      </div>

      {/* Blurred Price Placeholder */}
      <div 
        className="mb-1 ml-[52px]"
        style={{ 
          width: '60px',
          height: '18px',
          borderRadius: '7px',
          background: '#EAEAEA',
          backdropFilter: 'blur(4px)'
        }}
      />

      {/* Transit Time Line */}
      <p 
        className="text-[#7A7A7A] ml-[52px]"
        style={{ 
          fontSize: '14px', 
          fontWeight: 400, 
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.4
        }}
      >
        Transit time: {transitTime}
      </p>
    </div>
  );
}

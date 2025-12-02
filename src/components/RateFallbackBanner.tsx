import { Info } from 'lucide-react';

export function RateFallbackBanner() {
  return (
    <div 
      className="border rounded-[20px] flex items-center gap-3"
      style={{ 
        background: '#F9F6F3',
        borderColor: '#E8DDBE',
        padding: '18px 24px',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <div 
          className="flex items-center justify-center rounded-full"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#FAF4E6'
          }}
        >
          <Info 
            className="text-[#D4AF37]" 
            size={20}
            strokeWidth={2} 
          />
        </div>
      </div>
      
      {/* Text Block */}
      <div className="flex-1">
        <h3 
          className="mb-1"
          style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#1B1B1B',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.3
          }}
        >
          Rates are being confirmed.
        </h3>
        <p 
          style={{ 
            fontSize: '16px', 
            fontWeight: 400, 
            color: '#6F6F6F',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.4
          }}
        >
          Final pricing will appear after verification.
        </p>
      </div>
    </div>
  );
}

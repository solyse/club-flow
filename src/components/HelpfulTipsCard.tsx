import { Package, Clock, Tag } from 'lucide-react';
import BagCaddieClubIcon from '../imports/Group2';

export function HelpfulTipsCard() {
  const mainTips = [
    {
      icon: Package,
      heading: 'What You Can Ship',
      content: (
        <>
          Ship your clubs or luggage — no box required. Use your own golf bag or buy a BagCaddie box online.{' '}
          <a href="#" className="text-[#C8A654] hover:underline">
            See full shipping guide →
          </a>
        </>
      )
    },
    {
      icon: Tag,
      heading: 'Preparing Your Bag',
      content: (
        <>
          Remove valuables, print your label, and attach it securely to your travel bag, shipping box or luggage. Prefer convenience? We'll mail you a label already in a holder.{' '}
          <a href="#" className="text-[#C8A654] hover:underline">
            See full preparation guide →
          </a>
        </>
      )
    },
    {
      icon: Clock,
      heading: 'When to Schedule',
      content: (
        <>
          Tell us when you need your bags — we'll guide your pickup date and service level. Schedule home pickup or drop off at a FedEx location.
        </>
      )
    }
  ];

  const bagCaddieClubTip = {
    icon: BagCaddieClubIcon,
    heading: 'BagCaddie Club',
    content: (
      <>
        Prefer a concierge experience?
        <br />
        Let your home club handle printing, packing, and pickup through the BagCaddie Club Partner program.{' '}
        <a 
          href="/pages/join-bagcaddie-club" 
          className="text-[#C8A654] hover:underline"
          aria-label="Refer your home club to become a BagCaddie Partner"
        >
          Refer your home club to become a partner →
        </a>
      </>
    )
  };

  const renderTip = (tip: typeof mainTips[0] | typeof bagCaddieClubTip, index: number) => {
    const Icon = tip.icon;
    const isCustomIcon = Icon === BagCaddieClubIcon;
    return (
      <div key={index} className="flex gap-2.5 sm:gap-3 mt-3">
        <div className="flex-shrink-0 mt-0.5">
          {isCustomIcon ? (
            <div className="w-5 h-5 sm:w-6 sm:h-6">
              <Icon />
            </div>
          ) : (
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#C8A654]" strokeWidth={2} />
          )}
        </div>
        <div>
          <div className="text-sm sm:text-base font-medium text-[#111111] mb-1">
            {tip.heading}
          </div>
          <div className="text-sm sm:text-[15px] text-[#6B7280] leading-relaxed">
            {tip.content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Main Tips Card */}
      <div className="w-full max-w-[480px] mx-auto mt-6 sm:mt-10">
        <div className="rounded-xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]" style={{ backgroundColor: '#F9F9F9' }}>
          {/* Header */}
          <h3 className="mb-3 sm:mb-4 text-base sm:text-lg text-[#111111]" style={{ fontFamily: 'Nunito Sans, sans-serif' }}>
            Helpful to Know Before You Ship
          </h3>

          {/* Tips List */}
          <div className="space-y-3 sm:space-y-4">
            {/* Main 3 tips - always visible */}
            {mainTips.map((tip, index) => renderTip(tip, index))}
            
            {/* BagCaddie Club tip - only on desktop (≥768px) */}
            <div>
              {renderTip(bagCaddieClubTip, 3)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

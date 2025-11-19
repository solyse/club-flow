import { useState, useRef, useEffect } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';

interface Country {
  code: string;
  abbreviation: string;
  name: string;
  flag: string;
  dialCode: string;
}

const countries: Country[] = [
  { code: '+1', abbreviation: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: '+1', abbreviation: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: '+44', abbreviation: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: '+61', abbreviation: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: '+880', abbreviation: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880' },
  { code: '+91', abbreviation: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: '+86', abbreviation: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
  { code: '+81', abbreviation: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: '+82', abbreviation: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82' },
  { code: '+49', abbreviation: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: '+33', abbreviation: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: '+39', abbreviation: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  { code: '+34', abbreviation: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
  { code: '+31', abbreviation: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
  { code: '+41', abbreviation: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
  { code: '+65', abbreviation: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: '+852', abbreviation: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852' },
  { code: '+64', abbreviation: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64' },
  { code: '+27', abbreviation: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: '+971', abbreviation: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
  { code: '+52', abbreviation: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52' },
];

interface CountryCodeSelectorProps {
  value: string;
  onChange: (country: Country) => void;
}

export function CountryCodeSelector({ value, onChange }: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = countries.find(c => c.abbreviation === value) || countries[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredCountries = countries.filter(country => {
    const query = searchQuery.toLowerCase();
    return (
      country.name.toLowerCase().includes(query) ||
      country.abbreviation.toLowerCase().includes(query) ||
      country.code.includes(query)
    );
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="appearance-none w-[135px] h-[52px] px-3 pr-4 rounded-lg border border-[#E0E0E0] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all bg-white text-[#111111] cursor-pointer flex items-center gap-2"
        style={{ fontSize: '15px', fontWeight: 400, fontFamily: 'Inter, sans-serif',padding: '.8em 15px .8em 15px' }}
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span>{selectedCountry.abbreviation}</span>
        <span className="text-[#666666]">{selectedCountry.code}</span>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-[#E0E0E0] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-50 overflow-hidden"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-[#E0E0E0]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]"/>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country, code, or abbreviation"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E0E0E0] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all text-[#111111] placeholder:text-[#999999]"
                style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif',paddingLeft: '22px', paddingRight: '0' }}
              />
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-[280px] overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected = country.abbreviation === selectedCountry.abbreviation;
                return (
                  <button
                    key={`${country.abbreviation}-${country.code}`}
                    type="button"
                    onClick={() => {
                      onChange(country);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-[#F5F5F5] transition-colors text-left ${
                      isSelected ? 'bg-[#F5F5F5]' : ''
                    }`}
                  >
                    {/* Checkmark or spacer */}
                    <div className="w-4 flex-shrink-0">
                      {isSelected && <Check className="w-4 h-4 text-[#D4AF37]" strokeWidth={2.5} />}
                    </div>

                    {/* Flag */}
                    <span className="text-xl flex-shrink-0">{country.flag}</span>

                    {/* Abbreviation */}
                    <span 
                      className="text-[#111111] w-8 flex-shrink-0"
                      style={{ fontSize: '15px', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}
                    >
                      {country.abbreviation}
                    </span>

                    {/* Code */}
                    <span 
                      className="text-[#111111] w-12 flex-shrink-0"
                      style={{ fontSize: '15px', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}
                    >
                      {country.code}
                    </span>

                    {/* Country Name */}
                    <span 
                      className="text-[#888888] flex-1"
                      style={{ fontSize: '15px', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}
                    >
                      {country.name}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-[#999999]" style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
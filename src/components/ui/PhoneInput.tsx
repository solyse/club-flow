import React from "react";
import { CountryCodeSelector } from "../CountryCodeSelector";

// Map country codes to abbreviations (default mapping)
const getCountryAbbreviation = (dialCode: string | null): string => {
    if (!dialCode) return 'US';

    const codeToAbbr: Record<string, string> = {
        '+1': 'US',
        '+44': 'GB',
        '+61': 'AU',
        '+880': 'BD',
        '+91': 'IN',
        '+86': 'CN',
        '+81': 'JP',
        '+82': 'KR',
        '+49': 'DE',
        '+33': 'FR',
        '+39': 'IT',
        '+34': 'ES',
        '+31': 'NL',
        '+41': 'CH',
        '+65': 'SG',
        '+852': 'HK',
        '+64': 'NZ',
        '+27': 'ZA',
        '+971': 'AE',
        '+52': 'MX',
    };

    return codeToAbbr[dialCode] || 'US';
};

export const PhoneInput = ({
    value,
    onChange,
    isValid,
    countryCode,
    nationalNumber,
}: {
    value: string;
    onChange: (v: string) => void;
    isValid: boolean;
    countryCode: string | null;
    nationalNumber: string;
}) => {
    const handleCountryChange = (country: { abbreviation: string; dialCode: string; code: string; name: string; flag: string }) => {
        const newValue = `${country.dialCode}${nationalNumber}`;
        onChange(newValue);
    };

    return (
        <>
            <div className="flex gap-1 mb-3">
                {/* Country Code Selector */}
                <CountryCodeSelector
                    value={getCountryAbbreviation(countryCode)}
                    onChange={handleCountryChange}
                />
                {/* National Number Input */}
                <input
                    type="tel"
                    autoFocus={true}
                    value={nationalNumber}
                    onChange={(e) => {
                        // Only allow digits
                        const num = e.target.value.replace(/\D/g, "");
                        // Use current country code or default to +1
                        const code = countryCode || '+1';
                        // Build the full phone number with country code
                        const newValue = `${code}${num}`;
                        // Call onChange to update the phone validation hook
                        onChange(newValue);
                    }}
                    className="flex-1 h-[52px] px-4 rounded-lg border border-[#E0E0E0] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all text-[#111111] placeholder:text-[#999999]"
                    style={{ fontSize: '15px', fontFamily: 'Inter, sans-serif' }}
                    placeholder="Enter your mobile number"
                />
            </div>
            {/* Validation Status - Only show when there's data */}
            {nationalNumber && nationalNumber.length > 0 && (
                <>
                    {!isValid && (
                        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2">
                            <p className="text-xs text-red-700">Please enter a valid phone number.</p>
                        </div>

                    )}
                </>
            )}
        </>
    );
};

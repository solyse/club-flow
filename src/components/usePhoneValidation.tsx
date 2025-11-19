import { useState, useCallback } from "react";

// Country codes sorted longest → shortest
const COUNTRY_CODES = [
  '+880', '+852', '+971', '+44', '+61', '+91', '+86', '+81', '+82',
  '+49', '+33', '+39', '+34', '+31', '+41', '+65', '+64', '+27', '+52', '+1'
];

// Optional: Per-country local number length rules
const COUNTRY_RULES: Record<string, { min: number; max: number }> = {
  '+880': { min: 10, max: 10 }, // Bangladesh
  '+91': { min: 10, max: 10 },  // India
  '+1': { min: 10, max: 10 },   // USA/Canada
  // fallback: 4–12 for others
};

export const extractCountryCode = (value: string): string | null => {
  if (!value.startsWith('+')) return null;
  return COUNTRY_CODES.find(code => value.startsWith(code)) ?? null;
};

export const normalizePhone = (value: string): string =>
  value.trim().replace(/[^\d+]/g, '');

export const validateE164 = (value: string): boolean => {
  const raw = normalizePhone(value);
  const countryCode = extractCountryCode(raw);
  if (!countryCode) return false;

  const nationalNumber = raw.slice(countryCode.length).replace(/\D/g, '');
  const totalDigits = raw.replace(/\D/g, '').length;

  // E.164 allows 7–15 digits (excluding "+")
  if (totalDigits < 7 || totalDigits > 15) return false;

  // Per-country rule (if exists)
  const rule = COUNTRY_RULES[countryCode];
  if (rule) {
    return (
      nationalNumber.length >= rule.min &&
      nationalNumber.length <= rule.max
    );
  }

  // Generic fallback
  return nationalNumber.length >= 4 && nationalNumber.length <= 12;
};


export const usePhoneValidation = () => {
  const [value, setValue] = useState("+1");
  const [isValid, setIsValid] = useState(false);
  const [countryCode, setCountryCode] = useState<string | null>("+1");
  const [nationalNumber, setNationalNumber] = useState("");

  const update = useCallback((input: string) => {
    // Ensure input starts with + and has a country code
    let clean = normalizePhone(input);
    
    // If input doesn't start with +, try to extract or default to +1
    if (!clean.startsWith('+')) {
      // If we have digits, assume they're a national number and prepend +1
      if (clean.length > 0) {
        clean = `+1${clean}`;
      } else {
        clean = '+1';
      }
    }
    
    setValue(clean);

    const code = extractCountryCode(clean);
    setCountryCode(code || '+1'); // Default to +1 if no code found

    const num = code ? clean.slice(code.length).replace(/\D/g, "") : clean.replace(/\D/g, "");
    setNationalNumber(num);

    setIsValid(validateE164(clean));
  }, []);

  return {
    value,
    countryCode,
    nationalNumber,
    isValid,
    setValue: update,
  };
};
import React, { useState, useRef, useEffect, useMemo } from "react";
import { countries, Country } from "../../utils/countries";

interface CountrySelectProps {
  value: string;
  onChange: (phoneCode: string) => void;
  placeholder?: string;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  placeholder = "Select Country",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected country by phone code - improved matching
  const selectedCountry = useMemo(() => {
    if (!value || !value.trim()) return null;
    
    const trimmedValue = value.trim();
    
    // Try exact match first
    let country = countries.find((c) => c.phone_code === trimmedValue);
    
    // If not found, try matching with phone codes that have dashes or multiple codes
    if (!country) {
      country = countries.find((c) => {
        // Handle phone codes like "+1-684" or "+1-809, +1-829, +1-849"
        const codes = c.phone_code.split(',').map(code => code.trim());
        return codes.some(code => {
          const trimmedCode = code.trim();
          return trimmedCode === trimmedValue || trimmedCode.split('-')[0] === trimmedValue.split('-')[0];
        });
      });
    }
    
    return country || null;
  }, [value]);

  // Filter countries based on search term
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.phone_code.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleSelect = (country: Country) => {
    onChange(country.phone_code);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <img
                src={selectedCountry.flag}
                alt={selectedCountry.name}
                className="w-5 h-5 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' fill='%23ccc'/%3E%3C/svg%3E";
                }}
              />
              <span className="text-sm font-medium">
                {selectedCountry.phone_code}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Country List */}
          <div className="max-h-56 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors ${
                    value && value.trim() === country.phone_code
                      ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500"
                      : ""
                  }`}
                >
                  <img
                    src={country.flag}
                    alt={country.name}
                    className="w-5 h-5 object-cover rounded flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' fill='%23ccc'/%3E%3C/svg%3E";
                    }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-shrink-0 min-w-[60px]">
                    {country.phone_code}
                  </span>
                  <span className="text-sm text-gray-800 dark:text-gray-200 truncate flex-1">
                    {country.name}
                  </span>
                  {value && value.trim() === country.phone_code && (
                    <svg
                      className="w-4 h-4 text-blue-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelect;


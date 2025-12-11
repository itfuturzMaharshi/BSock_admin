import React, { useState } from "react";

interface CostSelectionModalProps {
  isOpen: boolean;
  countries: string[];
  costsByCountry: Record<string, CostCharge[]>;
  selectedCosts: Record<string, string[]>;
  products: any[];
  onClose: () => void;
  onBack: () => void;
  onNext: (costs: Record<string, string[]>) => void;
  loading?: boolean;
}

interface CostCharge {
  _id: string;
  name: string;
  costType: "Percentage" | "Fixed";
  costField: string;
  costUnit?: string;
  value: number;
  minValue?: number | null;
  maxValue?: number | null;
  remark?: string;
  groupId?: string | null;
  isExpressDelivery?: boolean;
  isSameLocationCharge?: boolean;
}

const CostSelectionModal: React.FC<CostSelectionModalProps> = ({
  isOpen,
  countries,
  costsByCountry,
  selectedCosts,
  products,
  onClose,
  onBack,
  onNext,
  loading,
}) => {
  const [localSelected, setLocalSelected] = useState<Record<string, string[]>>(selectedCosts);

  // Helper function to check if cost is applicable based on product locations
  const isCostApplicable = (cost: CostCharge, country: string) => {
    // Map country name to code: "Hongkong" -> "HK", "Dubai" -> "D"
    const countryCode = country === 'Hongkong' ? 'HK' : 'D';
    
    // Helper function to normalize deliveryLocation to array
    const normalizeDeliveryLocation = (deliveryLocation: any): string[] => {
      if (Array.isArray(deliveryLocation)) {
        return deliveryLocation;
      }
      if (typeof deliveryLocation === 'string') {
        try {
          const parsed = JSON.parse(deliveryLocation);
          return Array.isArray(parsed) ? parsed : [deliveryLocation];
        } catch {
          return [deliveryLocation];
        }
      }
      return [];
    };
    
    if (cost.isExpressDelivery) {
      // Express delivery: show when currentLocation and deliveryLocation are NOT the same
      return products.some(p => {
        if (!p.currentLocation) return false;
        
        const deliveryLocations = normalizeDeliveryLocation(p.deliveryLocation);
        
        // Express delivery applies when locations don't match
        const isSameLocation = p.currentLocation === countryCode && 
          deliveryLocations.includes(countryCode);
        
        return !isSameLocation;
      });
    }
    
    if (cost.isSameLocationCharge) {
      // Same location charge: show when currentLocation matches country AND country is in deliveryLocation
      return products.some(p => {
        if (!p.currentLocation) return false;
        
        const deliveryLocations = normalizeDeliveryLocation(p.deliveryLocation);
        
        // Same location applies when currentLocation matches country AND country is in deliveryLocation
        return p.currentLocation === countryCode && 
          deliveryLocations.includes(countryCode);
      });
    }
    
    return true; // Other costs are always applicable
  };

  // Helper: ensure only one express cost per country
  const toggleCost = (country: string, cost: CostCharge) => {
    setLocalSelected((prev) => {
      const prevList = prev[country] || [];

      // If already selected, remove
      if (prevList.includes(cost._id)) {
        return { ...prev, [country]: prevList.filter((id) => id !== cost._id) };
      }

      let nextList = [...prevList];

      // Enforce express delivery single selection
      if (cost.isExpressDelivery) {
        nextList = nextList.filter((id) => {
          const existing = costsByCountry[country]?.find((c) => c._id === id);
          return existing ? !existing.isExpressDelivery : true;
        });
      }

      // Enforce group selection: if any in group, add all in group
      if (cost.groupId) {
        const groupMembers = costsByCountry[country]?.filter((c) => c.groupId === cost.groupId) || [];
        const groupIds = groupMembers.map((c) => c._id);
        const set = new Set([...nextList, ...groupIds]);
        nextList = Array.from(set);
      } else {
        nextList.push(cost._id);
      }

      return { ...prev, [country]: nextList };
    });
  };

  const handleNext = () => {
    onNext(localSelected);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Select Cost Modules</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {countries.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No countries found in the Excel file.</p>
          )}

          {countries.map((country) => {
            const charges = costsByCountry[country] || [];
            const selected = new Set(localSelected[country] || []);

            return (
              <div key={country} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{country}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selected.size} selected
                  </span>
                </div>

                {charges.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No costs available for this country.</p>
                ) : (
                  <div className="space-y-2">
                    {charges.filter(cost => isCostApplicable(cost, country)).map((cost) => {
                      const isSelected = selected.has(cost._id);
                      const isSameLocation = cost.isSameLocationCharge;
                      const isExpress = cost.isExpressDelivery;

                      // Basic hint for applicability; not blocking selection
                      const locationHint =
                        isExpress || isSameLocation
                          ? `(${isExpress ? "Express" : "Same-location"} charge)`
                          : "";

                      return (
                        <label
                          key={cost._id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCost(country, cost)}
                            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-800 dark:text-gray-200">{cost.name}</div>
                              {cost.groupId && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  Group: {cost.groupId}
                                </span>
                              )}
                              {locationHint && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200">
                                  {locationHint}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {cost.costType} {cost.value}
                              {cost.costType === "Percentage" ? "%" : ""}
                              {cost.costUnit ? ` • Unit: ${cost.costUnit}` : ""} • Field: {cost.costField}
                            </div>
                            {cost.remark && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cost.remark}</div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Calculating..." : "Next: Review"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CostSelectionModal;


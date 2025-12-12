import React, { useState } from "react";

interface FinalPreviewModalProps {
  isOpen: boolean;
  products: any[];
  onClose: () => void;
  onBack: () => void;
  onSubmit: () => void;
  loading?: boolean;
}

const FinalPreviewModal: React.FC<FinalPreviewModalProps> = ({
  isOpen,
  products,
  onClose,
  onBack,
  onSubmit,
  loading,
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-[1100px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Review & Submit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Click a product to see the margin and cost breakdown per deliverable.
        </p>

        <div className="space-y-3">
          {products.map((product, idx) => {
            const id = product._id || `prod-${idx}`;
            const isExpanded = expanded.has(id);

            return (
              <div
                key={id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => toggleExpand(id)}
                >
                  <div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-white">
                      {product.specification || "N/A"}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex gap-4">
                      <span>SKU: {product.skuFamilyCode || "N/A"}</span>
                      <span>Stock: {product.stock || 0}</span>
                      <span>MOQ: {product.moq || 1}</span>
                    </div>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {isExpanded ? "Hide details" : "Show details"}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-3">
                    {(product.countryDeliverables || []).map((cd: any, i: number) => (
                      <div key={i} className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-2">
                          <div className="font-semibold">{cd.country}</div>
                          <div>Final Price: {cd.calculatedPrice?.toFixed?.(2) ?? cd.calculatedPrice ?? "0"}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <div>Base Price: {cd.basePrice ?? cd.usd ?? 0}</div>
                          {cd.hkd && <div>HKD: {cd.hkd.toFixed ? cd.hkd.toFixed(2) : cd.hkd}</div>}
                          {cd.aed && <div>AED: {cd.aed.toFixed ? cd.aed.toFixed(2) : cd.aed}</div>}
                        </div>

                        {cd.margins?.filter((m: any) => m.type !== 'customerCategory').length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Margins</div>
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                              {cd.margins.filter((m: any) => m.type !== 'customerCategory').map((m: any, mi: number) => (
                                <div key={mi} className="flex justify-between">
                                  <span>{m.type}: {m.marginValue}{m.marginType === "percentage" ? "%" : ""}</span>
                                  <span>+{m.calculatedAmount?.toFixed?.(2) ?? m.calculatedAmount}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {cd.costs?.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Costs</div>
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                              {cd.costs.map((c: any, ci: number) => (
                                <div key={ci} className="flex justify-between">
                                  <span>
                                    {c.name} ({c.costType}{c.costType === "Percentage" ? "%" : ""})
                                  </span>
                                  <span>+{c.calculatedAmount?.toFixed?.(2) ?? c.calculatedAmount}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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
            onClick={onSubmit}
            className="px-6 py-2.5 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit & Import"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalPreviewModal;


import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CascadingVariantSelector, { VariantOption } from "./CascadingVariantSelector";

interface MultiVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MultiVariantModal: React.FC<MultiVariantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [selectedVariants, setSelectedVariants] = useState<VariantOption[]>([]);

  const handleVariantsSelected = useCallback((variants: VariantOption[]) => {
    setSelectedVariants(variants);
  }, []);

  const handleContinueToForm = () => {
    if (selectedVariants.length > 0) {
      // Store selected variants in sessionStorage to pass to the form page
      sessionStorage.setItem('multiVariantSelectedVariants', JSON.stringify(selectedVariants));
      onClose();
      navigate('/products/create?type=multi');
      if (onSuccess) {
        onSuccess();
      }
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-7xl max-h-[95vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="bg-purple-600 dark:bg-purple-800 p-6 border-b-2 border-purple-500 dark:border-purple-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 dark:bg-white/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-layer-group text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Multi-Variant Configuration</h2>
              <p className="text-purple-100 text-sm mt-1">
                Select models, storage, and colors to generate product variants
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <CascadingVariantSelector onVariantsSelected={handleVariantsSelected} />
          {selectedVariants.length > 0 && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 shadow-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinueToForm}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                <i className="fas fa-arrow-right"></i>
                Continue to Form
                <span className="ml-1 px-2.5 py-0.5 bg-white/30 rounded-full text-sm font-bold">
                  {selectedVariants.length}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiVariantModal;


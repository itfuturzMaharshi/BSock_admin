import React from 'react';

interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVariant: (variantType: 'single' | 'multi') => void;
}

const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectVariant,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100 border-2 border-gray-200 dark:border-gray-700">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-boxes text-white text-2xl"></i>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                  Create New Product
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Choose your listing type to get started
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-110"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => onSelectVariant('single')}
              className="group relative p-8 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 text-left transform hover:scale-105 hover:shadow-2xl"
            >
              <div className="absolute top-4 right-4 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <i className="fas fa-check text-blue-600 dark:text-blue-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <i className="fas fa-file-alt text-white text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Single Variant
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Create one product listing with a single set of specifications. Perfect for individual products.
                </p>
                <div className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <i className="fas fa-info-circle mr-1"></i>
                    Best for: Single products
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelectVariant('multi')}
              className="group relative p-8 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 text-left transform hover:scale-105 hover:shadow-2xl"
            >
              <div className="absolute top-4 right-4 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <i className="fas fa-check text-purple-600 dark:text-purple-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <i className="fas fa-layer-group text-white text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Multi Variant
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Create multiple variants using smart filters. Select models, storage, and colors to auto-generate all combinations.
                </p>
                <div className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <i className="fas fa-bolt mr-1"></i>
                    Best for: Multiple variants
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariantSelectionModal;


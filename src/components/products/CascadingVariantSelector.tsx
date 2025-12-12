import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { ProductService } from '../../services/product/product.services';
import { StorageService } from '../../services/storage/storage.services';

export interface VariantOption {
  skuFamilyId: string;
  subSkuFamilyId?: string;
  subModelName: string;
  storage: string;
  color: string;
  ram?: string;
}

interface CascadingVariantSelectorProps {
  onVariantsSelected: (variants: VariantOption[]) => void;
}

interface SkuFamilyOption {
  _id: string;
  name: string;
  brand?: { _id: string; title: string };
  subModel?: string;
  storageId?: { _id: string; title: string };
  colorId?: { _id: string; title: string };
  ramId?: { _id: string; title: string };
  subSkuFamilies?: Array<{
    _id: string;
    subName?: string;
    storageId?: { _id: string; title: string; code?: string } | null;
    ramId?: { _id: string; title: string; code?: string } | null;
    colorId?: { _id: string; title: string; code?: string } | null;
    subSkuCode?: string;
  }>;
}

interface SelectOption {
  value: string;
  label: string;
  data?: any;
}

const CascadingVariantSelector: React.FC<CascadingVariantSelectorProps> = ({
  onVariantsSelected,
}) => {
  const [skuFamilies, setSkuFamilies] = useState<SkuFamilyOption[]>([]);
  const [selectedModels, setSelectedModels] = useState<SelectOption[]>([]);
  const [selectedStorages, setSelectedStorages] = useState<SelectOption[]>([]);
  const [selectedColors, setSelectedColors] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [allStorages, setAllStorages] = useState<Array<{ _id: string; title: string }>>([]);

  // Fetch all SKU families and storages on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [skuList, storageList] = await Promise.all([
          ProductService.getSkuFamilyListByName(),
          StorageService.getStorageList(1, 1000).catch(() => ({ data: { docs: [] } }))
        ]);
        setSkuFamilies(skuList);
        // Filter and map storages to ensure _id exists
        const validStorages = (storageList?.data?.docs || [])
          .filter((s: any) => s && s._id && s.title)
          .map((s: any) => ({ _id: s._id, title: s.title }));
        setAllStorages(validStorages);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get unique models (SKU families) based on search
  const modelOptions = useMemo(() => {
    return skuFamilies.map(sku => ({
      value: sku._id,
      label: sku.name,
      data: sku,
    }));
  }, [skuFamilies]);

  // Get available storage options filtered by selected models
  const storageOptions = useMemo(() => {
    if (selectedModels.length === 0) return [];

    const selectedModelIds = selectedModels.map(m => m.value);
    const relevantSkus = skuFamilies.filter(sku => 
      selectedModelIds.includes(sku._id)
    );

    const storageSet = new Set<string>();
    let foundStorageInSubSkus = false;

    relevantSkus.forEach(sku => {
      // Check subSkuFamilies first (most common case)
      if (sku.subSkuFamilies && Array.isArray(sku.subSkuFamilies) && sku.subSkuFamilies.length > 0) {
        sku.subSkuFamilies.forEach((subSku: any) => {
          if (subSku.storageId) {
            if (typeof subSku.storageId === 'object' && subSku.storageId.title) {
              storageSet.add(subSku.storageId.title);
              foundStorageInSubSkus = true;
            } else if (typeof subSku.storageId === 'string') {
              // If storageId is just an ID, find it in allStorages
              const storage = allStorages.find(s => s._id === subSku.storageId);
              if (storage && storage.title) {
                storageSet.add(storage.title);
                foundStorageInSubSkus = true;
              }
            }
          }
        });
      }
      // Fallback to top-level storageId if no subSkuFamilies
      if (!foundStorageInSubSkus && sku.storageId) {
        if (typeof sku.storageId === 'object' && sku.storageId.title) {
          storageSet.add(sku.storageId.title);
        } else if (typeof sku.storageId === 'string') {
          const storageIdString = sku.storageId;
          const storage = allStorages.find(s => s._id === storageIdString);
          if (storage?.title) {
            storageSet.add(storage.title);
          }
        }
      }
    });

    // If no storage found in selected models, show all available storages as fallback
    if (storageSet.size === 0 && allStorages.length > 0) {
      allStorages.forEach(storage => {
        if (storage.title) {
          storageSet.add(storage.title);
        }
      });
    }

    return Array.from(storageSet).sort().map(storage => ({
      value: storage,
      label: storage,
    }));
  }, [selectedModels, skuFamilies, allStorages]);

  // Get available color options filtered by selected models + storages
  const colorOptions = useMemo(() => {
    if (selectedModels.length === 0 || selectedStorages.length === 0) return [];

    const selectedModelIds = selectedModels.map(m => m.value);
    const selectedStorageValues = selectedStorages.map(s => s.value);

    const colorSet = new Set<string>();
    
    selectedModelIds.forEach(modelId => {
      const sku = skuFamilies.find(s => s._id === modelId);
      if (!sku) return;

      // Check subSkuFamilies first (most common case)
      if (sku.subSkuFamilies && Array.isArray(sku.subSkuFamilies) && sku.subSkuFamilies.length > 0) {
        sku.subSkuFamilies.forEach((subSku: any) => {
          const subStorage = subSku.storageId && typeof subSku.storageId === 'object' ? subSku.storageId.title : null;
          // If storage matches or no storage filter needed
          if (subStorage && selectedStorageValues.includes(subStorage)) {
            if (subSku.colorId && typeof subSku.colorId === 'object' && subSku.colorId.title) {
              colorSet.add(subSku.colorId.title);
            }
          }
        });
      }
      // Fallback to top-level colorId if no subSkuFamilies
      else {
        const skuStorage = sku.storageId && typeof sku.storageId === 'object' ? sku.storageId.title : null;
        if (!skuStorage || selectedStorageValues.includes(skuStorage)) {
          if (sku.colorId && typeof sku.colorId === 'object' && sku.colorId.title) {
            colorSet.add(sku.colorId.title);
          }
        }
      }
    });

    return Array.from(colorSet).sort().map(color => ({
      value: color,
      label: color,
    }));
  }, [selectedModels, selectedStorages, skuFamilies]);

  // Generate variants when all selections are made
  useEffect(() => {
    if (selectedModels.length > 0 && selectedStorages.length > 0 && selectedColors.length > 0) {
      const variants: VariantOption[] = [];

      selectedModels.forEach(model => {
        selectedStorages.forEach(storage => {
          selectedColors.forEach(color => {
            const modelData = skuFamilies.find(sku => sku._id === model.value);
            if (modelData) {
              variants.push({
                skuFamilyId: model.value,
                subModelName: modelData.name,
                storage: storage.value,
                color: color.value,
                ram: modelData.ramId && typeof modelData.ramId === 'object' 
                  ? modelData.ramId.title 
                  : undefined,
              });
            }
          });
        });
      });

      onVariantsSelected(variants);
    } else {
      onVariantsSelected([]);
    }
  }, [selectedModels, selectedStorages, selectedColors, skuFamilies, onVariantsSelected]);

  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: '#f9fafb',
      borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      minHeight: '42px',
      borderRadius: '0.5rem',
      '&:hover': {
        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      zIndex: 9999,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
        ? '#f3f4f6'
        : 'white',
      color: state.isSelected ? 'white' : '#111827',
      '&:hover': {
        backgroundColor: '#f3f4f6',
      },
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#dbeafe',
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: '#1e40af',
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: '#1e40af',
      '&:hover': {
        backgroundColor: '#93c5fd',
        color: '#1e3a8a',
      },
    }),
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <i className="fas fa-filter text-white text-lg"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              Multi-Variant Selection
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Select models → storage → colors. All combinations will be generated automatically.
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <i className="fas fa-lightbulb text-blue-500 dark:text-blue-400 mt-0.5"></i>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> You can select multiple items in each step. For example: 2 models × 3 storage × 4 colors = 24 product variants will be created.
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Model Selection */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
            1
          </div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">
            Select Models (Brand + Model) *
          </label>
        </div>
        <Select
          isMulti
          options={modelOptions}
          value={selectedModels}
          onChange={(newValue) => {
            setSelectedModels(newValue as SelectOption[]);
            // Clear dependent selections
            setSelectedStorages([]);
            setSelectedColors([]);
          }}
          placeholder="🔍 Search and select models (e.g., iPhone 17, iPhone 17 Pro)..."
          isSearchable
          isLoading={loading}
          styles={customSelectStyles}
          className="basic-select"
          classNamePrefix="select"
        />
        {selectedModels.length > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <i className="fas fa-check-circle text-green-600 dark:text-green-400 text-sm"></i>
            <p className="text-xs font-medium text-green-700 dark:text-green-300">
              {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Storage Selection */}
      <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg border-2 shadow-sm transition-all duration-200 ${
        selectedModels.length === 0 
          ? 'border-gray-200 dark:border-gray-700 opacity-60' 
          : 'border-green-300 dark:border-green-700'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${
            selectedModels.length === 0
              ? 'bg-gray-400 dark:bg-gray-600'
              : 'bg-green-600'
          }`}>
            2
          </div>
          <label className={`block text-sm font-bold ${
            selectedModels.length === 0
              ? 'text-gray-400 dark:text-gray-500'
              : 'text-gray-800 dark:text-gray-200'
          }`}>
            Select Storage Options *
          </label>
        </div>
        <Select
          isMulti
          options={storageOptions}
          value={selectedStorages}
          onChange={(newValue) => {
            setSelectedStorages(newValue as SelectOption[]);
            // Clear color selection
            setSelectedColors([]);
          }}
          placeholder={
            selectedModels.length === 0
              ? "⏳ Select models first"
              : storageOptions.length === 0
              ? "⚠️ No storage options available for selected models"
              : "🔍 Search and select storage options..."
          }
          isSearchable
          isDisabled={selectedModels.length === 0 || storageOptions.length === 0}
          styles={customSelectStyles}
          className="basic-select"
          classNamePrefix="select"
        />
        {selectedStorages.length > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <i className="fas fa-check-circle text-green-600 dark:text-green-400 text-sm"></i>
            <p className="text-xs font-medium text-green-700 dark:text-green-300">
              {selectedStorages.length} storage option{selectedStorages.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>

      {/* Step 3: Color Selection */}
      <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg border-2 shadow-sm transition-all duration-200 ${
        selectedModels.length === 0 || selectedStorages.length === 0
          ? 'border-gray-200 dark:border-gray-700 opacity-60'
          : 'border-purple-300 dark:border-purple-700'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${
            selectedModels.length === 0 || selectedStorages.length === 0
              ? 'bg-gray-400 dark:bg-gray-600'
              : 'bg-purple-600'
          }`}>
            3
          </div>
          <label className={`block text-sm font-bold ${
            selectedModels.length === 0 || selectedStorages.length === 0
              ? 'text-gray-400 dark:text-gray-500'
              : 'text-gray-800 dark:text-gray-200'
          }`}>
            Select Colors *
          </label>
        </div>
        <Select
          isMulti
          options={colorOptions}
          value={selectedColors}
          onChange={(newValue) => setSelectedColors(newValue as SelectOption[])}
          placeholder={
            selectedModels.length === 0 || selectedStorages.length === 0
              ? "⏳ Select models and storage first"
              : colorOptions.length === 0
              ? "⚠️ No color options available for selected combinations"
              : "🔍 Search and select colors..."
          }
          isSearchable
          isDisabled={
            selectedModels.length === 0 ||
            selectedStorages.length === 0 ||
            colorOptions.length === 0
          }
          styles={customSelectStyles}
          className="basic-select"
          classNamePrefix="select"
        />
        {selectedColors.length > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <i className="fas fa-check-circle text-green-600 dark:text-green-400 text-sm"></i>
            <p className="text-xs font-medium text-green-700 dark:text-green-300">
              {selectedColors.length} color{selectedColors.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Preview of combinations */}
      {selectedModels.length > 0 &&
        selectedStorages.length > 0 &&
        selectedColors.length > 0 && (
          <div className="mt-6 p-5 bg-blue-600 dark:bg-blue-700 rounded-xl border-2 border-blue-400 dark:border-blue-600 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-calculator text-white text-xl"></i>
              </div>
              <div>
                <p className="text-lg font-bold text-white mb-1">
                  {selectedModels.length * selectedStorages.length * selectedColors.length} Variants Ready!
                </p>
                <p className="text-sm text-blue-100">
                  {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} × {selectedStorages.length} storage ×{' '}
                  {selectedColors.length} color{selectedColors.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/30">
              <p className="text-xs text-blue-100 flex items-center gap-2">
                <i className="fas fa-info-circle"></i>
                All combinations will be automatically generated in the Excel form
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

export default CascadingVariantSelector;


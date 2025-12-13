import React, { useState, useEffect } from 'react';
import { ProductService, Product } from '../../services/product/product.services';
import MarginSelectionModal, { MarginSelection } from './MarginSelectionModal';
import CostModuleSelectionModal, { SelectedCost } from './CostModuleSelectionModal';
import toastHelper from '../../utils/toastHelper';

interface SellerProductReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onUpdate: () => void;
}

interface CountryDeliverable {
  country: string;
  currency: 'USD' | 'HKD' | 'AED';
  basePrice: number | string;
  calculatedPrice?: number | string;
  exchangeRate?: number | string;
  paymentTerm?: string | null;
  paymentMethod?: string | null;
  margins?: Array<{ name: string; value: number; type: 'fixed' | 'percentage' }>;
  costs?: Array<{ name: string; value: number; costType: string }>;
  charges?: Array<{ name: string; value: number }>;
  usd?: number | string;
  hkd?: number | string;
  aed?: number | string;
  local?: number | string;
  xe?: number | string;
}

const SellerProductReviewModal: React.FC<SellerProductReviewModalProps> = ({
  isOpen,
  onClose,
  product,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [countryDeliverables, setCountryDeliverables] = useState<CountryDeliverable[]>([]);
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [currentCostCountry, setCurrentCostCountry] = useState<'Hongkong' | 'Dubai' | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      // Initialize form data from product
      const initialData = {
        skuFamilyId: typeof product.skuFamilyId === 'object' ? product.skuFamilyId._id : product.skuFamilyId,
        specification: product.specification || '',
        simType: product.simType || '',
        color: product.color || '',
        ram: product.ram || '',
        storage: product.storage || '',
        condition: product.condition || '',
        stock: product.stock || 0,
        country: product.country || '',
        moq: product.moq || 1,
        weight: (product as any).weight || '',
        isNegotiable: product.isNegotiable || false,
        isFlashDeal: product.isFlashDeal || 'false',
        startTime: product.startTime || '',
        expiryTime: product.expiryTime || '',
      };
      setFormData(initialData);

      // Initialize country deliverables
      if (product.countryDeliverables && product.countryDeliverables.length > 0) {
        setCountryDeliverables(product.countryDeliverables.map((cd: any) => ({
          country: cd.country || '',
          currency: cd.currency || (cd.country === 'Hongkong' ? 'HKD' : cd.country === 'Dubai' ? 'AED' : 'USD'),
          basePrice: cd.basePrice || cd.usd || cd.hkd || cd.aed || 0,
          calculatedPrice: cd.calculatedPrice || null,
          exchangeRate: cd.exchangeRate || cd.xe || null,
          paymentTerm: cd.paymentTerm || null,
          paymentMethod: cd.paymentMethod || null,
          margins: cd.margins || [],
          costs: cd.costs || [],
          charges: cd.charges || [],
          usd: cd.usd || null,
          hkd: cd.hkd || null,
          aed: cd.aed || null,
          local: cd.local || null,
          xe: cd.xe || null,
        })));
      } else {
        // Initialize with empty Hongkong and Dubai entries
        setCountryDeliverables([
          {
            country: 'Hongkong',
            currency: 'USD',
            basePrice: 0,
            exchangeRate: undefined,
            paymentTerm: null,
            paymentMethod: null,
            margins: [],
            costs: [],
            charges: [],
          },
          {
            country: 'Dubai',
            currency: 'USD',
            basePrice: 0,
            exchangeRate: undefined,
            paymentTerm: null,
            paymentMethod: null,
            margins: [],
            costs: [],
            charges: [],
          },
        ]);
      }
    }
  }, [isOpen, product]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleCountryDeliverableChange = (index: number, field: string, value: any) => {
    setCountryDeliverables(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddMargin = (country: 'Hongkong' | 'Dubai', marginSelection: MarginSelection) => {
    const countryIndex = countryDeliverables.findIndex(cd => cd.country === country);
    if (countryIndex === -1) return;

    const margins = Object.entries(marginSelection)
      .filter(([_, selected]) => selected)
      .map(([name, _]) => {
        // Get margin value from cost module service or use default
        return {
          name,
          value: 0, // Will be calculated by backend
          type: 'percentage' as const,
        };
      });

    handleCountryDeliverableChange(countryIndex, 'margins', margins);
    setShowMarginModal(false);
  };

  const handleAddCost = (country: 'Hongkong' | 'Dubai', selectedCosts: SelectedCost[]) => {
    const countryIndex = countryDeliverables.findIndex(cd => cd.country === country);
    if (countryIndex === -1) return;

    const costs = selectedCosts.map(cost => ({
      name: cost.name,
      value: cost.value,
      costType: cost.costType,
    }));

    handleCountryDeliverableChange(countryIndex, 'costs', costs);
    setShowCostModal(false);
  };

  const handleCalculatePrices = async () => {
    try {
      setLoading(true);
      const products = [{
        ...formData,
        countryDeliverables: countryDeliverables.map(cd => ({
          ...cd,
          margins: cd.margins || [],
          costs: cd.costs || [],
        })),
      }];

      const selectedMargins: Record<string, boolean> = {};
      countryDeliverables.forEach(cd => {
        (cd.margins || []).forEach(m => {
          selectedMargins[m.name] = true;
        });
      });

      const selectedCosts: Record<string, string[]> = {};
      countryDeliverables.forEach(cd => {
        (cd.costs || []).forEach(c => {
          if (!selectedCosts[cd.country]) {
            selectedCosts[cd.country] = [];
          }
          selectedCosts[cd.country].push(c.name);
        });
      });

      const result = await ProductService.calculateProductPrices(products, selectedMargins, selectedCosts);
      
      if (result.data && result.data.length > 0) {
        const calculatedProduct = result.data[0];
        if (calculatedProduct.countryDeliverables) {
          setCountryDeliverables(calculatedProduct.countryDeliverables);
          toastHelper.showTost('Prices calculated successfully!', 'success');
        }
      }
    } catch (error: any) {
      console.error('Error calculating prices:', error);
      toastHelper.showTost(error.message || 'Failed to calculate prices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSaving(true);
      
      // Update product with admin-added fields and calculated prices
      await ProductService.updateSellerProductRequest(product._id!, {
        ...formData,
        countryDeliverables: countryDeliverables.map(cd => ({
          country: cd.country,
          currency: cd.currency,
          basePrice: typeof cd.basePrice === 'string' ? parseFloat(cd.basePrice) : cd.basePrice,
          calculatedPrice: cd.calculatedPrice ? (typeof cd.calculatedPrice === 'string' ? parseFloat(cd.calculatedPrice) : cd.calculatedPrice) : null,
          exchangeRate: cd.exchangeRate ? (typeof cd.exchangeRate === 'string' ? parseFloat(cd.exchangeRate) : cd.exchangeRate) : null,
          paymentTerm: cd.paymentTerm,
          paymentMethod: cd.paymentMethod,
          margins: cd.margins || [],
          costs: cd.costs || [],
          charges: cd.charges || [],
        })),
      });

      // Approve the product
      await ProductService.approveProduct(product._id!);
      
      toastHelper.showTost('Product approved successfully!', 'success');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error approving product:', error);
      toastHelper.showTost(error.message || 'Failed to approve product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Enter rejection reason (optional):');
    try {
      await ProductService.rejectSellerProductRequest(product._id!, reason || undefined);
      toastHelper.showTost('Product rejected successfully!', 'success');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error rejecting product:', error);
      toastHelper.showTost(error.message || 'Failed to reject product', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Review Seller Product Request</h2>
            <p className="text-blue-100 text-sm mt-1">
              Add missing fields, cost, margin and approve or reject
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Product Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Product Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SKU Family
                </label>
                <input
                  type="text"
                  value={typeof product.skuFamilyId === 'object' ? product.skuFamilyId.name : product.skuFamilyId}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Specification
                </label>
                <input
                  type="text"
                  value={formData.specification || ''}
                  onChange={(e) => handleFieldChange('specification', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SIM Type
                </label>
                <input
                  type="text"
                  value={formData.simType || ''}
                  onChange={(e) => handleFieldChange('simType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => handleFieldChange('color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RAM
                </label>
                <input
                  type="text"
                  value={formData.ram || ''}
                  onChange={(e) => handleFieldChange('ram', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Storage
                </label>
                <input
                  type="text"
                  value={formData.storage || ''}
                  onChange={(e) => handleFieldChange('storage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  value={formData.stock || 0}
                  onChange={(e) => handleFieldChange('stock', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  MOQ
                </label>
                <input
                  type="number"
                  value={formData.moq || 1}
                  onChange={(e) => handleFieldChange('moq', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Country Deliverables */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Pricing & Delivery
              </h3>
              <button
                onClick={handleCalculatePrices}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {loading ? 'Calculating...' : 'Calculate Prices'}
              </button>
            </div>

            {countryDeliverables.map((cd, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    {cd.country}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCurrentCostCountry(cd.country as 'Hongkong' | 'Dubai');
                        setShowMarginModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Add Margin
                    </button>
                    <button
                      onClick={() => {
                        setCurrentCostCountry(cd.country as 'Hongkong' | 'Dubai');
                        setShowCostModal(true);
                      }}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                    >
                      Add Cost
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Base Price ({cd.currency})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={cd.basePrice || 0}
                      onChange={(e) => handleCountryDeliverableChange(index, 'basePrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Exchange Rate
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={cd.exchangeRate || ''}
                      onChange={(e) => handleCountryDeliverableChange(index, 'exchangeRate', parseFloat(e.target.value) || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Calculated Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={cd.calculatedPrice || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500"
                    />
                  </div>
                </div>
                {(cd.margins && cd.margins.length > 0) && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Margins: {cd.margins.map(m => m.name).join(', ')}
                    </p>
                  </div>
                )}
                {(cd.costs && cd.costs.length > 0) && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Costs: {cd.costs.map(c => c.name).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Approving...' : 'Approve & Save'}
          </button>
        </div>
      </div>

      {/* Margin Selection Modal */}
      {showMarginModal && currentCostCountry && (
        <MarginSelectionModal
          isOpen={showMarginModal}
          onClose={() => {
            setShowMarginModal(false);
            setCurrentCostCountry(null);
          }}
          onNext={(marginSelection) => handleAddMargin(currentCostCountry, marginSelection)}
          products={[]}
        />
      )}

      {/* Cost Selection Modal */}
      {showCostModal && currentCostCountry && (
        <CostModuleSelectionModal
          isOpen={showCostModal}
          onClose={() => {
            setShowCostModal(false);
            setCurrentCostCountry(null);
          }}
          onNext={(selectedCosts) => handleAddCost(currentCostCountry, selectedCosts)}
          products={[]}
          country={currentCostCountry}
        />
      )}
    </div>
  );
};

export default SellerProductReviewModal;

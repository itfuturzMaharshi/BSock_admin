import { MarginSelection } from '../components/products/MarginSelectionModal';
import { SelectedCost } from '../components/products/CostModuleSelectionModal';

export interface CalculatedMargin {
  type: 'brand' | 'productCategory' | 'conditionCategory' | 'sellerCategory' | 'customerCategory';
  name: string;
  marginType: 'fixed' | 'percentage';
  marginValue: number;
  calculatedAmount: number;
  description?: string;
}

export interface CalculatedCost {
  costId: string;
  name: string;
  costType: 'Percentage' | 'Fixed';
  costField: 'product' | 'delivery';
  costUnit?: 'pc' | 'kg' | 'moq' | 'order amount' | 'cart quantity';
  value: number;
  calculatedAmount: number;
  groupId?: string;
  isExpressDelivery?: boolean;
  isSameLocationCharge?: boolean;
}

export interface ProductCalculationResult {
  product: any;
  countryDeliverables: {
    country: 'Hongkong' | 'Dubai';
    basePrice: number;
    calculatedPrice: number;
    margins: CalculatedMargin[];
    costs: CalculatedCost[];
    exchangeRate?: number;
  }[];
}

/**
 * Calculate margins for a product based on selected margin types
 */
export const calculateMargins = async (
  product: any,
  marginSelection: MarginSelection,
  basePrice: number,
  country: 'Hongkong' | 'Dubai'
): Promise<CalculatedMargin[]> => {
  const margins: CalculatedMargin[] = [];

  // If seller margin is off, return empty
  if (!marginSelection.sellerCategory) {
    return margins;
  }

  // Fetch margin data for each selected type
  if (marginSelection.brand && product.skuFamilyId) {
    // Fetch brand from SKU Family
    // This would need to be implemented based on your SKU Family structure
    // For now, assuming brand margin is available
  }

  if (marginSelection.productCategory && product.skuFamilyId) {
    // Fetch product category from SKU Family
  }

  if (marginSelection.conditionCategory && product.condition) {
    // Fetch condition category margin
  }

  if (marginSelection.sellerCategory && product.supplierId) {
    // Fetch seller category margin from seller
  }

  if (marginSelection.customerCategory) {
    // Customer category margin - this might be applied at order time, not product time
    // For now, we'll skip it in product calculation
  }

  return margins;
};

/**
 * Calculate costs for a product
 */
export const calculateCosts = (
  product: any,
  selectedCosts: SelectedCost[],
  basePrice: number,
  country: 'Hongkong' | 'Dubai',
  exchangeRate?: number
): CalculatedCost[] => {
  const costs: CalculatedCost[] = [];

  selectedCosts.forEach(selectedCost => {
    let calculatedAmount = 0;

    if (selectedCost.costField === 'product') {
      // Product-level costs
      if (selectedCost.costType === 'Percentage') {
        calculatedAmount = (basePrice * selectedCost.value) / 100;
      } else {
        // Fixed cost
        if (selectedCost.costUnit === 'moq') {
          // Divide by MOQ
          const moq = product.moqPerVariant || 1;
          calculatedAmount = selectedCost.value / moq;
        } else if (selectedCost.costUnit === 'pc') {
          // Apply per piece
          calculatedAmount = selectedCost.value;
        } else if (selectedCost.costUnit === 'kg') {
          // Calculate based on weight
          const weight = product.weight || 0;
          calculatedAmount = selectedCost.value * weight;
        } else {
          calculatedAmount = selectedCost.value;
        }
      }
    } else if (selectedCost.costField === 'delivery') {
      // Delivery-level costs
      if (selectedCost.costType === 'Percentage') {
        calculatedAmount = (basePrice * selectedCost.value) / 100;
      } else {
        calculatedAmount = selectedCost.value;
      }

      // Check if cost is applicable
      if (selectedCost.isExpressDelivery) {
        // Only apply if currentLocation != deliveryLocation
        if (product.currentLocation === product.deliveryLocation) {
          return; // Skip this cost
        }
      }

      if (selectedCost.isSameLocationCharge) {
        // Only apply if currentLocation == deliveryLocation
        if (product.currentLocation !== product.deliveryLocation) {
          return; // Skip this cost
        }
      }
    }

    // Convert to local currency if exchange rate provided
    if (exchangeRate && country !== 'Hongkong') {
      // For Dubai, costs might need conversion
      // This depends on your business logic
    }

    costs.push({
      ...selectedCost,
      calculatedAmount,
    });
  });

  return costs;
};

/**
 * Calculate final price for a product with margins and costs
 */
export const calculateFinalPrice = (
  basePrice: number,
  margins: CalculatedMargin[],
  costs: CalculatedCost[]
): number => {
  let finalPrice = basePrice;

  // Add margins
  margins.forEach(margin => {
    finalPrice += margin.calculatedAmount;
  });

  // Add costs
  costs.forEach(cost => {
    finalPrice += cost.calculatedAmount;
  });

  return finalPrice;
};

/**
 * Calculate all products with margins and costs
 */
export const calculateAllProducts = async (
  products: any[],
  marginSelection: MarginSelection,
  hkCosts: SelectedCost[],
  dubaiCosts: SelectedCost[],
  exchangeRates: { hkd?: number; aed?: number }
): Promise<ProductCalculationResult[]> => {
  const results: ProductCalculationResult[] = [];

  for (const product of products) {
    const countryDeliverables: ProductCalculationResult['countryDeliverables'] = [];

    // Process Hongkong deliverables
    if (product.hkUsd) {
      const basePrice = parseFloat(String(product.hkUsd)) || 0;
      const margins = await calculateMargins(product, marginSelection, basePrice, 'Hongkong');
      const costs = calculateCosts(product, hkCosts, basePrice, 'Hongkong', exchangeRates.hkd);
      const calculatedPrice = calculateFinalPrice(basePrice, margins, costs);

      countryDeliverables.push({
        country: 'Hongkong',
        basePrice,
        calculatedPrice,
        margins,
        costs,
        exchangeRate: exchangeRates.hkd,
      });
    }

    // Process Dubai deliverables
    if (product.dubaiUsd) {
      const basePrice = parseFloat(String(product.dubaiUsd)) || 0;
      const margins = await calculateMargins(product, marginSelection, basePrice, 'Dubai');
      const costs = calculateCosts(product, dubaiCosts, basePrice, 'Dubai', exchangeRates.aed);
      const calculatedPrice = calculateFinalPrice(basePrice, margins, costs);

      countryDeliverables.push({
        country: 'Dubai',
        basePrice,
        calculatedPrice,
        margins,
        costs,
        exchangeRate: exchangeRates.aed,
      });
    }

    results.push({
      product,
      countryDeliverables,
    });
  }

  return results;
};


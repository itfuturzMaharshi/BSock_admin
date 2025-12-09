import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

export interface Product {
  _id?: string;
  skuFamilyId: string | { _id: string; name: string; images?: string[] };
  subSkuFamilyId?: string | { _id: string; name: string } | null;
  specification: string;
  simType: string;
  color: string;
  ram: string;
  storage: string;
  condition: string | null;
  price: number | string;
  stock: number | string;
  country: string | null;
  moq: number | string;
  purchaseType?: string; // 'full' | 'partial'
  isNegotiable: boolean;
  isFlashDeal: string;
  startTime: string; // ISO string (e.g., "2025-10-30T03:30:00.000Z")
  expiryTime: string; // ISO string (e.g., "2025-10-30T03:30:00.000Z")
  groupCode?: string;
  status?: string;
  isVerified?: boolean;
  verifiedBy?: string;
  isApproved?: boolean;
  approvedBy?: string;
  updatedBy?: string;
  canVerify?: boolean;
  canApprove?: boolean;
  sequence?: number | null;
  isShowTimer?: boolean;
  // Optional per-country delivery pricing details (e.g. Hongkong, Dubai)
  countryDeliverables?: Array<{
    country: string;
    // For backward compatibility, backend may send either price or usd/local
    price?: number;
    usd?: number;
    xe?: number;
    local?: number;
    charges?: Array<{
      name: string;
      value: number;
    }>;
  }>;
}

export interface ListResponse {
  data: {
    docs: Product[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
  status: number;
  message: string;
}

export interface ImportResponse {
  status: number;
  message: string;
  data: {
    imported: string;
  };
}

export class ProductService {
  // Create a new product
  static createProduct = async (productData: Omit<Product, '_id'>): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/create`;

    try {
      // Ensure subSkuFamilyId is included in the request data
      const requestData = {
        ...productData,
        subSkuFamilyId: productData.subSkuFamilyId || null
      };
      
      const res = await api.post(url, requestData);
      toastHelper.showTost(res.data.message || 'Product created successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Update an existing product
  static updateProduct = async (id: string, productData: Partial<Product>): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/update`;

    try {
      // Transform data to match backend expectations
      const transformedData: any = {
        id,
        // Extract _id if skuFamilyId/subSkuFamilyId are objects
        skuFamilyId: typeof productData.skuFamilyId === 'object' && productData.skuFamilyId !== null
          ? (productData.skuFamilyId as any)._id || productData.skuFamilyId
          : productData.skuFamilyId,
        subSkuFamilyId: productData.subSkuFamilyId
          ? (typeof productData.subSkuFamilyId === 'object' && productData.subSkuFamilyId !== null
              ? (productData.subSkuFamilyId as any)._id || productData.subSkuFamilyId
              : productData.subSkuFamilyId)
          : null,
        specification: productData.specification || null,
        simType: productData.simType || null,
        // Handle color: if it's a comma-separated string, take the first value
        color: productData.color 
          ? (productData.color.includes(',') ? productData.color.split(',')[0].trim() : productData.color)
          : null,
        ram: productData.ram || null,
        storage: productData.storage || null,
        condition: productData.condition || null,
        price: typeof productData.price === 'string' ? parseFloat(productData.price) : productData.price,
        stock: typeof productData.stock === 'string' ? parseInt(productData.stock, 10) : productData.stock,
        country: productData.country || null,
        moq: typeof productData.moq === 'string' ? parseInt(productData.moq, 10) : productData.moq,
        purchaseType: productData.purchaseType || 'partial',
        isNegotiable: typeof productData.isNegotiable === 'boolean' ? productData.isNegotiable : false,
        // Convert isFlashDeal from string "true"/"false" to boolean
        isFlashDeal: typeof productData.isFlashDeal === 'string' 
          ? productData.isFlashDeal === 'true' 
          : Boolean(productData.isFlashDeal),
        startTime: productData.startTime || null,
        expiryTime: productData.expiryTime || null,
        groupCode: productData.groupCode || null,
      };

      // Remove null/undefined values to avoid sending unnecessary data
      Object.keys(transformedData).forEach(key => {
        if (transformedData[key] === null || transformedData[key] === undefined || transformedData[key] === '') {
          // Keep id, but remove other null/undefined/empty string values
          if (key !== 'id') {
            delete transformedData[key];
          }
        }
      });
      
      const res = await api.post(url, transformedData);
      toastHelper.showTost(res.data.message || 'Product updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Delete a product
  static deleteProduct = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/delete`;

    try {
      const res = await api.post(url, { id });
      toastHelper.showTost(res.data.message || 'Product deleted successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get product list with pagination and search
  static getProductList = async (page: number, limit: number, search?: string, moveToTop?: boolean, expiredOnly?: boolean, soldOut?: boolean, showTimer?: boolean): Promise<ListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/list`;

    const body: any = { page, limit };
    if (search) {
      body.search = search;
    }
    // Always send moveToTop to backend for explicit filtering
    // When false, backend returns all products; when true, only products with sequence
    body.moveToTop = moveToTop === true;
    // Send expiredOnly filter
    body.expiredOnly = expiredOnly === true;
    // Send soldOut filter
    body.soldOut = soldOut === true;
    // Send showTimer filter
    body.showTimer = showTimer === true;
    
    console.log('ProductService.getProductList - moveToTop:', moveToTop, 'expiredOnly:', expiredOnly, 'soldOut:', soldOut, 'showTimer:', showTimer, 'sending:', body.moveToTop, body.expiredOnly, body.soldOut, body.showTimer);

    try {
      const res = await api.post(url, body);
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch Products';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get a single product by ID
  static getProductById = async (id: string): Promise<Product> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/${id}`;

    try {
      const res = await api.get(url);
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Verify a product
  static verifyProduct = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/verify`;

    try {
      const res = await api.post(url, { id });
      
      // Check if response status is 200 and data is not null
      if (res.status === 200 && res.data.data) {
        toastHelper.showTost(res.data.message || 'Product verified successfully!', 'success');
        return res.data;
      } else {
        // Show warning message and return false
        toastHelper.showTost(res.data.message || 'Failed to verify product', 'warning');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to verify Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Approve a product
  static approveProduct = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/approve`;

    try {
      const res = await api.post(url, { id });
      // Check if response status is 200 and data is not null
      if (res.status === 200 && res.data.data) {
        toastHelper.showTost(res.data.message || 'Product approved successfully!', 'success');
        return res.data;
      } else {
        // Show warning message and return false
        toastHelper.showTost(res.data.message || 'Failed to approve product', 'warning');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to approve Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get SKU Family list
  static getSkuFamilyList = async (): Promise<{ _id: string; name: string }[]> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/listByName`;

    try {
      const res = await api.post(url, {});
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch SKU Families');
      }
      return res.data?.data;
    } catch (err: any) {
      console.error('SKU Family API Error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Failed to fetch SKU Families';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get SKU Family list by name
  static getSkuFamilyListByName = async (): Promise<{ 
    _id: string; 
    name: string;
    code?: string;
    brand?: { _id: string; title: string; code?: string };
    productcategoriesId?: { _id: string; title: string; code?: string };
    conditionCategoryId?: { _id: string; title: string; code?: string };
    subSkuFamilies?: Array<{
      _id: string;
      subName?: string;
      storageId?: { _id: string; title: string; code?: string } | null;
      ramId?: { _id: string; title: string; code?: string } | null;
      colorId?: { _id: string; title: string; code?: string } | null;
      subSkuCode?: string;
      images?: string[];
      videos?: string[];
      subSkuSequence?: number;
    }>;
  }[]> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/listByName`;

    try {
      const res = await api.post(url, {});
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch SKU Families by name');
      }
      return res.data?.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch SKU Families by name';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get Sub SKU Family list by name
  static getSubSkuFamilyListByName = async (skuFamilyId?: string): Promise<{ _id: string; name: string }[]> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/subSkuFamily/listByName`;

    const body: any = { page: 1, limit: 1000 };
    if (skuFamilyId) {
      body.skuFamilyId = skuFamilyId;
    }

    try {
      const res = await api.post(url, body);
      console.log("Sub SKU Family API Response:", res.data); // Debug log
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch Sub SKU Families by name');
      }
      // Transform the response to match the expected format
      const subSkuFamilies = res.data?.data || [];
      console.log("Sub SKU Families data:", subSkuFamilies); // Debug log
      return subSkuFamilies.map((item: any) => ({
        _id: item._id,
        name: item.value || item.name || item._id // Use value field from API response
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch Sub SKU Families by name';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Parse Excel file for product import (first step)
  static parseExcelFile = async (formData: FormData): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/parse-excel`;

    try {
      const res = await api.post(url, formData);
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to parse Excel file');
      }
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to parse Excel file';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Import products with selected charges (second step)
  static importProductsWithCharges = async (filePath: string, selectedCharges: Record<string, string[]>): Promise<ImportResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/import`;

    try {
      const res = await api.post(url, { filePath, selectedCharges });
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to import products');
      }
      toastHelper.showTost(res.data.message || 'Products imported successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to import products';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Upload Excel file for product import (legacy - kept for backward compatibility)
  static uploadExcelFile = async (formData: FormData): Promise<ImportResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/import-legacy`;

    try {
      const res = await api.post(url, formData);
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to import products');
      }
      toastHelper.showTost(res.data.message || 'Products imported successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to import products';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Export products to Excel
  static exportProductsExcel = async (): Promise<Blob> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/export`;

    try {
      const res = await api.post(url, {}, { responseType: 'blob' });
      return res.data as Blob;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to export products';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Toggle sequence for products
  static toggleSequence = async (productIds: string[]): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/toggle-sequence`;

    try {
      const res = await api.post(url, { productIds });
      toastHelper.showTost(res.data.message || 'Sequence updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to toggle sequence';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Move product to top
  static moveToTop = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/move-to-top`;

    try {
      const res = await api.post(url, { id });
      toastHelper.showTost(res.data.message || 'Product moved to top successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to move product to top';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Expire products (single or multiple)
  static expireProducts = async (ids: string | string[]): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/expire`;

    try {
      const res = await api.post(url, { ids });
      toastHelper.showTost(res.data.message || 'Product(s) expired successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to expire product(s)';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Toggle Timer for products (single or multiple)
  static toggleTimer = async (ids: string | string[], isShowTimer: boolean): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/toggle-timer`;

    try {
      const res = await api.post(url, { ids, isShowTimer });
      toastHelper.showTost(res.data.message || `Timer ${isShowTimer ? 'enabled' : 'disabled'} successfully!`, 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to toggle timer';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Mark products as sold out (set stock to 0)
  static bulkVerify = async (ids: string | string[]): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/bulk-verify`;

    try {
      const res = await api.post(url, { ids });
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to verify product(s)');
      }
      toastHelper.showTost(res.data.message || 'Product(s) verified successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to verify product(s)';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static bulkApprove = async (ids: string | string[]): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/bulk-approve`;

    try {
      const res = await api.post(url, { ids });
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to approve product(s)');
      }
      toastHelper.showTost(res.data.message || 'Product(s) approved successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to approve product(s)';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static markSoldOut = async (ids: string | string[]): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/mark-sold-out`;

    try {
      const res = await api.post(url, { ids });
      toastHelper.showTost(res.data.message || 'Product(s) marked as sold out successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to mark products as sold out';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get next supplier listing number
  static getNextSupplierListingNumber = async (sellerId: string, isMultiVariant: boolean = false): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/get-next-supplier-listing-number`;

    try {
      const res = await api.post(url, { sellerId, isMultiVariant });
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get next supplier listing number';
      console.error('Get supplier listing number error:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Get next customer listing number
  static getNextCustomerListingNumber = async (): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/get-next-customer-listing-number`;

    try {
      const res = await api.post(url, {});
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get next customer listing number';
      console.error('Get customer listing number error:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Get next unique listing number (8-digit)
  static getNextUniqueListingNumber = async (): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/get-next-unique-listing-number`;

    try {
      const res = await api.post(url, {});
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get next unique listing number';
      console.error('Get unique listing number error:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Download sample Excel template
  static downloadSample = async (): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/sample`;

    try {
      const res = await api.get(url, { 
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      // Check if response is actually a blob
      if (!(res.data instanceof Blob)) {
        // If it's a string (error message), try to parse it
        if (typeof res.data === 'string') {
          throw new Error('Server returned an error instead of file');
        }
        // Convert to blob if it's an ArrayBuffer or similar
        const blob = new Blob([res.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'product_sample.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
        toastHelper.showTost('Sample file downloaded successfully!', 'success');
        return;
      }
      
      const blob = res.data;
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'product_sample.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      toastHelper.showTost('Sample file downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('Download sample error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to download sample Excel file';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
}
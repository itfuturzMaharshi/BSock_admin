import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

export interface Product {
  _id?: string;
  skuFamilyId: string | { _id: string; name: string; images?: string[] };
  subSkuFamilyId?: string | { _id: string; name: string; images?: string[] };
  specification: string;
  simType: string;
  color: string;
  ram: string;
  storage: string;
  condition: string;
  price: number | string;
  stock: number | string;
  country: string;
  moq: number | string;
  purchaseType?: string; // 'full' | 'partial'
  isNegotiable: boolean;
  isFlashDeal: string;
  expiryTime: string; // ISO string (e.g., "2025-10-30T03:30:00.000Z")
  status?: string;
  isVerified?: boolean;
  verifiedBy?: string;
  isApproved?: boolean;
  approvedBy?: string;
  updatedBy?: string;
  canVerify?: boolean;
  canApprove?: boolean;
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
      // Ensure subSkuFamilyId is included in the request data
      const data = { 
        id, 
        ...productData,
        subSkuFamilyId: productData.subSkuFamilyId || null
      };
      
      const res = await api.post(url, data);
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
  static getProductList = async (page: number, limit: number, search?: string): Promise<ListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/list`;

    const body: any = { page, limit };
    if (search) {
      body.search = search;
    }

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
  static getSkuFamilyListByName = async (): Promise<{ _id: string; name: string }[]> => {
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

  // Upload Excel file for product import
  static uploadExcelFile = async (formData: FormData): Promise<ImportResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/import`;

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
}
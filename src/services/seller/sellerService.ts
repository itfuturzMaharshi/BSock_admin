import api from '../api/api';
import toastHelper from '../../utils/toastHelper';

export interface BusinessProfile {
  businessName?: string | null;
  country?: string | null;
  address?: string | null;
  logo?: string | null;
  certificate?: string | null;
  status?: string;
}

export interface SellerCategory {
  _id: string;
  title: string;
  description?: string;
  marginType?: 'fixed' | 'percentage' | null;
  margin?: number | null;
}

export interface Seller {
  _id: string;
  name: string;
  email: string;
  code?: string;
  mobileNumber?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  isApproved?: boolean;
  businessProfile?: BusinessProfile;
  sellerCategory?: SellerCategory | string | null;
}

export interface UpdateSellerRequest {
  sellerId: string;
  name?: string;
  email?: string;
  mobileNumber?: string;
  isActive?: boolean;
  isApproved?: boolean;
  sellerCategory?: string | null;
}

export interface SellerListResponse {
  docs: Seller[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SellerListRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'approved' | 'pending' | 'emailVerified' | 'notEmailVerified';
}

export class SellerService {
  // Get seller list
  static getSellerList = async (
    requestData: SellerListRequest = {}
  ): Promise<SellerListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/seller/list`;
    
    console.log('Seller list URL:', url);

    try {
      const body: any = {
        page: requestData.page || 1,
        limit: requestData.limit || 10,
      };
      if (requestData.search) body.search = requestData.search;
      if (requestData.status) body.status = requestData.status;

      const res = await api.post(url, body);
      
      // Handle different response formats
      let docs: Seller[] = [];
      let totalDocs = 0;
      
      if (res.data?.data?.docs) {
        // Paginated response
        docs = res.data.data.docs;
        totalDocs = res.data.data.totalDocs || 0;
      } else if (Array.isArray(res.data?.data)) {
        // Array response
        docs = res.data.data;
        totalDocs = docs.length;
      } else if (typeof res.data?.data === 'object') {
        // Object with numeric keys (like { "0": {...}, "1": {...} })
        docs = Object.values(res.data.data) as Seller[];
        totalDocs = docs.length;
      } else if (res.data?.docs) {
        docs = res.data.docs;
        totalDocs = res.data.totalDocs || docs.length;
      }

      return {
        docs,
        totalDocs,
        limit: requestData.limit || 10,
        page: requestData.page || 1,
        totalPages: Math.ceil(totalDocs / (requestData.limit || 10)),
        hasNextPage: (requestData.page || 1) < Math.ceil(totalDocs / (requestData.limit || 10)),
        hasPrevPage: (requestData.page || 1) > 1,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch sellers';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get all sellers (for dropdowns)
  static getAllSellers = async (): Promise<Seller[]> => {
    try {
      // Fetch a large number of sellers for dropdown usage
      const response = await this.getSellerList({ page: 1, limit: 1000 });
      return response.docs.filter(seller => seller.isActive !== false);
    } catch (error) {
      console.error('Failed to fetch all sellers:', error);
      return [];
    }
  };

  // Toggle active status
  static toggleActiveStatus = async (sellerId: string): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/seller/toggle-active`;
    
    console.log('Toggle active status URL:', url);

    try {
      await api.post(url, { sellerId });
      toastHelper.showTost('Active status updated successfully', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to toggle active status';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Export sellers to Excel (excludes _id and updatedAt on backend)
  static exportSellersExcel = async (requestData: SellerListRequest = {}): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/seller/export`;
    try {
      const body: any = {};
      if (requestData.search) body.search = requestData.search;
      if (requestData.status) body.status = requestData.status;
      const res = await api.post(url, body, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `sellers_${new Date().toISOString().slice(0,10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      toastHelper.showTost('Sellers export started', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to export sellers';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

    // Update seller
  static updateSeller = async (requestData: UpdateSellerRequest): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/seller/update`;
    
    console.log('Update seller URL:', url);

    try {
      await api.post(url, requestData);
      toastHelper.showTost('Seller updated successfully', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update seller';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
}

export default SellerService;


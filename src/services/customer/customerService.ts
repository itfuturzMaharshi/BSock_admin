import api from '../api/api';
import toastHelper from '../../utils/toastHelper';

export interface BusinessProfile {
  businessName?: string | null;
  country?: string | null;
  address?: string | null;
  logo?: string | null;
  certificate?: string | null;
  status?: string;
  currencyCode?: string | null;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  whatsappNumber?: string;
  mobileNumber?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  isApproved?: boolean;
  isAllowBidding?: boolean;
  businessProfile?: BusinessProfile;
}

export interface CustomerListResponse {
  docs: Customer[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CustomerListRequest {
  page?: number;
  limit?: number;
  search?: string;
  isAllowBidding?: boolean;
  status?: 'active' | 'inactive' | 'approved' | 'pending' | 'emailVerified' | 'notEmailVerified';
}

export class CustomerService {
  // Get customer list
  static getCustomerList = async (
    requestData: CustomerListRequest = {}
  ): Promise<CustomerListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/customer/list`;
    
    console.log('Customer list URL:', url);

    try {
      const body: any = {
        page: requestData.page || 1,
        limit: requestData.limit || 10,
      };
      if (requestData.search) body.search = requestData.search;
      if (typeof requestData.isAllowBidding === 'boolean') body.isAllowBidding = requestData.isAllowBidding;
      if (requestData.status) body.status = requestData.status;

      const res = await api.post(url, body);
      
      // Handle different response formats
      let docs: Customer[] = [];
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
        docs = Object.values(res.data.data) as Customer[];
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
      const errorMessage = err.response?.data?.message || 'Failed to fetch customers';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get all customers (for dropdowns)
  static getAllCustomers = async (): Promise<Customer[]> => {
    try {
      // Fetch a large number of customers for dropdown usage
      const response = await this.getCustomerList({ page: 1, limit: 1000 });
      return response.docs.filter(customer => customer.isActive !== false);
    } catch (error) {
      console.error('Failed to fetch all customers:', error);
      return [];
    }
  };

  // Toggle bidding status
  static toggleBiddingStatus = async (customerId: string): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/customer/toggle-bidding`;
    
    console.log('Toggle bidding URL:', url);

    try {
      await api.post(url, { customerId });
      toastHelper.showTost('Bidding status updated successfully', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to toggle bidding status';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Export customers to Excel (excludes _id and updatedAt on backend)
  static exportCustomersExcel = async (requestData: CustomerListRequest = {}): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/customer/export`;
    try {
      const body: any = {};
      if (requestData.search) body.search = requestData.search;
      if (typeof requestData.isAllowBidding === 'boolean') body.isAllowBidding = requestData.isAllowBidding;
      if (requestData.status) body.status = requestData.status;
      const res = await api.post(url, body, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `customers_${new Date().toISOString().slice(0,10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      toastHelper.showTost('Customers export started', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to export customers';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }
}

export default CustomerService;

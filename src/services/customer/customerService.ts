import api from '../api/api';
import toastHelper from '../../utils/toastHelper';

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  walletBalance?: number;
  isApproved?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
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

      const res = await api.post(url, body);
      const docs = res.data?.data?.docs || res.data?.data || [];
      const totalDocsRaw = res.data?.data?.totalDocs ?? docs.length ?? 0;
      const totalDocs = typeof totalDocsRaw === 'string' ? parseInt(totalDocsRaw, 10) : totalDocsRaw;

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
      return response.docs.filter(customer => !customer.isDeleted);
    } catch (error) {
      console.error('Failed to fetch all customers:', error);
      return [];
    }
  };
}

export default CustomerService;

import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

// Admin interface matching backend response
export interface Admin {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Admin list response interface
export interface AdminListResponse {
  docs: Admin[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// API Response interface
interface ApiResponse<T> {
  status: number;
  message?: string;
  data: T;
}

// Create Admin request interface
export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
}

// Update Admin request interface
export interface UpdateAdminRequest {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
}

// Get Admin request interface
export interface GetAdminRequest {
  id: string;
}

// Delete Admin request interface
export interface DeleteAdminRequest {
  id: string;
}

// List Admins request interface
export interface ListAdminsRequest {
  page?: number;
  limit?: number;
  search?: string;
}

export class AdminService {
  // Create Admin
  static createAdmin = async (adminData: CreateAdminRequest): Promise<ApiResponse<Admin>> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/admin/create`;

    try {
      const res = await api.post(url, adminData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Admin created successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to create admin', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create admin';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Get Admin by ID
  static getAdmin = async (requestData: GetAdminRequest): Promise<ApiResponse<Admin>> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/admin/get`;

    try {
      const res = await api.post(url, requestData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        // toastHelper.showTost(responseData.message || 'Admin retrieved successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to retrieve admin', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to retrieve admin';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update Admin
  static updateAdmin = async (requestData: UpdateAdminRequest): Promise<ApiResponse<Admin>> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/admin/update`;

    try {
      const res = await api.post(url, requestData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Admin updated successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to update admin', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update admin';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Delete Admin (permanent delete)
  static deleteAdmin = async (requestData: DeleteAdminRequest): Promise<ApiResponse<Admin>> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/admin/delete`;

    try {
      const res = await api.post(url, requestData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Admin deleted successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to delete admin', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete admin';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // List Admins with pagination and search
  static listAdmins = async (requestData: ListAdminsRequest = {}): Promise<ApiResponse<AdminListResponse>> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/admin/list`;

    try {
      const res = await api.post(url, {
        page: requestData.page || 1,
        limit: requestData.limit || 10,
        search: requestData.search || '',
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        // toastHelper.showTost(responseData.message || 'Admins retrieved successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to retrieve admins', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to retrieve admins';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };
}

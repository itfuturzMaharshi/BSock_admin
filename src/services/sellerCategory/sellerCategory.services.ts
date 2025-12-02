import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

export interface SellerCategory {
  _id?: string;
  title: string;
  description?: string;
  marginType?: 'fixed' | 'percentage' | null;
  margin?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListResponse {
  data: {
    docs: SellerCategory[];
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

export class SellerCategoryService {
  static createSellerCategory = async (categoryData: Omit<SellerCategory, '_id'>): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/seller-category/create`;

    try {
      const res = await api.post(url, categoryData);
      toastHelper.showTost(res.data.message || 'Seller Category created successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create Seller Category';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static updateSellerCategory = async (id: string, categoryData: Partial<SellerCategory>): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/seller-category/update`;

    try {
      const res = await api.post(url, { id: id, ...categoryData });
      toastHelper.showTost(res.data.message || 'Seller Category updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update Seller Category';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static deleteSellerCategory = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/seller-category/delete`;

    try {
      const res = await api.post(url, { id });
      toastHelper.showTost(res.data.message || 'Seller Category deleted successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete Seller Category';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static getSellerCategory = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/seller-category/get`;

    try {
      const res = await api.post(url, { id });
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get Seller Category';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static getSellerCategoryList = async (
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<ListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/seller-category/list`;

    try {
      const res = await api.post(url, { page, limit, search });
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch Seller Categories';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static exportToExcel = async (): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/seller-category/export`;

    try {
      const res = await api.get(url, { 
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `seller_categories_export_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      toastHelper.showTost('Seller Categories exported successfully!', 'success');
    } catch (err: any) {
      console.error('Export error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to export seller categories';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static downloadSample = async (): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/seller-category/sample`;

    try {
      const res = await api.get(url, { 
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'seller_categories_sample.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      toastHelper.showTost('Sample file downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('Download sample error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to download sample';
      toastHelper.showTost(errorMessage, 'error');
      throw err;
    }
  };

  static importFromExcel = async (file: File): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/seller-category/import`;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toastHelper.showTost(res.data.message || 'Seller Categories imported successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to import seller categories';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

}


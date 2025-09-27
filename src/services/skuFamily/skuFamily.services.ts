import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

interface SkuFamily {
  _id?: string;
  name: string;
  code: string;
  brand: string;
  description: string;
  images: string[];
  colorVariant: string;
  country: string;
  simType: string;
  networkBands: string;
  countryVariant?: string;
  isApproved?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  approvedBy?: string | null;
  __v?: string;
}

interface ListResponse {
  data: {
    docs: SkuFamily[];
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

export class SkuFamilyService {
  static createSkuFamily = async (data: FormData): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/create`;

    try {
      const res = await api.post(url, data);
      toastHelper.showTost(res.data.message || 'SKU Family created successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create SKU Family';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static updateSkuFamily = async (id: string, data: FormData): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/update`;

    try {
      data.append('id', id);
      const res = await api.post(url, data);
      toastHelper.showTost(res.data.message || 'SKU Family updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update SKU Family';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static deleteSkuFamily = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/delete`;

    try {
      const res = await api.post(url, { id });
      toastHelper.showTost(res.data.message || 'SKU Family deleted successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete SKU Family';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static getSkuFamilyList = async (page: number, limit: number, search?: string): Promise<ListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/list`;

    const body: any = { page, limit };
    if (search) {
      body.search = search;
    }

    try {
      const res = await api.post(url, body);
      console.log("API response for getSkuFamilyList:", res.data); // Debug log
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch SKU Families';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
}
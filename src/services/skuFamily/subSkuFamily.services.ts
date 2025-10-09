import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

interface SubSkuFamily {
  _id?: string;
  name: string;
  code: string;
  brand: string;
  description: string;
  images: string[];
  colorVariant: string[];
  country: string;
  simType: string[];
  networkBands: string[];
  skuFamilyId: string;
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
    docs: SubSkuFamily[];
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

export class SubSkuFamilyService {
  static createSubSkuFamily = async (data: FormData): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/subSkuFamily/create`;

    try {
      const res = await api.post(url, data);
      toastHelper.showTost(res.data.message || 'Sub SKU Family created successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create Sub SKU Family';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static updateSubSkuFamily = async (id: string, data: FormData): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/subSkuFamily/update`;

    try {
      data.append('id', id);
      const res = await api.post(url, data);
      toastHelper.showTost(res.data.message || 'Sub SKU Family updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update Sub SKU Family';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static deleteSubSkuFamily = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/subSkuFamily/delete`;

    try {
      const res = await api.post(url, { id });
      toastHelper.showTost(res.data.message || 'Sub SKU Family deleted successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete Sub SKU Family';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static getSubSkuFamilyList = async (page: number, limit: number, skuFamilyId?: string, search?: string): Promise<ListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/subSkuFamily/list`;

    const body: any = { page, limit };
    if (skuFamilyId) {
      body.skuFamilyId = skuFamilyId;
    }
    if (search) {
      body.search = search;
    }

    try {
      const res = await api.post(url, body);
      console.log("API response for getSubSkuFamilyList:", res.data); // Debug log
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch Sub SKU Families';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
}

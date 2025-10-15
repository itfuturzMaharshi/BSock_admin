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
      // If there are no files, send JSON instead of FormData so backend can parse correctly
      let res;
      const hasFiles = (() => {
        for (const [key, value] of data.entries()) {
          if (key === 'images' && value instanceof File) return true;
        }
        return false;
      })();

      if (hasFiles) {
        res = await api.post(url, data);
      } else {
        const jsonPayload: any = {};
        for (const [key, value] of data.entries()) {
          if (typeof value === 'string') {
            if (
              key === 'colorVariant' ||
              key === 'country' ||
              key === 'simType' ||
              key === 'networkBands'
            ) {
              // Convert comma separated values to array
              jsonPayload[key] = value
                .split(',')
                .map((v) => v.trim())
                .filter((v) => v);
            } else if (key === 'keptImages') {
              try {
                jsonPayload[key] = JSON.parse(value);
              } catch {
                jsonPayload[key] = value;
              }
            } else {
              jsonPayload[key] = value;
            }
          }
        }
        res = await api.post(url, jsonPayload);
      }
      toastHelper.showTost(res.data.message || 'SKU Family created successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const validation = err.response?.data?.errors;
      const errorMessage = (validation && validation[0]?.message) || err.response?.data?.message || 'Failed to create SKU Family';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static updateSkuFamily = async (id: string, data: FormData): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/update`;

    try {
      // Ensure id is present
      if (!data.has('id')) data.append('id', id);

      // If there are no files, send JSON instead of FormData
      let res;
      const hasFiles = (() => {
        for (const [key, value] of data.entries()) {
          if (key === 'images' && value instanceof File) return true;
        }
        return false;
      })();

      if (hasFiles) {
        res = await api.post(url, data);
      } else {
        const jsonPayload: any = {};
        for (const [key, value] of data.entries()) {
          if (typeof value === 'string') {
            if (
              key === 'colorVariant' ||
              key === 'country' ||
              key === 'simType' ||
              key === 'networkBands'
            ) {
              jsonPayload[key] = value
                .split(',')
                .map((v) => v.trim())
                .filter((v) => v);
            } else if (key === 'keptImages') {
              try {
                jsonPayload[key] = JSON.parse(value);
              } catch {
                jsonPayload[key] = value;
              }
            } else {
              jsonPayload[key] = value;
            }
          }
        }
        // include id in JSON
        jsonPayload.id = id;
        res = await api.post(url, jsonPayload);
      }
      toastHelper.showTost(res.data.message || 'SKU Family updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const validation = err.response?.data?.errors;
      const errorMessage = (validation && validation[0]?.message) || err.response?.data?.message || 'Failed to update SKU Family';
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
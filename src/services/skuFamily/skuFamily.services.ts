import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

interface SkuFamily {
  _id?: string;
  id?: string;
  code: string;
  name: string;
  brand: string;
  description: string;
  images: string[];
  colorVariant: string;
  country: string;
  simType: string;
  networkBands: string;
  countryVariant?: string;
  sequence?: number;
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

  static exportToExcel = async (): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/export`;

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
        link.download = `sku_families_export_${Date.now()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
        toastHelper.showTost('SKU Families exported successfully!', 'success');
        return;
      }
      
      const blob = res.data;
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `sku_families_export_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      toastHelper.showTost('SKU Families exported successfully!', 'success');
    } catch (err: any) {
      console.error('Export error:', err);
      // Try to extract error message from blob response if it's an error
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const errorData = JSON.parse(text);
          toastHelper.showTost(errorData.message || 'Failed to export SKU Families', 'error');
        } catch {
          toastHelper.showTost('Failed to export SKU Families', 'error');
        }
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to export SKU Families';
        toastHelper.showTost(errorMessage, 'error');
      }
      throw err;
    }
  };

  static downloadSample = async (): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/sample`;

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
        link.download = 'sku_families_sample.xlsx';
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
      link.download = 'sku_families_sample.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      toastHelper.showTost('Sample file downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('Download sample error:', err);
      // Try to extract error message from blob response if it's an error
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const errorData = JSON.parse(text);
          toastHelper.showTost(errorData.message || 'Failed to download sample', 'error');
        } catch {
          toastHelper.showTost('Failed to download sample file', 'error');
        }
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to download sample';
        toastHelper.showTost(errorMessage, 'error');
      }
      throw err;
    }
  };

  static importFromExcel = async (file: File): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/import`;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toastHelper.showTost(res.data.message || 'SKU Families imported successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to import SKU Families';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static updateSequence = async (id: string, sequence: number): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/update-sequence`;

    try {
      const res = await api.post(url, { id, sequence });
      toastHelper.showTost(res.data.message || 'Sequence updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update sequence';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static addSubSkuFamily = async (skuFamilyId: string, data: FormData): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/add-sub-sku-family`;

    try {
      data.append('skuFamilyId', skuFamilyId);
      const res = await api.post(url, data);
      toastHelper.showTost(res.data.message || 'Sub SKU Family added successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add Sub SKU Family';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static updateSubSkuFamily = async (skuFamilyId: string, subSkuFamilyId: string, data: FormData): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/update-sub-sku-family`;

    try {
      data.append('skuFamilyId', skuFamilyId);
      data.append('subSkuFamilyId', subSkuFamilyId);
      const res = await api.post(url, data);
      toastHelper.showTost(res.data.message || 'Sub SKU Family updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update Sub SKU Family';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static deleteSubSkuFamily = async (skuFamilyId: string, subSkuFamilyId: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/delete-sub-sku-family`;

    try {
      const res = await api.post(url, { skuFamilyId, subSkuFamilyId });
      toastHelper.showTost(res.data.message || 'Sub SKU Family deleted successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete Sub SKU Family';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static updateSubSkuFamilySequence = async (skuFamilyId: string, subSkuFamilyId: string, subSkuSequence: number): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/update-sub-sku-family-sequence`;

    try {
      const res = await api.post(url, { skuFamilyId, subSkuFamilyId, subSkuSequence });
      toastHelper.showTost(res.data.message || 'Sub SKU Sequence updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update Sub SKU Sequence';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
}
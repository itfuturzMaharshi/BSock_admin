import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

export interface Ram {
  _id?: string;
  id?: string;
  code?: string;
  title: string;
  description?: string;
  sequence?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListResponse {
  data: {
    docs: Ram[];
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

export class RamService {
  static createRam = async (ramData: Omit<Ram, '_id'>): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/ram/create`;

    try {
      const res = await api.post(url, ramData);
      toastHelper.showTost(res.data.message || 'RAM created successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create RAM';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static updateRam = async (id: string, ramData: Partial<Ram>): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/ram/update`;

    try {
      const res = await api.post(url, { id: id, ...ramData });
      toastHelper.showTost(res.data.message || 'RAM updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update RAM';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static deleteRam = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/ram/delete`;

    try {
      const res = await api.post(url, { id });
      toastHelper.showTost(res.data.message || 'RAM deleted successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete RAM';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static getRam = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/ram/get`;

    try {
      const res = await api.post(url, { id });
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get RAM';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static getRamList = async (
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<ListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/ram/list`;

    try {
      const res = await api.post(url, { page, limit, search });
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch RAMs';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static updateSequence = async (id: string, sequence: number): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/ram/update-sequence`;

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
}



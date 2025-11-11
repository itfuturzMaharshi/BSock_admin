import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

export interface Grade {
  _id?: string;
  title: string;
  description?: string;
  brand: string | { _id: string; title: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ListResponse {
  data: {
    docs: Grade[];
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

export class GradeService {
  static createGrade = async (gradeData: Omit<Grade, '_id'>): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/grade/create`;

    try {
      const requestData = {
        ...gradeData,
        brand: typeof gradeData.brand === 'object' ? gradeData.brand._id : gradeData.brand,
      };
      const res = await api.post(url, requestData);
      toastHelper.showTost(res.data.message || 'Grade created successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create Grade';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static updateGrade = async (id: string, gradeData: Partial<Grade>): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/grade/update`;

    try {
      const requestData: any = { id };
      if (gradeData.brand) {
        requestData.brand = typeof gradeData.brand === 'object' ? gradeData.brand._id : gradeData.brand;
      }
      if (gradeData.title) requestData.title = gradeData.title;
      if (gradeData.description !== undefined) requestData.description = gradeData.description;

      const res = await api.post(url, requestData);
      toastHelper.showTost(res.data.message || 'Grade updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update Grade';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static deleteGrade = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/grade/delete`;

    try {
      const res = await api.post(url, { id });
      toastHelper.showTost(res.data.message || 'Grade deleted successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete Grade';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static getGrade = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/grade/get`;

    try {
      const res = await api.post(url, { id });
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get Grade';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static getGradeList = async (
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<ListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/grade/list`;

    try {
      const res = await api.post(url, { page, limit, search });
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch Grades';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
}


import api from '../api/api';
import toastHelper from '../../utils/toastHelper';

// Currency Conversion interfaces
export interface CurrencyConversion {
  _id?: string;
  currencyCode: string;
  rate: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateCurrencyConversionRequest {
  currencyCode: string;
  rate: number;
}

export interface UpdateCurrencyConversionRequest {
  currencyCode?: string;
  rate?: number;
}

export interface ListCurrencyConversionRequest {
  page: number;
  limit: number;
  search?: string;
}

export interface DeleteCurrencyConversionRequest {
  id: string;
}

export interface CurrencyConversionListResponse {
  docs: CurrencyConversion[];
  totalDocs: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export class CurrencyConversionService {
  // Create Currency Conversion
  static createCurrencyConversion = async (currencyData: CreateCurrencyConversionRequest): Promise<ApiResponse<CurrencyConversion>> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/currency-conversion/create`;

    try {
      const res = await api.post(url, currencyData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      // Check if data is 0, which indicates an error condition
      if (responseData.data === 0) {
        const errorMessage = responseData.message || 'Currency conversion already exists';
        toastHelper.showTost(errorMessage, 'error');
        throw new Error(errorMessage);
      }

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Currency conversion created successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to create currency conversion', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      console.error('Currency conversion create error:', err);
      
      // Handle authentication errors
      if (err.response?.status === 401) {
        const errorMessage = 'Authentication required. Please login again.';
        toastHelper.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Handle 404 errors
      if (err.response?.status === 404) {
        const errorMessage = 'Currency conversion API endpoint not found. Please check backend implementation.';
        toastHelper.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create currency conversion';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Get Currency Conversion by ID
  static getCurrencyConversion = async (id: string): Promise<ApiResponse<CurrencyConversion>> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/currency-conversion/get`;

    try {
      const res = await api.post(url, { id }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      // Check if data is 0, which indicates an error condition
      if (responseData.data === 0) {
        const errorMessage = responseData.message || 'Currency conversion not found';
        toastHelper.showTost(errorMessage, 'error');
        throw new Error(errorMessage);
      }

      if (res.status === 200) {
        // toastHelper.showTost(responseData.message || 'Currency conversion retrieved successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to retrieve currency conversion', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      console.error('Currency conversion get error:', err);
      
      // Handle authentication errors
      if (err.response?.status === 401) {
        const errorMessage = 'Authentication required. Please login again.';
        toastHelper.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Handle 404 errors
      if (err.response?.status === 404) {
        const errorMessage = 'Currency conversion API endpoint not found. Please check backend implementation.';
        toastHelper.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to retrieve currency conversion';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update Currency Conversion
  static updateCurrencyConversion = async (id: string, currencyData: UpdateCurrencyConversionRequest): Promise<ApiResponse<CurrencyConversion>> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/currency-conversion/update`;

    try {
      const res = await api.post(url, { id, ...currencyData }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      // Check if data is 0, which indicates an error condition
      if (responseData.data === 0) {
        const errorMessage = responseData.message || 'Currency conversion not found';
        toastHelper.showTost(errorMessage, 'error');
        throw new Error(errorMessage);
      }

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Currency conversion updated successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to update currency conversion', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      console.error('Currency conversion update error:', err);
      
      // Handle authentication errors
      if (err.response?.status === 401) {
        const errorMessage = 'Authentication required. Please login again.';
        toastHelper.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Handle 404 errors
      if (err.response?.status === 404) {
        const errorMessage = 'Currency conversion API endpoint not found. Please check backend implementation.';
        toastHelper.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update currency conversion';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Delete Currency Conversion
  static deleteCurrencyConversion = async (requestData: DeleteCurrencyConversionRequest): Promise<ApiResponse<CurrencyConversion>> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/currency-conversion/delete`;

    try {
      const res = await api.post(url, requestData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      // Check if data is 0, which indicates an error condition
      if (responseData.data === 0) {
        const errorMessage = responseData.message || 'Currency conversion not found';
        toastHelper.showTost(errorMessage, 'error');
        throw new Error(errorMessage);
      }

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Currency conversion deleted successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to delete currency conversion', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      console.error('Currency conversion delete error:', err);
      
      // Handle authentication errors
      if (err.response?.status === 401) {
        const errorMessage = 'Authentication required. Please login again.';
        toastHelper.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Handle 404 errors
      if (err.response?.status === 404) {
        const errorMessage = 'Currency conversion API endpoint not found. Please check backend implementation.';
        toastHelper.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete currency conversion';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // List Currency Conversions with pagination
  static listCurrencyConversions = async (requestData: ListCurrencyConversionRequest): Promise<ApiResponse<CurrencyConversionListResponse>> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/currency-conversion/list`;

    try {
      const res = await api.post(url, {
        page: requestData.page,
        limit: requestData.limit,
        ...(requestData.search && { search: requestData.search }),
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        // toastHelper.showTost(responseData.message || 'Currency conversions retrieved successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to retrieve currency conversions', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      console.error('Currency conversion list error:', err);
      
      // Handle authentication errors
      if (err.response?.status === 401) {
        const errorMessage = 'Authentication required. Please login again.';
        toastHelper.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Handle 404 errors
      if (err.response?.status === 404) {
        const errorMessage = 'Currency conversion API endpoint not found. Please check backend implementation.';
        toastHelper.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to retrieve currency conversions';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };
}

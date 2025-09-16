import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

interface CostModule {
  _id?: string;
  type: 'Logistic' | 'Product';
  products: string[];
  countries: string[];
  remark: string;
  costType: 'Percentage' | 'Fixed';
  value: number;
  minValue?: number;
  maxValue?: number;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'Logistic' | 'Product';
  costType?: 'Percentage' | 'Fixed';
}

interface CostModuleResponse {
  status: number;
  message?: string;
  data?: any;
}

interface Product {
  _id: string;
  specification: string;
}

export class CostModuleService {
  // Create a new cost module
  static createCostModule = async (
    costModule: Omit<CostModule, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<CostModuleResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/cost/create`;

    try {
      const res = await api.post(url, costModule, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Cost created successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to create cost module', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      let errorMessage = 'An unknown error occurred';
      if (err.response) {
        errorMessage = err.response.data.message || 'Failed to create cost module';
        toastHelper.error(errorMessage);
      } else if (err.request) {
        errorMessage = 'No response from server';
        toastHelper.error(errorMessage);
      } else {
        toastHelper.error(err.message || errorMessage);
      }
      throw new Error(errorMessage);
    }
  };

  // Update an existing cost module
  static updateCostModule = async (id: string, updates: Partial<CostModule>): Promise<CostModuleResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/cost/update`;

    try {
      const res = await api.post(url, { id, ...updates }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Cost updated successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to update cost module', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      let errorMessage = 'An unknown error occurred';
      if (err.response) {
        errorMessage = err.response.data.message || 'Failed to update cost module';
        toastHelper.error(errorMessage);
      } else if (err.request) {
        errorMessage = 'No response from server';
        toastHelper.error(errorMessage);
      } else {
        toastHelper.error(err.message || errorMessage);
      }
      throw new Error(errorMessage);
    }
  };

  // Delete a cost module
  static deleteCostModule = async (id: string): Promise<CostModuleResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/cost/delete`;

    try {
      const res = await api.post(url, { id }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Cost deleted successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to delete cost module', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      let errorMessage = 'An unknown error occurred';
      if (err.response) {
        errorMessage = err.response.data.message || 'Failed to delete cost module';
        toastHelper.error(errorMessage);
      } else if (err.request) {
        errorMessage = 'No response from server';
        toastHelper.error(errorMessage);
      } else {
        toastHelper.error(err.message || errorMessage);
      }
      throw new Error(errorMessage);
    }
  };

  // List cost modules
  static listCostModules = async (params: ListQueryParams): Promise<CostModuleResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/cost/list`;

    try {
      const res = await api.post(url, params, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Costs retrieved successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to retrieve cost modules', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data, // Return the full data object including docs, totalDocs, etc.
      };
    } catch (err: any) {
      let errorMessage = 'An unknown error occurred';
      if (err.response) {
        errorMessage = err.response.data.message || 'Failed to retrieve cost modules';
        toastHelper.error(errorMessage);
      } else if (err.request) {
        errorMessage = 'No response from server';
        toastHelper.error(errorMessage);
      } else {
        toastHelper.error(err.message || errorMessage);
      }
      throw new Error(errorMessage);
    }
  };

  // Fetch products list by name
  static listProductsByName = async (): Promise<Product[]> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/product/list`;

    try {
      const res = await api.post(url, {}, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200 && responseData.data && responseData.data.docs) {
        return responseData.data.docs
          .filter((product: any) => product.specification) // Filter out products with null/undefined specification
          .map((product: any) => ({
            _id: product._id,
            specification: product.specification || 'Unknown Product',
          }));
      }
      console.log('Products response:', responseData); // Debug log
      return [];
    } catch (err: any) {
      console.error('Error fetching products:', err); // Debug log
      return [];
    }
  };
}
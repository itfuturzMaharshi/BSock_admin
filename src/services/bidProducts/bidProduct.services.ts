import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

export interface BidProduct {
  _id?: string;
  lotNumber: string;
  qty: number;
  oem: string;
  model: string;
  description: string;
  category: string;
  grade: string;
  packageType: string;
  capacity: string;
  color: string;
  carrier: string;
  price: number;
  status?: 'pending' | 'active' | 'closed';
  trackId?: string;
  createdBy?: string;
  isDeleted?: boolean;
}

export interface ListResponse {
  data: {
    docs: BidProduct[];
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

export interface ImportResponse {
  status: number;
  message: string;
  data: {
    products: any[];
  };
}

export class BidProductService {
  // Get bid product list with pagination, search, and status filter
  static getBidProductList = async (page: number, limit: number, search?: string, status?: string): Promise<ListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/bidProduct/list`;

    const body: any = { page, limit };
    if (search) {
      body.search = search;
    }
    if (status && status !== 'all') {
      body.status = status;
    }

    try {
      const res = await api.post(url, body);
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch Bid Products';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Delete a bid product
  static deleteBidProduct = async (id: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/bidProduct/delete`;

    try {
      const res = await api.post(url, { id });
      toastHelper.showTost(res.data.message || 'Bid Product deleted successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete Bid Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Upload Excel file for bid product import
  static uploadExcelFile = async (formData: FormData): Promise<ImportResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/bidProduct/import`;

    try {
      const res = await api.post(url, formData);
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to import bid products');
      }
      toastHelper.showTost(res.data.message || 'Bid Products parsed successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to import bid products';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Create bulk bid products
  static createBulk = async (products: any[]): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/bidProduct/createBulk`;

    try {
      const res = await api.post(url, { products });
      toastHelper.showTost(res.data.message || 'Bid Products created successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create bulk Bid Products';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Export bid products
  static exportBidProducts = async (): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/bidProduct/export`;

    try {
      const res = await api.post(url, {}, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'bidProducts.xlsx';
      link.click();
      URL.revokeObjectURL(link.href);
      toastHelper.showTost('File exported successfully!', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to export Bid Products';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Export bid history for a specific product
  static exportBidHistoryByProduct = async (productId: string): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/bid/export-by-product`;

    try {
      const res = await api.post(url, { productId }, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `bid_history_${productId}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      toastHelper.showTost('Bid history exported', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to export bid history';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Download sample Excel template
  static downloadSampleExcel = async (): Promise<void> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/bidProduct/sample`;

    console.log('Downloading sample Excel from URL:', url);
    console.log('Environment variables:', { baseUrl, adminRoute });

    try {
      const res = await api.post(url, {}, { responseType: 'blob' });
      console.log('Response received:', res.status, res.headers);
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'bid-product-sample.xlsx';
      link.click();
      URL.revokeObjectURL(link.href);
      toastHelper.showTost('Sample Excel file downloaded successfully!', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to download sample Excel file';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Send custom message to highest bidder
  static sendMessageToHighestBidder = async (productId: string, message: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/bid/send-message-to-highest-bidder`;

    try {
      const res = await api.post(url, { productId, message });
      toastHelper.showTost(res.data.message || 'Message sent successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send message';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
}
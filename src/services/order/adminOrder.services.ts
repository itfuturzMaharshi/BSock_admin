// adminOrder.services.ts
import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

export interface OrderItem {
  productId: { _id: string; name: string; price: number };
  skuFamilyId: { _id: string; name: string };
  quantity: number;
  price: number;
}

export interface Address {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface PaymentDetails {
  module?: string;
  currency?: string;
  acceptedTerms?: boolean;
  fields?: Record<string, any>; // Dynamic fields map
  uploadedFiles?: string[]; // File paths
  transactionRef?: string;
  status?: string;
  remarks?: string;
}

export interface Order {
  _id: string;
  customerId: { _id: string; name?: string; email?: string };
  cartItems: OrderItem[];
  billingAddress: Address;
  shippingAddress: Address;
  status: string;
  totalAmount: number;
  createdAt: string;
  verifiedBy?: string;
  approvedBy?: string;
  canVerify?: boolean;
  canApprove?: boolean;
  tracking?: TrackingItem[];
  orderTrackingStatus?: string;
  paymentDetails?: PaymentDetails;
  appliedCharges?: any[];
}

export interface TrackingItem {
  status: string;
  changedBy?: any;
  userType: string;
  changedAt: string;
  message?: string;
}

export interface ListResponse {
  data: {
    docs: Order[];
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

export interface TrackingResponse {
  data: {
    docs: TrackingItem[];
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

export class AdminOrderService {
  static getOrderList = async (
    page: number,
    limit: number,
    search?: string,
    status?: string
  ): Promise<ListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/order/list`;

    const body: any = { page, limit };
    if (search) body.search = search;
    if (status) body.status = status;

    try {
      const res = await api.post(url, body);
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch orders';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static updateOrderStatus = async (
    orderId: string,
    status: string,
    cartItems?: OrderItem[],
    message?: string
  ): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/order/update-status`;

    const body: any = { orderId, status };
    
    if (cartItems && cartItems.length > 0) {
      body.cartItems = cartItems.map(item => ({
        productId: item.productId._id,
        skuFamilyId: item.skuFamilyId._id,
        quantity: item.quantity,
        price: item.price,
      }));
    }
    if (message) {
      body.message = message;
    }

    try {
      const res = await api.post(url, body);
      if (res.status === 200 && res.data.data) {
        toastHelper.showTost(res.data.message || `Order status updated to ${status}!`, 'success');
        return res.data;
      } else {
        toastHelper.showTost(res.data.message || 'Failed to update order status', 'warning');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update order status';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static getOrderTracking = async (orderId: string, page: number = 1, limit: number = 10): Promise<TrackingResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/order/tracking/list`;

    try {
      const res = await api.post(url, { orderId, page, limit });
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch order tracking';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  static exportOrdersExcel = async (status?: string): Promise<Blob> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/order/export`;
    try {
      const body: any = {};
      if (status) body.status = status;
      const res = await api.post(url, body, { responseType: 'blob' });
      return res.data as Blob;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to export orders';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }
}

export default AdminOrderService;
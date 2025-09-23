import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

export interface Negotiation {
  _id?: string;
  productId: string | {
    _id: string;
    name: string;
    price: number;
    mainImage: string;
    skuFamilyId?: {
      _id: string;
      name: string;
    };
  };
  fromUserId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  FromUserType: 'Admin' | 'Customer';
  toUserId?: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  toUserType?: 'Admin' | 'Customer';
  offerPrice: number;
  message?: string;
  status: 'negotiation' | 'accepted';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NegotiationListResponse {
  negotiations: Negotiation[];
  totalPages: number;
  currentPage: number;
  total: number;
  message: string;
  success: boolean;
}

export interface NegotiationStats {
  totalNegotiations: number;
  activeNegotiations: number;
  acceptedNegotiations: number;
  customerBids: number;
  adminBids: number;
}

export interface NegotiationStatsResponse {
  data: NegotiationStats;
  message: string;
  success: boolean;
}

export interface RespondToNegotiationRequest {
  negotiationId: string;
  action: 'accept' | 'counter';
  offerPrice?: number;
  message?: string;
}

export class NegotiationService {
  // Get all negotiations for admin
  static async getAllNegotiations(page = 1, limit = 10, status?: string, customerId?: string): Promise<NegotiationListResponse> {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
      const url = `${baseUrl}/api/${adminRoute}/negotiation/list`;

      const body: any = { page, limit };
      if (status) body.status = status;
      if (customerId) body.customerId = customerId;

      const res = await api.post(url, body);
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch negotiations');
      }
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch negotiations';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  // Respond to customer's negotiation
  static async respondToNegotiation(responseData: RespondToNegotiationRequest): Promise<any> {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
      const url = `${baseUrl}/api/${adminRoute}/negotiation/respond`;

      const res = await api.post(url, responseData);
      // Check if response status is 200 and data is not null
      if (res.status === 200 && res.data.data) {
        toastHelper.showTost(res.data.message || 'Response sent successfully!', 'success');
        return res.data.data;
      } else {
        // Show warning message and return false
        toastHelper.showTost(res.data.message || 'Failed to send response', 'warning');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send response';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  // Get negotiation details
  static async getNegotiationDetails(negotiationId: string): Promise<any> {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
      const url = `${baseUrl}/api/${adminRoute}/negotiation/details`;

      const res = await api.post(url, { negotiationId });
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch negotiation details');
      }
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch negotiation details';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  // Get accepted negotiations for admin
  static async getAcceptedNegotiations(page = 1, limit = 10): Promise<NegotiationListResponse> {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
      const url = `${baseUrl}/api/${adminRoute}/negotiation/accepted`;

      const res = await api.post(url, { page, limit });
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch accepted negotiations');
      }
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch accepted negotiations';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  // Get negotiation statistics
  static async getNegotiationStats(): Promise<NegotiationStatsResponse> {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
      const url = `${baseUrl}/api/${adminRoute}/negotiation/stats`;

      const res = await api.post(url, {});
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch negotiation statistics');
      }
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch negotiation statistics';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }
}

export default NegotiationService;

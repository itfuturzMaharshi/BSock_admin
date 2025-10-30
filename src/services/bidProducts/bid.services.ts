import api from '../api/api';
import toastHelper from '../../utils/toastHelper';

export interface BidHistoryItem {
  _id: string;
  product: string;
  bidAmount: number;
  isWinning: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  customer?: {
    _id?: string;
    name?: string;
    email?: string;
    profileImage?: string;
  };
}

export interface BidHistoryResponse {
  status: number;
  message: string;
  data: {
    product: {
      _id: string;
      lotNumber: string;
      description: string;
      status?: string;
      currentPrice?: number;
      highestBidder?: string;
      winner?: string;
      finalPrice?: number;
    } | null;
    bids: {
      docs: BidHistoryItem[];
      totalDocs: number;
      limit: number;
      totalPages: number;
      page: number;
      pagingCounter: number;
      hasPrevPage: boolean;
      hasNextPage: boolean;
      prevPage: number | null;
      nextPage: number | null;
    } | null;
  };
}

export class BidService {
  static async getBidHistory(productId: string, page = 1, limit = 10): Promise<BidHistoryResponse> {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/bid/history`;

    try {
      const res = await api.post(url, { productId, page, limit });
      return res.data as BidHistoryResponse;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch bid history';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }
}



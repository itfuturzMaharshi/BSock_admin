import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

export interface BidTracking {
  _id?: string;
  trackId: string;
  lotNumbers: string[];
  createdBy: any;
  isDeleted?: boolean;
  createdAt: string;
}

export interface ListResponse {
  data: {
    docs: BidTracking[];
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

export class BidTrackingService {
  // Get bid tracking list with pagination
  static getBidTrackingList = async (page: number, limit: number): Promise<ListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/bidProductTracking/list`;

    const body: any = { page, limit };

    try {
      const res = await api.post(url, body);
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch Bid Tracking';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Delete by track
  static deleteByTrack = async (trackId: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/bidProduct/deleteByTrack`;

    try {
      const res = await api.post(url, { trackId });
      toastHelper.showTost(res.data.message || 'Tracking deleted successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete Tracking';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
}
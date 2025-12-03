import api from '../api/api';

export interface DashboardStats {
  customers: {
    total: number;
    today: number;
    change: number;
    isPositive: boolean;
  };
  orders: {
    total: number;
    today: number;
    change: number;
    isPositive: boolean;
  };
  sales: {
    total: number;
    today: number;
    change: number;
    isPositive: boolean;
  };
  products: {
    total: number;
    active: number;
  };
  bids: {
    active: number;
  };
}

export interface ChartData {
  period: 'today' | 'week' | 'month' | 'year';
  categories: string[];
  data: number[];
  total: number;
}

export interface RecentOrder {
  id: string;
  orderId: string;
  name: string;
  variants: string;
  category: string;
  price: string;
  status: 'Delivered' | 'Pending' | 'Canceled';
  originalStatus: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  totalAmount: number;
  itemCount: number;
  image: string;
}

export const DashboardService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.post('/api/admin/dashboard/stats', {});
    return response.data.data;
  },

  getSalesChart: async (period: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<ChartData> => {
    const response = await api.post('/api/admin/dashboard/sales-chart', { period });
    return response.data.data;
  },

  getCustomersChart: async (period: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<ChartData> => {
    const response = await api.post('/api/admin/dashboard/customers-chart', { period });
    return response.data.data;
  },

  getRecentOrders: async (limit: number = 5): Promise<RecentOrder[]> => {
    const response = await api.post('/api/admin/dashboard/recent-orders', { limit });
    return response.data.data.orders;
  },
};



import api from '../api/api';

// Define interfaces for wallet operations
export interface WalletTransaction {
  _id: string;
  customerId: string;
  type: 'credit' | 'debit';
  amount: number;
  remark: string;
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface CustomerWalletData {
  _id: string;
  name: string;
  mobileNumber: string | null;
  walletBalance: string;
  businessProfile: {
    logo: string | null;
    certificate: string | null;
    address: string | null;
    businessName: string | null;
    country: string | null;
    status: string;
  };
}

export interface WalletBalance {
  balance: number;
}

export interface ManageWalletRequest {
  customerId: string;
  amount: number;
  remark?: string;
  type: 'credit' | 'debit';
}

export interface ManageWalletResponse {
  newBalance: number;
}

export interface ListTransactionsRequest {
  customerId: string;
  page?: number;
  limit?: number;
  type?: string;
}

export interface ListTransactionsResponse {
  docs: WalletTransaction[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetWalletBalanceRequest {
  customerId?: string; // Optional now since API doesn't require it
}

// Wallet service functions
export const walletAmountService = {
  // Manage wallet (credit/debit)
  manageWallet: async (data: ManageWalletRequest): Promise<ManageWalletResponse> => {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
      const url = `${baseUrl}/api/${adminRoute}/wallet/manage`;
      
      console.log('Wallet manage URL:', url);
      console.log('Wallet manage data:', data);
      console.log('Environment variables:', {
        VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
        VITE_ADMIN_ROUTE: import.meta.env.VITE_ADMIN_ROUTE
      });
      
      const response = await api.post(url, data);
      return response.data.data;
    } catch (error) {
      console.error('Error managing wallet:', error);
      throw error;
    }
  },

  // Get wallet balance (returns array of customer wallet data)
  getWalletBalance: async (data: GetWalletBalanceRequest = {}): Promise<CustomerWalletData[]> => {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
      const url = `${baseUrl}/api/${adminRoute}/wallet/get`;
      
      console.log('Wallet balance URL:', url);
      console.log('Wallet balance data:', data);
      
      const response = await api.post(url, data);
      return response.data.data;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  },

  // List wallet transactions
  listTransactions: async (data: ListTransactionsRequest): Promise<ListTransactionsResponse> => {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
      const url = `${baseUrl}/api/${adminRoute}/wallet/transactions`;
      
      console.log('Wallet transactions URL:', url);
      console.log('Wallet transactions data:', data);
      
      const response = await api.post(url, data);
      return response.data.data;
    } catch (error) {
      console.error('Error listing transactions:', error);
      throw error;
    }
  }
};

export default walletAmountService;

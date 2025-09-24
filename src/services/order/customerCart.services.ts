import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

export interface CartCustomer {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CartProduct {
  _id: string;
  skuFamilyId: any;
  simType?: string;
  color?: string;
  ram?: string;
  storage?: string;
  condition?: string;
  price: number | string;
  stock: number | string;
  country?: string;
  moq: number | string;
  isNegotiable?: boolean;
  isFlashDeal?: string | boolean;
  expiryTime?: string;
  isApproved?: boolean;
  isDeleted?: boolean;
  specification?: string;
  purchaseType?: string;
}

export interface CustomerCartItem {
  _id: string;
  customer: CartCustomer;
  product: CartProduct;
  quantity: number;
  addedAt: string;
  status: 'active' | 'removed' | 'ordered' | string;
  notes?: string;
}

export interface ListResponse {
  data: {
    docs: CustomerCartItem[];
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

export class CustomerCartService {
  static getCustomerCartList = async (
    page: number,
    limit: number,
    search?: string,
    customerId?: string
  ): Promise<ListResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/order/cart-list`;

    const body: any = { page, limit };
    if (search) body.search = search;
    if (customerId) body.customerId = customerId;

    try {
      const res = await api.post(url, body);
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch customer carts';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
}

export default CustomerCartService;



import api from '../api/api';

export interface Constants {
  spec: {
    COUNTRY: Array<{
      code: string;
      name: string;
      SIM: string[];
    }>;
  };
  grade: Array<{
    code: string;
    name: string;
  }>;
  status: Array<{
    code: string;
    name: string;
  }>;
  lockStatus: Array<{
    code: string;
    name: string;
  }>;
  packing: Array<{
    code: string;
    name: string;
  }>;
  currentLocation: Array<{
    code: string;
    name: string;
  }>;
  deliveryLocation: Array<{
    code: string;
    name: string;
  }>;
  tags: Array<{
    code: number;
    tag: string;
  }>;
  negotiableStatus: Array<{
    code: string;
    name: string;
  }>;
  vendor: Array<{
    code: string;
    name: string;
  }>;
  carrier: Array<{
    code: string;
    name: string;
  }>;
  flashDeal?: Array<{
    code: string;
    name: string;
  }>;
  sequenceOrder?: Array<{
    code: number;
    name: string;
  }>;
  paymentTerm?: Array<{
    code: string;
    name: string;
  }>;
  paymentMethod?: Array<{
    code: string;
    name: string;
  }>;
}

export class ConstantsService {
  static getConstants = async (): Promise<Constants> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/constants/get`;

    try {
      const res = await api.post(url, {});
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch constants';
      console.error('Constants API Error:', errorMessage);
      throw new Error(errorMessage);
    }
  };
}


import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

interface SpecificField {
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'file' | 'image';
  mandatory: boolean;
  providedByAdmin?: boolean;
  value?: string;
  options?: string[];
}

interface PaymentModule {
  name: string;
  enabled: boolean;
  termsAndConditions: boolean;
  specificFields: SpecificField[];
}

interface SharedField {
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'file';
  mandatory: boolean;
  options?: string[];
}

interface PaymentConfig {
  _id?: string;
  modules: PaymentModule[];
  sharedFields: SharedField[];
  createdAt?: string;
  updatedAt?: string;
}

interface PaymentConfigResponse {
  status: number;
  message?: string;
  data: PaymentConfig;
}

interface ListPaymentConfigResponse {
  status: number;
  message?: string;
  data: {
    docs: PaymentConfig[];
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

interface DeleteResponse {
  status: number;
  message?: string;
  data?: number;
}

// Customer Payment Detail interfaces
interface Customer {
  _id: string;
  name: string;
  email: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  totalAmount: number;
}

interface PaymentField {
  name: string;
  value: string;
  type: string;
}

interface CustomerPaymentDetail {
  _id: string;
  customer: Customer;
  order: Order;
  module: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  remarks?: string;
  fields: PaymentField[];
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

interface CustomerPaymentDetailResponse {
  status: number;
  message?: string;
  data: CustomerPaymentDetail;
}

interface ListCustomerPaymentDetailsResponse {
  status: number;
  message?: string;
  data: {
    docs: CustomerPaymentDetail[];
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export class PaymentConfigService {
  static addPaymentConfig = async (configData: Partial<PaymentConfig>): Promise<PaymentConfigResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/payment-config/add`;

    try {
      const res = await api.post(url, configData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Payment config added successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to add payment config', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add payment config';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  static listPaymentConfigs = async (
    page: number = 1,
    limit: number = 10
  ): Promise<ListPaymentConfigResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/payment-config/list`;

    try {
      const res = await api.post(url, { page, limit }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        // toastHelper.showTost(responseData.message || 'Payment configs retrieved successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to retrieve payment configs', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to retrieve payment configs';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  static updatePaymentConfig = async (configData: Partial<PaymentConfig> & { id: string }): Promise<PaymentConfigResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/payment-config/update`;

    try {
      const res = await api.post(url, configData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Payment config updated successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to update payment config', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update payment config';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  static updateModuleStatus = async (
    configId: string,
    moduleIndex: number,
    enabled: boolean
  ): Promise<PaymentConfigResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/payment-config/update-module-status`;

    try {
      const res = await api.post(
        url,
        { configId, moduleIndex, enabled },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(
          responseData.message || 'Module status updated successfully!',
          'success'
        );
      } else {
        toastHelper.showTost(
          responseData.message || 'Failed to update module status',
          'warning'
        );
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update module status';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  static updateModuleTermsAndConditions = async (
    configId: string,
    moduleIndex: number,
    termsAndConditions: boolean
  ): Promise<PaymentConfigResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/payment-config/update-module-terms`;

    try {
      const res = await api.post(
        url,
        { configId, moduleIndex, termsAndConditions },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(
          responseData.message || 'Terms & conditions updated successfully!',
          'success'
        );
      } else {
        toastHelper.showTost(
          responseData.message || 'Failed to update terms & conditions',
          'warning'
        );
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update terms & conditions';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  static deletePaymentConfig = async (id: string): Promise<DeleteResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/payment-config/delete`;

    try {
      const res = await api.post(url, { id }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Payment config deleted successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to delete payment config', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete payment config';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Customer Payment Detail methods
  static getPaymentDetail = async (id: string): Promise<CustomerPaymentDetailResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/payment/get`;

    try {
      const res = await api.post(url, { id }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Payment detail retrieved successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to retrieve payment detail', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to retrieve payment detail';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  static updatePaymentDetail = async (updateData: { id: string; status: string; remarks?: string }): Promise<CustomerPaymentDetailResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/payment/update`;

    try {
      const res = await api.post(url, updateData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Payment detail updated successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to update payment detail', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update payment detail';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  static listPaymentDetails = async (
    page: number = 1,
    limit: number = 10,
    search: string = '',
    module: string = '',
    status: string = ''
  ): Promise<ListCustomerPaymentDetailsResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/payment/list`;

    try {
      const res = await api.post(url, { page, limit, search, module, status }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        // toastHelper.showTost(responseData.message || 'Payment details retrieved successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to retrieve payment details', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to retrieve payment details';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  static getPaymentDetailsByCustomer = async (
    customerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ListCustomerPaymentDetailsResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/payment/details-by-customer`;

    try {
      const res = await api.post(url, { customerId, page, limit }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        // toastHelper.showTost(responseData.message || 'Customer payment details retrieved successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to retrieve customer payment details', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to retrieve customer payment details';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };
}
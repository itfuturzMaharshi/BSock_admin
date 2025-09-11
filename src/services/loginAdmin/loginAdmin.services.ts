import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  status: number;
  message?: string;
  token?: string;
  data?: any;
}

export class LoginAdminService {
  static loginAdmin = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/login`;

    try {
      const res = await api.post(
        url,
        credentials,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const responseData = res.data;
      
      let token: string | undefined;
      
      if (responseData.token) {
        token = responseData.token;
      } else if (responseData.data && responseData.data.token) {
        token = responseData.data.token;
      } else if (typeof responseData.data === 'string') {
        token = responseData.data;
      }

      if (res.status === 200 && token) {
        toastHelper.showTost(responseData.message || 'Login successful!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Login failed', 'warning');
      }

      return {
        status: res.status,
        token,
        message: responseData.message,
        data: responseData
      };
    } catch (err: any) {
      let errorMessage = 'An unknown error occurred';
      if (err.response) {
        errorMessage = err.response.data.message || 'Login failed';
        toastHelper.error(errorMessage);
      } else if (err.request) {
        errorMessage = 'No response from server';
        toastHelper.error(errorMessage);
      } else {
        toastHelper.error(err.message || errorMessage);
      }
      throw new Error(errorMessage);
    }
  };
}
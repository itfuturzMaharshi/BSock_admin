import toastHelper from '../../utils/toastHelper';
import api from '../api/api';

interface ProfileResponse {
  status: number;
  message?: string;
  data: {
    _id: string;
    name: string;
    email: string;
    password: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    __v: string;
  };
}

interface ChangePasswordResponse {
  status: number;
  message?: string;
}

export class UserProfileService {
  static getProfile = async (): Promise<ProfileResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/getProfile`;

    try {
      const res = await api.post(url, {}, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Profile fetched successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to fetch profile', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch profile';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  static changePassword = async (currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/changePassword`;

    try {
      const res = await api.post(url, { currentPassword, newPassword }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Password changed successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to change password', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to change password';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };
}
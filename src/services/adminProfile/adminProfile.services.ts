// src/services/adminProfile/adminProfile.services.ts
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

interface Settings {
  _id?: string;
  bidWalletAllowancePer: number | null;
  readyStockAllowancePer: number | null;
  readyStockOrderProcess: { name: string; order: number }[];
  reportTime: string;
  timezone: string;
}

interface SettingsResponse {
  status: number;
  message?: string;
  data: Settings | Settings[] | { docs: Settings[] };
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
        localStorage.setItem('userId', responseData.data._id);
        // toastHelper.showTost(responseData.message || 'Profile fetched successfully!', 'success');
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

  static createSettings = async (settingsData: Settings): Promise<SettingsResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/settings/create`;

    try {
      const res = await api.post(url, settingsData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Settings created successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to create settings', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create settings';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  static updateSettings = async (settingsData: Settings): Promise<SettingsResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/settings/update`;

    try {
      const res = await api.post(url, settingsData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Settings updated successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to update settings', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update settings';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  static listSettings = async (page: number = 1, limit: number = 10): Promise<SettingsResponse> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/settings/list`;

    try {
      const res = await api.post(url, { page, limit }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = res.data;

      if (res.status === 200) {
        // toastHelper.showTost(responseData.message || 'Settings retrieved successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to retrieve settings', 'warning');
      }

      return {
        status: res.status,
        message: responseData.message,
        data: responseData.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to retrieve settings';
      toastHelper.error(errorMessage);
      throw new Error(errorMessage);
    }
  };
}
import api from "../api/api";
import toastHelper from "../../utils/toastHelper";

export interface Module {
  key: string;
  name: string;
  path: string;
  icon: string;
  subItems?: { name: string; path: string }[];
}

export interface Permission {
  read: boolean;
  write: boolean;
  verifyApprove: boolean;
}

export interface ModulePermissions {
  [moduleKey: string]: Permission;
}

export interface AdminPermissions {
  admin: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  permissions: ModulePermissions;
  modules: Module[];
}

export interface MyPermissions {
  role: string;
  modules: (Module & {
    hasAccess: boolean;
    permissions: Permission;
  })[];
}

export class RoleManagementService {
  // Get all available modules
  static getModules = async (): Promise<Module[]> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/role/get-modules`;

    try {
      const res = await api.post(url, {});
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch modules');
      }
      return res.data?.data || [];
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch modules';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get all available roles
  static getRoles = async (): Promise<string[]> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/role/get-roles`;

    try {
      const res = await api.post(url, {});
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch roles');
      }
      return res.data?.data || [];
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch roles';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get current admin's permissions (for sidebar)
  static getMyPermissions = async (): Promise<MyPermissions> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/role/get-my-permissions`;

    try {
      const res = await api.post(url, {});
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch permissions');
      }
      return res.data?.data || { role: 'admin', modules: [] };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch permissions';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get permissions for a specific admin
  static getAdminPermissions = async (adminId: string): Promise<AdminPermissions> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/role/get-admin-permissions`;

    try {
      const res = await api.post(url, { adminId });
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch admin permissions');
      }
      return res.data?.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch admin permissions';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Update permissions for an admin
  static updateAdminPermissions = async (
    adminId: string,
    permissions: ModulePermissions
  ): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/role/update-admin-permissions`;

    try {
      const res = await api.post(url, { adminId, permissions });
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to update permissions');
      }
      toastHelper.showTost(res.data.message || 'Permissions updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update permissions';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Update admin role
  static updateAdminRole = async (adminId: string, role: string): Promise<any> => {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const adminRoute = import.meta.env.VITE_ADMIN_ROUTE;
    const url = `${baseUrl}/api/${adminRoute}/role/update-admin-role`;

    try {
      const res = await api.post(url, { adminId, role });
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to update role');
      }
      toastHelper.showTost(res.data.message || 'Role updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update role';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
}


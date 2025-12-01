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
  permissions?: {
    role: string;
    modules: any[];
  };
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
      
      // Response structure from backend: 
      // { status: 200, message: '...', data: { token, admin, role, permissions: { role, modules: [...] } } }
      console.log('🔍 Login response structure:', {
        status: responseData.status,
        hasData: !!responseData.data,
        dataKeys: responseData.data ? Object.keys(responseData.data) : [],
        dataStructure: responseData.data ? {
          hasToken: !!responseData.data.token,
          hasAdmin: !!responseData.data.admin,
          hasRole: !!responseData.data.role,
          hasPermissions: !!responseData.data.permissions,
        } : null,
      });
      
      let token: string | undefined;
      let permissions: any = undefined;
      
      // Extract token from various possible locations
      if (responseData.token) {
        token = responseData.token;
      } else if (responseData.data && responseData.data.token) {
        token = responseData.data.token;
      } else if (typeof responseData.data === 'string') {
        token = responseData.data;
      }

      // Extract permissions from response
      // Backend returns: response.success('...', { token, admin, role, permissions: {...} }, res)
      // So structure is: { status: 200, message: '...', data: { token, admin, role, permissions } }
      if (responseData.data?.permissions) {
        permissions = responseData.data.permissions;
        console.log('✅ Found permissions in responseData.data.permissions:', {
          role: permissions.role,
          modulesCount: permissions.modules?.length || 0,
        });
      } else if (responseData.permissions) {
        permissions = responseData.permissions;
        console.log('✅ Found permissions in responseData.permissions:', {
          role: permissions.role,
          modulesCount: permissions.modules?.length || 0,
        });
      } else {
        console.error('❌ No permissions found in response!');
        console.error('Full response:', JSON.stringify(responseData, null, 2));
      }

      if (res.status === 200 && token) {
        toastHelper.showTost(responseData.message || 'Login successful!', 'success');
        
        // Store permissions if available
        if (permissions) {
          console.log('Storing permissions from login:', permissions);
          localStorage.setItem('adminPermissions', JSON.stringify(permissions));
          localStorage.setItem('adminRole', permissions.role || 'admin');
          
          // Dispatch event to notify sidebar to update
          window.dispatchEvent(new Event('permissionsUpdated'));
        } else {
          console.warn('No permissions found in login response');
        }
      } else {
        toastHelper.showTost(responseData.message || 'Login failed', 'warning');
      }

      return {
        status: res.status,
        token,
        message: responseData.message,
        data: responseData,
        permissions: permissions,
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
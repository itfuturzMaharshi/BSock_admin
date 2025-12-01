import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RoleManagementService, MyPermissions } from '../services/roleManagement/roleManagement.services';

interface PermissionsContextType {
  permissions: MyPermissions | null;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
  hasAccess: (modulePath: string) => boolean;
  hasPermission: (modulePath: string, permission: 'read' | 'write' | 'verifyApprove') => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
};

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
  const [permissions, setPermissions] = useState<MyPermissions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      
      // First, try to get permissions from localStorage (from login)
      const storedPermissions = localStorage.getItem('adminPermissions');
      const storedRole = localStorage.getItem('adminRole');
      
      if (storedPermissions && storedRole) {
        try {
          const parsedPermissions = JSON.parse(storedPermissions);
          setPermissions(parsedPermissions);
          setLoading(false);
          return; // Use stored permissions
        } catch (e) {
          console.error('Error parsing stored permissions:', e);
        }
      }
      
      // If no stored permissions, fetch from API
      const myPermissions = await RoleManagementService.getMyPermissions();
      setPermissions(myPermissions);
      
      // Store in localStorage for future use
      localStorage.setItem('adminPermissions', JSON.stringify(myPermissions));
      localStorage.setItem('adminRole', myPermissions.role);
    } catch (error) {
      console.error('Error loading permissions:', error);
      // On error, set default permissions (superadmin access)
      setPermissions({
        role: 'superadmin',
        modules: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPermissions = async () => {
    await loadPermissions();
  };

  const hasAccess = (modulePath: string): boolean => {
    if (!permissions) return false;
    
    if (permissions.role === 'superadmin') {
      return true;
    }
    
    const module = permissions.modules.find(
      (m) => m.path === modulePath || m.subItems?.some((si) => si.path === modulePath)
    );
    
    return module?.hasAccess || false;
  };

  const hasPermission = (modulePath: string, permission: 'read' | 'write' | 'verifyApprove'): boolean => {
    if (!permissions) return false;
    
    if (permissions.role === 'superadmin') {
      return true;
    }
    
    const module = permissions.modules.find(
      (m) => m.path === modulePath || m.subItems?.some((si) => si.path === modulePath)
    );
    
    if (!module) return false;
    
    return module.permissions[permission] === true;
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        loading,
        refreshPermissions,
        hasAccess,
        hasPermission,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};




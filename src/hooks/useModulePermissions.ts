import { usePermissions } from '../context/PermissionsContext';

/**
 * Custom hook to get permissions for a specific module
 * @param modulePath - The path of the module (e.g., '/admin', '/products', '/sellers')
 * @returns Object with canRead, canWrite, canVerifyApprove boolean flags
 */
export const useModulePermissions = (modulePath: string) => {
  const { hasPermission } = usePermissions();
  
  return {
    canRead: hasPermission(modulePath, 'read'),
    canWrite: hasPermission(modulePath, 'write'),
    canVerifyApprove: hasPermission(modulePath, 'verifyApprove'),
  };
};


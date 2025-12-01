import React, { useState, useEffect } from "react";
import { RoleManagementService, Module, Permission, ModulePermissions } from "../../services/roleManagement/roleManagement.services";
import toastHelper from "../../utils/toastHelper";

interface PermissionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
  adminName: string;
  adminRole: string;
  onUpdate: () => void;
}

const PermissionManagementModal: React.FC<PermissionManagementModalProps> = ({
  isOpen,
  onClose,
  adminId,
  adminName,
  adminRole,
  onUpdate,
}) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState<ModulePermissions>({});
  const [selectedRole, setSelectedRole] = useState<string>(adminRole);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && adminId) {
      fetchData();
    }
  }, [isOpen, adminId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modulesData, rolesData, adminPermissionsData] = await Promise.all([
        RoleManagementService.getModules(),
        RoleManagementService.getRoles(),
        RoleManagementService.getAdminPermissions(adminId),
      ]);

      setModules(modulesData);
      setAvailableRoles(rolesData);
      setSelectedRole(adminPermissionsData.admin.role);
      setPermissions(adminPermissionsData.permissions || {});
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (moduleKey: string, permissionType: keyof Permission, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [permissionType]: value,
      },
    }));
  };

  const handleRoleChange = async (newRole: string) => {
    setSelectedRole(newRole);
    // If changing to superadmin, set all permissions to true
    if (newRole === "superadmin") {
      const allPermissions: ModulePermissions = {};
      modules.forEach((module) => {
        allPermissions[module.key] = {
          read: true,
          write: true,
          verifyApprove: true,
        };
      });
      setPermissions(allPermissions);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update role first if changed
      if (selectedRole !== adminRole) {
        await RoleManagementService.updateAdminRole(adminId, selectedRole);
      }

      // Update permissions (only if not superadmin, as superadmin has all permissions)
      if (selectedRole !== "superadmin") {
        await RoleManagementService.updateAdminPermissions(adminId, permissions);
      }

      toastHelper.showTost("Permissions updated successfully!", "success");
      
      // Refresh permissions in localStorage
      const updatedPermissions = await RoleManagementService.getMyPermissions();
      localStorage.setItem('adminPermissions', JSON.stringify(updatedPermissions));
      localStorage.setItem('adminRole', updatedPermissions.role);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('permissionsUpdated'));
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error saving permissions:", error);
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = selectedRole === "superadmin";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Permissions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {adminName} ({adminRole})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
                {isSuperAdmin && (
                  <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                    <i className="fas fa-info-circle mr-1"></i>
                    Superadmin has all permissions by default
                  </p>
                )}
              </div>

              {/* Permissions Table */}
              {!isSuperAdmin && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Module
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Read
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Write
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Verify/Approve
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((module) => (
                        <tr
                          key={module.key}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <i className={`${module.icon} text-gray-500`}></i>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {module.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={permissions[module.key]?.read || false}
                              onChange={(e) =>
                                handlePermissionChange(module.key, "read", e.target.checked)
                              }
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={permissions[module.key]?.write || false}
                              onChange={(e) =>
                                handlePermissionChange(module.key, "write", e.target.checked)
                              }
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={permissions[module.key]?.verifyApprove || false}
                              onChange={(e) =>
                                handlePermissionChange(
                                  module.key,
                                  "verifyApprove",
                                  e.target.checked
                                )
                              }
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {isSuperAdmin && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <i className="fas fa-shield-alt text-4xl mb-4"></i>
                  <p className="text-lg font-medium">Superadmin has full access to all modules</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              "Save Permissions"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionManagementModal;


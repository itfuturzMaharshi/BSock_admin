// src/components/UserInfoCard.tsx
import { useState, useEffect } from "react";
import toastHelper from "../../utils/toastHelper";
import { UserProfileService } from "../../services/adminProfile/adminProfile.services";
import SettingsModal from "./SettingsModal";

interface FormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserInfoCardProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

export default function UserInfoCard({
  formData,
  handleChange,
  setFormData,
}: UserInfoCardProps) {
  const [showPassword, setShowPassword] = useState<{
    current: boolean;
    new: boolean;
    confirm: boolean;
  }>({
    current: false,
    new: false,
    confirm: false,
  });
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "update">("create");
  const [selectedSettings, setSelectedSettings] = useState<any>(null);

  const togglePassword = (field: "current" | "new" | "confirm") => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toastHelper.error("New password and confirm password do not match");
      return;
    }

    if (!formData.currentPassword || !formData.newPassword) {
      toastHelper.error("Please fill in all password fields");
      return;
    }

    try {
      const response = await UserProfileService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (response.status === 200) {
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }
    } catch (error) {
      console.error("Error changing password:", error);
    }
  };

  const handleListSettings = async () => {
    try {
      const response = await UserProfileService.listSettings();
      if (response.status === 200) {
        const settings = (response.data as any).docs || [];
        setSettingsList(settings);
      }
    } catch (error) {
      console.error("Error listing settings:", error);
      setSettingsList([]);
    }
  };

  const openCreateModal = () => {
    // Only allow creating if no settings exist
    if (settingsList.length === 0) {
      setModalMode("create");
      setSelectedSettings(null);
      setIsModalOpen(true);
    } else {
      toastHelper.error("Settings already exist. Please update the existing settings.");
    }
  };

  const openUpdateModal = (settings: any) => {
    setModalMode("update");
    setSelectedSettings({
      _id: settings._id,
      bidWalletAllowancePer: settings.bidWalletAllowancePer?.toString() || "",
      readyStockAllowancePer: settings.readyStockAllowancePer?.toString() || "",
      readyStockOrderProcess: JSON.stringify(settings.readyStockOrderProcess) || "",
      reportTime: settings.reportTime || "",
      timezone: settings.timezone || "Asia/Kolkata",
      percentage: settings.percentage?.toString() || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSettings(null);
  };

  useEffect(() => {
    handleListSettings();
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-6">
            {/* Profile Picture with Initials */}
            <div className="relative">
              <div className="w-20 h-20 bg-[#0071E3] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(formData.name)}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                <i className="fas fa-camera text-xs text-gray-600 dark:text-gray-300"></i>
              </button>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                {formData.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
                Admin
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400">
                {formData.email}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0071E3] dark:text-blue-400">
              Personal Information
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">First Name</p>
              <p className="text-lg font-medium text-gray-800 dark:text-white">
                {formData.name.split(' ')[0]}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Name</p>
              <p className="text-lg font-medium text-gray-800 dark:text-white">
                {formData.name.split(' ').slice(1).join(' ') || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email Address</p>
              <p className="text-lg font-medium text-gray-800 dark:text-white">
                {formData.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">User Role</p>
              <p className="text-lg font-medium text-gray-800 dark:text-white">
                Admin
              </p>
            </div>
          </div>
        </div>

        {/* Account Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0071E3] dark:text-blue-400">
              Account Settings
            </h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <i className="fas fa-lock text-gray-500"></i> Current Password
              </p>
              <div className="relative">
                <input
                  type={showPassword.current ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-[#0071E3] dark:bg-gray-700 dark:text-white/90"
                />
                <button
                  type="button"
                  onClick={() => togglePassword("current")}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  <i className={`fas ${showPassword.current ? "fa-eye" : "fa-eye-slash"}`}></i>
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <i className="fas fa-lock text-gray-500"></i> New Password
              </p>
              <div className="relative">
                <input
                  type={showPassword.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-[#0071E3] dark:bg-gray-700 dark:text-white/90"
                />
                <button
                  type="button"
                  onClick={() => togglePassword("new")}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  <i className={`fas ${showPassword.new ? "fa-eye" : "fa-eye-slash"}`}></i>
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <i className="fas fa-lock text-gray-500"></i> Confirm Password
              </p>
              <div className="relative">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-[#0071E3] dark:bg-gray-700 dark:text-white/90"
                />
                <button
                  type="button"
                  onClick={() => togglePassword("confirm")}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  <i className={`fas ${showPassword.confirm ? "fa-eye" : "fa-eye-slash"}`}></i>
                </button>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={handleChangePassword}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#0071E3] px-6 py-3 text-base font-medium text-white shadow hover:bg-[#005bb5] transition-colors"
              >
                <i className="fas fa-pen-to-square"></i> Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#0071E3] dark:text-blue-400">
              System Settings
            </h2>
            {settingsList.length === 0 ? (
              <button
                onClick={openCreateModal}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <i className="fas fa-plus text-sm"></i>
                Create Settings
              </button>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Settings exist - Use Update button below to modify
              </div>
            )}
          </div>
          
          {settingsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 dark:border-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Wallet Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Bid Wallet Allowance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ready Stock Allowance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Report Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Timezone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {settingsList.map((settings) => (
                    <tr
                      key={settings._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white/90">
                        {settings.percentage ?? "N/A"}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white/90">
                        {settings.bidWalletAllowancePer || "N/A"}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white/90">
                        {settings.readyStockAllowancePer || "N/A"}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white/90">
                        {settings.reportTime || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white/90">
                        {settings.timezone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openUpdateModal(settings)}
                          className="flex items-center justify-center gap-2 rounded-lg bg-[#0071E3] px-3 py-2 text-sm font-medium text-white shadow hover:bg-[#005bb5] transition-colors"
                        >
                          <i className="fas fa-pen-to-square"></i> Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-base text-gray-500 dark:text-gray-400">
                No settings configuration found. Click "Create Settings" above to add your first configuration.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mode={modalMode}
        initialData={selectedSettings}
        onSave={handleListSettings}
      />
    </div>
  );
}
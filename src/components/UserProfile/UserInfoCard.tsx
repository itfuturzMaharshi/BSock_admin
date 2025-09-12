import { useState } from "react";
import toastHelper from '../../utils/toastHelper';
import { UserProfileService } from "../../services/adminProfile/adminProfile.services";

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

export default function UserInfoCard({ formData, handleChange, setFormData }: UserInfoCardProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "account">("profile");
  const [showPassword, setShowPassword] = useState<{
    current: boolean;
    new: boolean;
    confirm: boolean;
  }>({
    current: false,
    new: false,
    confirm: false,
  });

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
        // Clear password fields after successful change
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

  return (
    <div className="p-5 border bg-white border-gray-200 rounded-2xl shadow dark:border-gray-800 lg:p-6">
      <div className="flex gap-6 border-b pb-3 mb-5">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-2 text-base font-medium ${
            activeTab === "profile"
              ? "border-b-2 border-[#0071E3] text-[#0071E3]"
              : "text-gray-600 dark:text-gray-400 hover:text-[#0071E3]"
          }`}
        >
          <i className="fas fa-user mr-2"></i> Profile
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={`pb-2 text-base font-medium ${
            activeTab === "account"
              ? "border-b-2 border-[#0071E3] text-[#0071E3]"
              : "text-gray-600 dark:text-gray-400 hover:text-[#0071E3]"
          }`}
        >
          <i className="fas fa-cog mr-2"></i> Account Setting
        </button>
      </div>

      {activeTab === "profile" ? (
        <div className="grid grid-cols-1 gap-6">
          <div>
            <p className="mb-2 flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-400">
              <i className="fas fa-user text-gray-500"></i> Name
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {formData.name}
            </p>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-400">
              <i className="fas fa-envelope text-gray-500"></i> Email
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {formData.email}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div>
            <p className="mb-2 flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-400">
              <i className="fas fa-lock text-gray-500"></i> Current Password
            </p>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:ring focus:ring-brand-300 dark:bg-gray-800 dark:text-white/90"
              />
              <button
                type="button"
                onClick={() => togglePassword("current")}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                <i
                  className={`fas ${
                    showPassword.current ? "fa-eye" : "fa-eye-slash"
                  }`}
                ></i>
              </button>
            </div>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-400">
              <i className="fas fa-lock text-gray-500"></i> New Password
            </p>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:ring focus:ring-brand-300 dark:bg-gray-800 dark:text-white/90"
              />
              <button
                type="button"
                onClick={() => togglePassword("new")}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                <i
                  className={`fas ${
                    showPassword.new ? "fa-eye" : "fa-eye-slash"
                  }`}
                ></i>
              </button>
            </div>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-400">
              <i className="fas fa-lock text-gray-500"></i> Confirm Password
            </p>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:ring focus:ring-brand-300 dark:bg-gray-800 dark:text-white/90"
              />
              <button
                type="button"
                onClick={() => togglePassword("confirm")}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                <i
                  className={`fas ${
                    showPassword.confirm ? "fa-eye" : "fa-eye-slash"
                  }`}
                ></i>
              </button>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleChangePassword}
              className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-[#0071E3] px-4 py-3 text-base font-medium text-white shadow hover:bg-[#005bb5] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              <i className="fa-solid fa-pen-to-square"></i> Change Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
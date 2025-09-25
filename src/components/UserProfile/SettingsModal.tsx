// src/components/SettingsModal.tsx
import { useState } from "react";
import toastHelper from '../../utils/toastHelper';
import { UserProfileService } from "../../services/adminProfile/adminProfile.services";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "update";
  initialData?: {
    _id?: string;
    bidWalletAllowancePer: string;
    readyStockAllowancePer: string;
    readyStockOrderProcess: string;
    reportTime: string;
    timezone: string;
  };
  onSave: () => void;
}

export default function SettingsModal({ isOpen, onClose, mode, initialData, onSave }: SettingsModalProps) {
  const [formData, setFormData] = useState({
    bidWalletAllowancePer: initialData?.bidWalletAllowancePer || "",
    readyStockAllowancePer: initialData?.readyStockAllowancePer || "",
    readyStockOrderProcess: initialData?.readyStockOrderProcess || "",
    reportTime: initialData?.reportTime || "",
    timezone: initialData?.timezone || "Asia/Kolkata",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.bidWalletAllowancePer || !formData.readyStockAllowancePer || !formData.reportTime || !formData.timezone) {
      toastHelper.error("Please fill in all required fields");
      return;
    }

    try {
      const settingsData = {
        id: initialData?._id,
        bidWalletAllowancePer: parseFloat(formData.bidWalletAllowancePer) || null,
        readyStockAllowancePer: parseFloat(formData.readyStockAllowancePer) || null,
        readyStockOrderProcess: formData.readyStockOrderProcess ? JSON.parse(formData.readyStockOrderProcess) : [],
        reportTime: formData.reportTime,
        timezone: formData.timezone,
      };

      const response = mode === "create"
        ? await UserProfileService.createSettings(settingsData)
        : await UserProfileService.updateSettings(settingsData);

      if (response.status === 200) {
        onSave(); // Trigger refresh of settings list
        onClose(); // Close modal
      }
    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} settings:`, error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#77797c30] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white/90">
          {mode === "create" ? "Create Settings" : "Update Settings"}
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <i className="fas fa-wallet text-gray-500"></i> Bid Wallet Allowance (%)
            </label>
            <input
              type="number"
              name="bidWalletAllowancePer"
              value={formData.bidWalletAllowancePer}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring focus:ring-brand-300 dark:bg-gray-800 dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <i className="fas fa-box text-gray-500"></i> Ready Stock Allowance (%)
            </label>
            <input
              type="number"
              name="readyStockAllowancePer"
              value={formData.readyStockAllowancePer}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring focus:ring-brand-300 dark:bg-gray-800 dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <i className="fas fa-list-ol text-gray-500"></i> Ready Stock Order Process (JSON)
            </label>
            <input
              type="text"
              name="readyStockOrderProcess"
              value={formData.readyStockOrderProcess}
              onChange={handleChange}
              placeholder='[{"name":"Step1","order":1}]'
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring focus:ring-brand-300 dark:bg-gray-800 dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <i className="fas fa-clock text-gray-500"></i> Report Time
            </label>
            <input
              type="text"
              name="reportTime"
              value={formData.reportTime}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring focus:ring-brand-300 dark:bg-gray-800 dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <i className="fas fa-globe text-gray-500"></i> Timezone
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring focus:ring-brand-300 dark:bg-gray-800 dark:text-white/90"
            >
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              {/* Add more timezones as needed */}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-[#0071E3] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#005bb5] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            <i className="fa-solid fa-pen-to-square"></i>
            {mode === "create" ? "Create" : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
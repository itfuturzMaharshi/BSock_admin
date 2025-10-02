// src/components/SettingsModal.tsx
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toastHelper from '../../utils/toastHelper';
import { UserProfileService } from "../../services/adminProfile/adminProfile.services";

interface ProcessStep {
  name: string;
  order: number;
}


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
    percentage?: string; // ✅ new field
  };
  onSave: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  mode,
  initialData,
  onSave,
}: SettingsModalProps) {
  const [formData, setFormData] = useState({
    bidWalletAllowancePer: initialData?.bidWalletAllowancePer || "",
    readyStockAllowancePer: initialData?.readyStockAllowancePer || "",
    reportTime: initialData?.reportTime || "",
    timezone: initialData?.timezone || "Asia/Kolkata",
    percentage: initialData?.percentage || "", // ✅ added in state
  });

  const [readyStockOrderProcess, setReadyStockOrderProcess] = useState<ProcessStep[]>([]);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        bidWalletAllowancePer: initialData.bidWalletAllowancePer || "",
        readyStockAllowancePer: initialData.readyStockAllowancePer || "",
        reportTime: initialData.reportTime || "",
        timezone: initialData.timezone || "Asia/Kolkata",
        percentage: initialData.percentage || "",
      });

      // Parse readyStockOrderProcess from JSON string or default to empty array
      try {
        const parsedProcess = initialData.readyStockOrderProcess 
          ? JSON.parse(initialData.readyStockOrderProcess)
          : [];
        setReadyStockOrderProcess(Array.isArray(parsedProcess) ? parsedProcess : []);
      } catch (error) {
        console.error('Error parsing readyStockOrderProcess:', error);
        setReadyStockOrderProcess([]);
      }
    } else {
      // Reset form for create mode
      setFormData({
        bidWalletAllowancePer: "",
        readyStockAllowancePer: "",
        reportTime: "",
        timezone: "Asia/Kolkata",
        percentage: "",
      });
      setReadyStockOrderProcess([]);
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handler functions for Ready Stock Order Process
  const addProcessStep = () => {
    setReadyStockOrderProcess(prev => [
      ...prev,
      { name: '', order: prev.length + 1 }
    ]);
  };

  const removeProcessStep = (index: number) => {
    setReadyStockOrderProcess(prev => prev.filter((_, i) => i !== index));
  };

  const updateProcessStep = (index: number, field: keyof ProcessStep, value: string | number) => {
    setReadyStockOrderProcess(prev => 
      prev.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    );
  };

  // Handle date/time change for react-datepicker
  const handleTimeChange = (date: Date | null) => {
    if (date) {
      const timeString = date.toTimeString().slice(0, 5); // Get HH:MM format
      setFormData(prev => ({ ...prev, reportTime: timeString }));
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.bidWalletAllowancePer ||
      !formData.readyStockAllowancePer ||
      !formData.reportTime ||
      !formData.timezone ||
      !formData.percentage // ✅ validation added
    ) {
      toastHelper.error("Please fill in all required fields");
      return;
    }

    try {
      // Clean readyStockOrderProcess to remove any _id fields that backend doesn't expect
      const cleanedProcess = readyStockOrderProcess.map(step => ({
        name: step.name,
        order: step.order
      }));

      const settingsData = {
        id: initialData?._id,
        bidWalletAllowancePer:
          parseFloat(formData.bidWalletAllowancePer) || null,
        readyStockAllowancePer:
          parseFloat(formData.readyStockAllowancePer) || null,
        readyStockOrderProcess: cleanedProcess,
        reportTime: formData.reportTime,
        timezone: formData.timezone,
        percentage: parseFloat(formData.percentage) || null, // ✅ send to backend
      };

      const response =
        mode === "create"
          ? await UserProfileService.createSettings(settingsData)
          : await UserProfileService.updateSettings(settingsData);

      if (response.status === 200) {
        onSave(); // refresh
        onClose(); // close modal
      }
    } catch (error) {
      console.error(
        `Error ${mode === "create" ? "creating" : "updating"} settings:`,
        error
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#77797c30] bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
    
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
        {mode === "create" ? "Create Settings" : "Update Settings"}
      </h2>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-all duration-200"
        title="Close"
      >
        <i className="fas fa-times text-xl"></i>
      </button>
    </div>

    {/* Scrollable Content */}
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 gap-4">
        {/* ✅ New Wallet Percentage Field */}
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            <i className="fas fa-percent text-gray-500"></i> Wallet Percentage (%)
          </label>
          <input
            type="number"
            name="percentage"
            value={formData.percentage}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:text-white/90"
          />
        </div>

        {/* Existing Fields */}
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            <i className="fas fa-wallet text-gray-500"></i> Bid Wallet Allowance (%)
          </label>
          <input
            type="number"
            name="bidWalletAllowancePer"
            value={formData.bidWalletAllowancePer}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:text-white/90"
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
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:text-white/90"
          />
        </div>

        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            <i className="fas fa-list-ol text-gray-500"></i> Ready Stock Order Process
          </label>
          <div className="space-y-2">
            {readyStockOrderProcess.map((step, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Process Name"
                  value={step.name}
                  onChange={(e) => updateProcessStep(index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:text-white/90"
                />
                <input
                  type="text"
                  placeholder="Order"
                  value={step.order || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      updateProcessStep(index, 'order', parseInt(value) || 0);
                    }
                  }}
                  className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:text-white/90"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <button
                  type="button"
                  onClick={() => removeProcessStep(index)}
                  className="px-2 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  title="Remove Step"
                >
                  <i className="fas fa-trash text-sm"></i>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addProcessStep}
              className="w-full px-3 py-2 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Process Step
            </button>
          </div>
        </div>

         <div>
           <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
             <i className="fas fa-clock text-gray-500"></i> Report Time
           </label>
           <DatePicker
             selected={formData.reportTime ? new Date(`2024-01-01T${formData.reportTime}`) : null}
             onChange={handleTimeChange}
             showTimeSelect
             showTimeSelectOnly
             timeFormat="HH:mm"
             timeIntervals={15}
             dateFormat="HH:mm"
             placeholderText="Select time"
             popperPlacement="bottom-start"
             popperClassName="react-datepicker__dropdown"
             className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:text-white/90"
             wrapperClassName="w-full"
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
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:text-white/90"
          >
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <button
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        className="flex items-center justify-center gap-2 rounded-full bg-[#0071E3] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#005bb5] transition-colors"
      >
        <i className="fa-solid fa-pen-to-square"></i>
        {mode === "create" ? "Create" : "Update"}
      </button>
    </div>

  </div>
</div>
  );
}

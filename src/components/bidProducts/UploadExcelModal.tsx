import React, { ChangeEvent, useState } from "react";
import { BidProductService } from "../../services/bidProducts/bidProduct.services";
import toastHelper from "../../utils/toastHelper";

interface UploadExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (products: any[]) => void;
}

const UploadExcelModal: React.FC<UploadExcelModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await BidProductService.uploadExcelFile(formData);
      onSuccess(response.data.products);
    } catch (error) {
      console.error("Failed to upload file:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Excel File</h2>
        <input type="file" onChange={handleFileChange} className="mb-4" />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadExcelModal;
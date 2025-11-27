import React, { useState, useRef, useEffect } from "react";
import { ProductService } from "../../services/product/product.services";
import { CostModuleService } from "../../services/costModule/costModule.services";
import toastHelper from "../../utils/toastHelper";

interface UploadExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

interface CostCharge {
  _id: string;
  name: string;
  costType: 'Percentage' | 'Fixed';
  costField: string;
  value: number;
  minValue?: number;
  maxValue?: number;
  remark: string;
}

interface CostsByCountry {
  [country: string]: CostCharge[];
}

const UploadExcelModal: React.FC<UploadExcelModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [step, setStep] = useState<'upload' | 'selectCharges'>('upload');
  const [parsedData, setParsedData] = useState<any>(null);
  const [costsByCountry, setCostsByCountry] = useState<CostsByCountry>({});
  const [selectedCharges, setSelectedCharges] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch costs by country when modal opens
  useEffect(() => {
    if (isOpen && step === 'selectCharges') {
      fetchCostsByCountry();
    }
  }, [isOpen, step]);

  const fetchCostsByCountry = async () => {
    try {
      const response = await CostModuleService.getCostsByCountry();
      if (response.status === 200 && response.data) {
        setCostsByCountry(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch costs:", error);
    }
  };

  const handleDownloadSample = async () => {
    try {
      await ProductService.downloadSample();
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    const name = droppedFile.name?.toLowerCase() || "";
    const type = droppedFile.type || "";
    const isExcelMime =
      type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      type === "application/vnd.ms-excel" ||
      type === "application/octet-stream";
    const hasExcelExtension = name.endsWith(".xlsx") || name.endsWith(".xls");
    if (isExcelMime || hasExcelExtension) {
      setFile(droppedFile);
    } else {
      toastHelper.showTost("Please upload an Excel file (.xlsx or .xls)", "error");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const name = selectedFile.name?.toLowerCase() || "";
    const type = selectedFile.type || "";
    const isExcelMime =
      type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      type === "application/vnd.ms-excel" ||
      type === "application/octet-stream";
    const hasExcelExtension = name.endsWith(".xlsx") || name.endsWith(".xls");
    if (isExcelMime || hasExcelExtension) {
      setFile(selectedFile);
    } else {
      toastHelper.showTost("Please upload an Excel file (.xlsx or .xls)", "error");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadBoxClick = () => {
    if (!file && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleParseExcel = async () => {
    if (!file) {
      toastHelper.showTost("Please select a file to upload", "error");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await ProductService.parseExcelFile(formData);
      if (response.data) {
        setParsedData(response.data);
        setStep('selectCharges');
        // Initialize selected charges for each country
        const initialCharges: Record<string, string[]> = {};
        response.data.countriesInFile?.forEach((country: string) => {
          initialCharges[country] = [];
        });
        setSelectedCharges(initialCharges);
      }
    } catch (error) {
      console.error("Failed to parse file:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChargeToggle = (country: string, chargeId: string) => {
    setSelectedCharges(prev => {
      const countryCharges = prev[country] || [];
      const isSelected = countryCharges.includes(chargeId);
      return {
        ...prev,
        [country]: isSelected
          ? countryCharges.filter(id => id !== chargeId)
          : [...countryCharges, chargeId],
      };
    });
  };

  const handleImport = async () => {
    if (!parsedData?.filePath) {
      toastHelper.showTost("No file path found", "error");
      return;
    }
    setLoading(true);
    try {
      await ProductService.importProductsWithCharges(parsedData.filePath, selectedCharges);
      setFile(null);
      setParsedData(null);
      setSelectedCharges({});
      setStep('upload');
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error("Failed to import:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('upload');
    setParsedData(null);
    setSelectedCharges({});
  };

  const handleClose = () => {
    setFile(null);
    setParsedData(null);
    setSelectedCharges({});
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        {/* Close Icon */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform duration-200 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'upload' ? (
          <>
            {/* Sample Excel Download */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Upload Excel File</h2>
              <button
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                title="Download Sample Excel"
              >
                <i className="fas fa-download text-sm"></i>
                <span>Sample Excel</span>
              </button>
            </div>

            {/* Drag and Drop Area */}
            <div
              className={`w-full p-6 bg-gray-50 dark:bg-gray-800 border-2 border-dashed rounded-lg text-center ${
                isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/50" : "border-gray-300 dark:border-gray-600"
              } transition-colors duration-200 cursor-pointer`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleUploadBoxClick}
            >
              <input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileInputChange}
                className="hidden"
                ref={fileInputRef}
              />
              {file ? (
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-800 dark:text-gray-200 truncate max-w-[70%]">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>
              ) : (
                <div>
                  <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 dark:text-gray-500 mb-2"></i>
                  <p className="text-gray-600 dark:text-gray-400">Click or drag and drop your Excel file here</p>
                  <p className="text-sm text-gray-500 dark:text-gray-600 mt-1">Only .xlsx files are supported</p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParseExcel}
                className="px-6 py-2.5 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!file || loading}
              >
                {loading ? "Parsing..." : "Next: Select Charges"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Select Charges to Apply</h2>
            
            {parsedData?.countriesInFile && parsedData.countriesInFile.length > 0 ? (
              <div className="space-y-6">
                {parsedData.countriesInFile.map((country: string) => (
                  <div key={country} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{country}</h3>
                    {costsByCountry[country] && costsByCountry[country].length > 0 ? (
                      <div className="space-y-2">
                        {costsByCountry[country].map((charge: CostCharge) => (
                          <label
                            key={charge._id}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCharges[country]?.includes(charge._id) || false}
                              onChange={() => handleChargeToggle(country, charge._id)}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 dark:text-gray-200">{charge.name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {charge.costType}: {charge.value} {charge.costType === 'Percentage' ? '%' : ''}
                                {charge.remark && ` - ${charge.remark}`}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No charges available for this country</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No countries found in the Excel file</p>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="px-6 py-2.5 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Importing..." : "Import Products"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadExcelModal;

import React, { useState, useEffect, useRef } from "react";
import toastHelper from "../../utils/toastHelper";
import { SkuFamily } from "./types";

interface ValidationErrors {
  id?: string;
  skuFamilyCode?: string;
  name?: string;
  code?: string;
  description?: string;
  colorVariant?: string;
  country?: string;
  simType?: string;
  networkBands?: string;
  sequence?: string;
}

interface TouchedFields {
  id: boolean;
  skuFamilyCode: boolean;
  name: boolean;
  code: boolean;
  description: boolean;
  colorVariant: boolean;
  country: boolean;
  simType: boolean;
  networkBands: boolean;
  sequence: boolean;
}

interface SubRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  editItem?: SkuFamily;
  viewMode?: boolean;
}

const SubRowModal: React.FC<SubRowModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
  viewMode = false,
}) => {
  const [formData, setFormData] = useState({
    id: "",
    skuFamilyCode: "",
    name: "",
    code: "",
    description: "",
    colorVariant: "",
    country: "",
    simType: "",
    networkBands: "",
    sequence: 1 as number | undefined,
  });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string>("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touched, setTouched] = useState<TouchedFields>({
    id: false,
    skuFamilyCode: false,
    name: false,
    code: false,
    description: false,
    colorVariant: false,
    country: false,
    simType: false,
    networkBands: false,
    sequence: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to clean and flatten array data
  const cleanArrayData = (data: any): string => {
    if (!data) return "";
    
    // If it's already a clean string, return it
    if (typeof data === 'string' && !data.startsWith('[')) {
      return data;
    }
    
    // If it's an array, join it
    if (Array.isArray(data)) {
      return data.join(", ");
    }
    
    // If it's a stringified array, try to parse and clean it
    if (typeof data === 'string' && data.startsWith('[')) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Recursively clean nested arrays
          const flattenArray = (arr: any[]): string[] => {
            return arr.reduce((flat: string[], item: any) => {
              if (Array.isArray(item)) {
                return flat.concat(flattenArray(item));
              }
              if (typeof item === 'string' && item.startsWith('[')) {
                try {
                  const nested = JSON.parse(item);
                  return flat.concat(flattenArray(Array.isArray(nested) ? nested : [nested]));
                } catch {
                  return flat.concat(item);
                }
              }
              return flat.concat(String(item));
            }, []);
          };
          
          const cleaned = flattenArray(parsed).filter(item => item && item.trim() !== '');
          return cleaned.join(", ");
        }
      } catch {
        return data;
      }
    }
    
    return String(data);
  };

  const colorOptions = ["Graphite", "Silver", "Gold", "Sierra Blue", "Mixed"];
  const countryOptions = ["Hongkong", "Dubai", "Singapore"];
  const simOptions = ["E-Sim", "Physical Sim"];
  const networkOptions = ["TMobile", "AT&T"];
  const MAX_IMAGES = 5;
  const placeholderImage =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmyTPv4M5fFPvYLrMzMQcPD_VO34ByNjouQ&s";

  // Move base URL to the top level so it's available everywhere
  const base = (import.meta as any).env?.VITE_BASE_URL || "";

  const getImageUrl = (path: string): string => {
    if (!path) return placeholderImage;
    const isAbsolute = /^https?:\/\//i.test(path);
    return isAbsolute
      ? path
      : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  useEffect(() => {
    console.log("useEffect triggered - isOpen:", isOpen, "editItem:", editItem);

    if (isOpen) {
      // Always reset states first
      setNewImages([]);
      setImageError("");
      setFormErrors({});
      setApiError("");

      if (editItem) {
        console.log("Edit item received:", editItem); // Debug log
        console.log("Edit item images:", editItem.images); // Debug log

        // Get SKU Family code from editItem if available (it might be populated)
        const skuFamilyCode = (editItem as any).skuFamilyId?.code || (editItem as any).skuFamilyCode || "";

        setFormData({
          id: (editItem as any).id || "",
          skuFamilyCode: skuFamilyCode,
          name: editItem.name || "",
          code: editItem.code || "",
          description: editItem.description || "",
          colorVariant: cleanArrayData(editItem.colorVariant),
          country: cleanArrayData(editItem.country), // Country is not an array
          simType: cleanArrayData(editItem.simType),
          networkBands: cleanArrayData(editItem.networkBands),
          sequence: (editItem as any).sequence ?? 1,
        });

        // Handle existing images properly - ensure it's always an array
        const images = editItem.images || [];
        console.log("Setting existing images:", images); // Debug log
        const imageArray = Array.isArray(images)
          ? images.filter((img) => img && img.trim() !== "")
          : [];
        console.log("Filtered existing images:", imageArray); // Debug log
        setExistingImages(imageArray);
      } else {
        setFormData({
          id: "",
          skuFamilyCode: "",
          name: "",
          code: "",
          description: "",
          colorVariant: "",
          country: "",
          simType: "",
          networkBands: "",
          sequence: 1,
        });
        setExistingImages([]);
      }
    } else {
      // Clean up when modal closes
      setFormData({
        id: "",
        skuFamilyCode: "",
        name: "",
        code: "",
        description: "",
        colorVariant: "",
        country: "",
        simType: "",
        networkBands: "",
        sequence: 1,
      });
      setExistingImages([]);
      setNewImages([]);
      setImageError("");
      setFormErrors({});
      setApiError("");
    }
  }, [isOpen, editItem]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
    console.log(formErrors);

    // Validate the field if it's been touched
    if (touched[name as keyof TouchedFields]) {
      const error = validateField(name as keyof typeof formData, value);
      setValidationErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, colorVariant: e.target.value }));
    setFormErrors((prev) => ({ ...prev, colorVariant: "" }));

    // Validate the field if it's been touched
    if (touched.colorVariant) {
      const error = validateField("colorVariant", e.target.value);
      setValidationErrors((prev) => ({ ...prev, colorVariant: error }));
    }
  };

  const handleSimTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, simType: value }));
    setFormErrors((prev) => ({ ...prev, simType: "" }));

    // Validate the field if it's been touched
    if (touched.simType) {
      const error = validateField("simType", value);
      setValidationErrors((prev) => ({ ...prev, simType: error }));
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, country: e.target.value }));
    setFormErrors((prev) => ({ ...prev, country: "" }));

    // Validate the field if it's been touched
    if (touched.country) {
      const error = validateField("country", e.target.value);
      setValidationErrors((prev) => ({ ...prev, country: error }));
    }
  };

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, networkBands: e.target.value }));
    setFormErrors((prev) => ({ ...prev, networkBands: "" }));

    // Validate the field if it's been touched
    if (touched.networkBands) {
      const error = validateField("networkBands", e.target.value);
      setValidationErrors((prev) => ({ ...prev, networkBands: error }));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > MAX_IMAGES) {
      setImageError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    if (files.length > 0) {
      setImageError("");
      setNewImages((prev) => [...prev, ...files]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > MAX_IMAGES) {
      setImageError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    setImageError("");
    setNewImages((prev) => [...prev, ...files]);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveExisting = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    setImageError("");
  };

  const handleRemoveNew = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setImageError("");
  };

  const validateField = (
    name: keyof typeof formData,
    value: any
  ): string | undefined => {
    switch (name) {
      case "skuFamilyCode":
        return !value || value.trim() === "" ? "SKU Family Code is required" : undefined;
      case "name":
        return !value || value.trim() === "" ? "Name is required" : undefined;
      case "code":
        return !value || value.trim() === "" ? "Code is required" : undefined;
      case "description":
        return !value || value.trim() === ""
          ? "Description is required"
          : undefined;
      case "colorVariant":
        return !value ? "Color Variant is required" : undefined;
      case "country":
        return !value ? "Country is required" : undefined;
      case "simType":
        return !value || value.trim() === ""
          ? "SIM Type is required"
          : undefined;
      case "networkBands":
        return !value ? "Network Bands is required" : undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Only validate required fields
    const requiredFields: (keyof typeof formData)[] = [
      "skuFamilyCode",
      "name",
      "code",
      "description",
      "colorVariant",
      "country",
      "simType",
      "networkBands",
    ];

    requiredFields.forEach((fieldName) => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(
      name as keyof typeof formData,
      formData[name as keyof typeof formData]
    );
    setValidationErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      id: true,
      skuFamilyCode: true,
      name: true,
      code: true,
      description: true,
      colorVariant: true,
      country: true,
      simType: true,
      networkBands: true,
      sequence: true,
    });

    const isValid = validateForm();
    if (!isValid) {
      setApiError("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setApiError("");

    try {
      const formDataToSend = new FormData();
      if (formData.id) {
        formDataToSend.append("id", formData.id.trim());
      }
      formDataToSend.append("skuFamilyCode", formData.skuFamilyCode.trim());
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("code", formData.code.trim());
      formDataToSend.append("description", formData.description.trim());
      // Handle array fields - convert comma-separated strings to arrays
      const colorVariantArray = formData.colorVariant ? formData.colorVariant.split(',').map(item => item.trim()).filter(item => item) : [];
      const simTypeArray = formData.simType ? formData.simType.split(',').map(item => item.trim()).filter(item => item) : [];
      const networkBandsArray = formData.networkBands ? formData.networkBands.split(',').map(item => item.trim()).filter(item => item) : [];
      
      formDataToSend.append("colorVariant", JSON.stringify(colorVariantArray));
      formDataToSend.append("country", formData.country); // Country is not an array
      formDataToSend.append("simType", JSON.stringify(simTypeArray));
      formDataToSend.append("networkBands", JSON.stringify(networkBandsArray));
      formDataToSend.append("sequence", formData.sequence?.toString() || "1");
      
      newImages.forEach((image) => {
        formDataToSend.append("images", image);
      });
      if (existingImages.length > 0) {
        formDataToSend.append("keptImages", JSON.stringify(existingImages));
      }

      // Let the parent component handle the API call
      await onSave(formDataToSend);
      onClose();
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Failed to save sub-row";
      setApiError(errorMessage);
      toastHelper.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = viewMode ? "View Sub-Row" : editItem ? "Edit Sub-Row" : "Add Sub-Row";

  console.log("Rendering sub-row modal with existing images:", existingImages); // Debug log

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-[800px] max-h-[80vh] transform transition-all duration-300 scale-100 flex flex-col">
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />

        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 p-6 pb-4 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform duration-200 hover:scale-110"
              disabled={isLoading}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="sub-row-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* SKU Family Code */}
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                SKU Family Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="skuFamilyCode"
                value={formData.skuFamilyCode}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                  touched.skuFamilyCode && validationErrors.skuFamilyCode
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-700"
                }`}
                placeholder="Enter SKU Family Code"
                required
                disabled={isLoading || viewMode}
              />
              {touched.skuFamilyCode && validationErrors.skuFamilyCode && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {validationErrors.skuFamilyCode}
                </p>
              )}
            </div>

            {/* ID, Name, Code Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  ID
                </label>
                <input
                  type="text"
                  name="id"
                  value={formData.id || ''}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                    touched.id && validationErrors.id
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  placeholder="Enter ID (optional)"
                  disabled={isLoading || viewMode}
                />
                {touched.id && validationErrors.id && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.id}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                    touched.name && validationErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  placeholder="Enter Name"
                  required
                  disabled={isLoading || viewMode}
                />
                {touched.name && validationErrors.name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Code
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                    touched.code && validationErrors.code
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  placeholder="Enter Code"
                  required
                  disabled={isLoading || viewMode}
                />
                {touched.code && validationErrors.code && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.code}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Sequence
                </label>
                <input
                  type="number"
                  name="sequence"
                  value={formData.sequence || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, sequence: value === '' ? undefined : parseInt(value) || 1 });
                  }}
                  min="1"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                  placeholder="Enter sequence number (optional)"
                  disabled={viewMode}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Lower numbers appear first in lists
                </p>
              </div>
            </div>
            {/* Description, Color Variant, and Country Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  rows={5}
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm h-[42px] ${
                    touched.description && validationErrors.description
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  } resize-y`}
                  placeholder="Enter Description"
                  required
                  disabled={isLoading || viewMode}
                />
                {touched.description && validationErrors.description && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.description}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Color Variant
                </label>
                <div className="relative">
                  <select
                    name="colorVariant"
                    value={formData.colorVariant}
                    onChange={handleColorChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.colorVariant && validationErrors.colorVariant
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                    disabled={isLoading || viewMode}
                  >
                    <option value="" disabled>
                      Select Color Variant
                    </option>
                    {colorOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.colorVariant && validationErrors.colorVariant && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.colorVariant}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Country
                </label>
                <div className="relative">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleCountryChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.country && validationErrors.country
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                    disabled={isLoading || viewMode}
                  >
                    <option value="" disabled>
                      Select Country
                    </option>
                    {countryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.country && validationErrors.country && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.country}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Images
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                className={`w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition duration-200 flex flex-col items-center justify-center ${
                  isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : ""
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={isLoading || viewMode}
                />
                {existingImages.length + newImages.length > 0 ? (
                  <div className="flex flex-wrap gap-3 justify-start">
                    {existingImages.map((url, index) => (
                      <div
                        key={`existing-${index}`}
                        className="relative w-20 h-20"
                      >
                        <img
                          src={getImageUrl(url)}
                          alt={`Existing ${index}`}
                          className="w-full h-full object-cover rounded-md border border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            console.log("Image load error for URL:", url); // Debug log
                            (e.currentTarget as HTMLImageElement).src =
                              placeholderImage;
                          }}
                        />
                        {!viewMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveExisting(index);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-600 transition-colors shadow-md"
                            disabled={isLoading}
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    {newImages.map((image, index) => (
                      <div key={`new-${index}`} className="relative w-20 h-20">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Uploaded ${index}`}
                          className="w-full h-full object-cover rounded-md border border-gray-200 dark:border-gray-600"
                        />
                        {!viewMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveNew(index);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-600 transition-colors shadow-md"
                            disabled={isLoading}
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : !viewMode ? (
                  <>
                    <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Drag & drop images here or click to browse
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      Supports JPG, PNG, GIF (max {MAX_IMAGES} images)
                    </p>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-image text-4xl mb-2"></i>
                    <p>No images available</p>
                  </div>
                )}
              </div>
              {imageError && (
                <p className="text-red-500 text-sm mt-2">{imageError}</p>
              )}
            </div>
            {/* SIM Type and Network Bands Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  SIM Type
                </label>
                <div className="relative">
                  <select
                    name="simType"
                    value={formData.simType}
                    onChange={handleSimTypeChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.simType && validationErrors.simType
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                    disabled={isLoading || viewMode}
                  >
                    <option value="" disabled>
                      Select SIM Type
                    </option>
                    {simOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.simType && validationErrors.simType && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.simType}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Network Bands
                </label>
                <div className="relative">
                  <select
                    value={formData.networkBands}
                    onChange={handleNetworkChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.networkBands && validationErrors.networkBands
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                    disabled={isLoading || viewMode}
                  >
                    <option value="" disabled>
                      Select Network Band
                    </option>
                    {networkOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.networkBands && validationErrors.networkBands && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.networkBands}
                  </p>
                )}
              </div>
            </div>
            {apiError && (
              <p className="text-red-500 text-sm mt-2">{apiError}</p>
            )}
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-6 pt-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 text-sm"
              disabled={isLoading}
            >
              {viewMode ? "Close" : "Cancel"}
            </button>
            {!viewMode && (
              <button
                type="submit"
                form="sub-row-form"
                className="min-w-[160px] px-4 py-2 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 transition duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Add Sub-Row"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubRowModal;

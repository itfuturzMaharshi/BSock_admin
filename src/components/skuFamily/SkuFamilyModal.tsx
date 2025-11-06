import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import toastHelper from "../../utils/toastHelper";
import { SkuFamily } from "./types";

interface ValidationErrors {
  name?: string;
  code?: string;
  brand?: string;
  description?: string;
  colorVariant?: string;
  country?: string;
  simType?: string;
  networkBands?: string;
}

interface TouchedFields {
  name: boolean;
  code: boolean;
  brand: boolean;
  description: boolean;
  colorVariant: boolean;
  country: boolean;
  simType: boolean;
  networkBands: boolean;
}

interface SkuFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  editItem?: SkuFamily;
}

const SkuFamilyModal: React.FC<SkuFamilyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    brand: "",
    description: "",
    colorVariant: [] as string[],
    country: [] as string[],
    simType: [] as string[],
    networkBands: [] as string[],
  });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  // const [isDragging, setIsDragging] = useState<boolean>(false);
  // const [imageError, setImageError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touched, setTouched] = useState<TouchedFields>({
    name: false,
    code: false,
    brand: false,
    description: false,
    colorVariant: false,
    country: false,
    simType: false,
    networkBands: false,
  });
  // const fileInputRef = useRef<HTMLInputElement>(null);

  const colorOptions = ["Graphite", "Silver", "Gold", "Sierra Blue", "Mixed"];
  const countryOptions = ["Hongkong", "Dubai", "Singapore"];
  const simOptions = ["E-Sim", "Physical Sim"];
  const networkOptions = ["TMobile", "AT&T"];
  // const MAX_IMAGES = 5;
  // const placeholderImage =
  //   "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmyTPv4M5fFPvYLrMzMQcPD_VO34ByNjouQ&s";

  // Move base URL to the top level so it's available everywhere
  // const base = (import.meta as any).env?.VITE_BASE_URL || "";

  // const getImageUrl = (path: string): string => {
  //   if (!path) return placeholderImage;
  //   const isAbsolute = /^https?:\/\//i.test(path);
  //   return isAbsolute
  //     ? path
  //     : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  // };

  useEffect(() => {
    const parseMultiValue = (value: string | string[] | undefined): string[] => {
      if (Array.isArray(value)) {
        // Handle array of comma-separated strings (like your API response)
        const result: string[] = [];
        value.forEach(item => {
          if (typeof item === 'string' && item.trim()) {
            // Split by comma and add individual items
            const splitItems = item.split(',').map(i => i.trim()).filter(Boolean);
            result.push(...splitItems);
          }
        });
        return result;
      }
      if (typeof value === 'string' && value.trim()) {
        // Handle both comma-separated strings and JSON arrays
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              return parsed.map(item => String(item).trim()).filter(Boolean);
            }
          } catch (e) {
            // If JSON parsing fails, fall back to comma splitting
          }
        }
        return value.split(',').map(item => item.trim()).filter(Boolean);
      }
      return [];
    };

    const resetStates = () => {
      setNewImages([]);
      // setImageError("");
      setApiError("");
      setValidationErrors({});
      setTouched({
        name: false,
        code: false,
        brand: false,
        description: false,
        colorVariant: false,
        country: false,
        simType: false,
        networkBands: false,
      });
    };

    if (!isOpen) {
      // Clean up when modal closes
      setFormData({
        name: "",
        code: "",
        brand: "",
        description: "",
        colorVariant: [],
        country: [],
        simType: [],
        networkBands: [],
      });
      setExistingImages([]);
      setNewImages([]);
      resetStates();
      return;
    }

    resetStates();

    if (editItem) {
      // Process edit data
      const colorVariant = parseMultiValue(editItem.colorVariant);
      const country = parseMultiValue(editItem.country);
      const simType = parseMultiValue(editItem.simType);
      const networkBands = parseMultiValue(editItem.networkBands);

      console.log('Setting edit form data:', {
        originalData: {
          colorVariant: editItem.colorVariant,
          country: editItem.country,
          simType: editItem.simType,
          networkBands: editItem.networkBands
        },
        parsedData: {
          colorVariant,
          country,
          simType,
          networkBands
        },
        dataTypes: {
          colorVariant: typeof editItem.colorVariant,
          country: typeof editItem.country,
          simType: typeof editItem.simType,
          networkBands: typeof editItem.networkBands
        }
      });

      // Set form data
      setFormData({
        name: editItem.name || "",
        code: editItem.code || "",
        brand: editItem.brand || "",
        description: editItem.description || "",
        colorVariant,
        country,
        simType,
        networkBands,
      });

      // Handle images
      if (editItem.images) {
        const imageArray = Array.isArray(editItem.images) 
          ? editItem.images.filter(img => img && String(img).trim() !== "")
          : [];
        setExistingImages(imageArray);
      }
    } else {
      // Reset for new item
      setFormData({
        name: "",
        code: "",
        brand: "",
        description: "",
        colorVariant: [],
        country: [],
        simType: [],
        networkBands: [],
      });
      setExistingImages([]);
    }
  }, [isOpen, editItem]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate the field if it's been touched
    if (touched[name as keyof TouchedFields]) {
      const error = validateField(name as keyof typeof formData, value);
      setValidationErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
  //   e.preventDefault();
  //   setIsDragging(true);
  // };

  // const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
  //   e.preventDefault();
  //   setIsDragging(false);
  // };

  // const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
  //   e.preventDefault();
  //   setIsDragging(false);
  //   const files = Array.from(e.dataTransfer.files).filter((file) =>
  //     file.type.startsWith("image/")
  //   );
  //   const totalImages = existingImages.length + newImages.length + files.length;
  //   if (totalImages > MAX_IMAGES) {
  //     setImageError(`Maximum ${MAX_IMAGES} images allowed`);
  //     return;
  //   }
  //   if (files.length > 0) {
  //     setImageError("");
  //     setNewImages((prev) => [...prev, ...files]);
  //   }
  // };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = e.target.files ? Array.from(e.target.files) : [];
  //   const totalImages = existingImages.length + newImages.length + files.length;
  //   if (totalImages > MAX_IMAGES) {
  //     setImageError(`Maximum ${MAX_IMAGES} images allowed`);
  //     return;
  //   }
  //   setImageError("");
  //   setNewImages((prev) => [...prev, ...files]);
  // };

  // const handleClick = () => {
  //   fileInputRef.current?.click();
  // };

  // const handleRemoveExisting = (index: number) => {
  //   setExistingImages((prev) => prev.filter((_, i) => i !== index));
  //   setImageError("");
  // };

  // const handleRemoveNew = (index: number) => {
  //   setNewImages((prev) => prev.filter((_, i) => i !== index));
  //   setImageError("");
  // };

  const validateField = (
    name: keyof typeof formData,
    value: any
  ): string | undefined => {
    switch (name) {
      case "name":
        return !value || value.trim() === "" ? "Name is required" : undefined;
      case "code":
        return !value || value.trim() === "" ? "Code is required" : undefined;
      case "brand":
        return !value || value.trim() === "" ? "Brand is required" : undefined;
      case "description":
        return !value || value.trim() === ""
          ? "Description is required"
          : undefined;
      case "colorVariant":
        return !value || (Array.isArray(value) && value.length === 0) ? "Color Variant is required" : undefined;
      case "country":
        return !value || (Array.isArray(value) && value.length === 0) ? "Country is required" : undefined;
      case "simType":
        return !value || (Array.isArray(value) && value.length === 0) ? "SIM Type is required" : undefined;
      case "networkBands":
        return !value || (Array.isArray(value) && value.length === 0) ? "Network Bands is required" : undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Only validate required fields
    const requiredFields: (keyof typeof formData)[] = [
      "name",
      "code",
      "brand",
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
      name: true,
      code: true,
      brand: true,
      description: true,
      colorVariant: true,
      country: true,
      simType: true,
      networkBands: true,
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
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("code", formData.code.trim());
      formDataToSend.append("brand", formData.brand.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("colorVariant", formData.colorVariant.join(", "));
      formDataToSend.append("country", formData.country.join(", "));
      formDataToSend.append("simType", formData.simType.join(", "));
      formDataToSend.append("networkBands", formData.networkBands.join(", "));
      newImages.forEach((image) => {
        formDataToSend.append("images", image);
      });
      if (editItem && existingImages.length > 0) {
        formDataToSend.append("keptImages", JSON.stringify(existingImages));
      }

      await onSave(formDataToSend);
      onClose();
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Failed to save SKU family";
      setApiError(errorMessage);
      toastHelper.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fixed Multi-select component
  const MultiSelectField = ({ 
    field, 
    label, 
    options
  }: { 
    field: keyof typeof formData; 
    label: string; 
    options: string[]; 
  }) => {
    const [customValue, setCustomValue] = useState("");

    // Get current values from formData - ensure it's always an array
    const currentValues = Array.isArray(formData[field]) 
      ? (formData[field] as string[])
      : [];
    
    // Debug logging for checkbox state
    console.log(`MultiSelectField ${field} current values:`, currentValues);
    
    const hasError = touched[field as keyof TouchedFields] && validationErrors[field];

    // Handle checkbox change with proper state update
    const handleCheckboxChange = (option: string) => {
      const isCurrentlySelected = currentValues.includes(option);
      
      const newValues = isCurrentlySelected
        ? currentValues.filter(item => item !== option)
        : [...currentValues, option];
      
      console.log(`Checkbox change for ${field}:`, {
        option,
        isCurrentlySelected,
        currentValues,
        newValues
      });
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        [field]: newValues
      }));

      // Mark field as touched
      setTouched(prev => ({
        ...prev,
        [field]: true
      }));

      // Clear validation error if values exist
      if (newValues.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: undefined
        }));
      }
    };

    // Handle custom value add
    const handleCustomAdd = () => {
      const trimmedValue = customValue.trim();
      if (trimmedValue && !currentValues.includes(trimmedValue)) {
        const newValues = [...currentValues, trimmedValue];
        
        setFormData(prev => ({
          ...prev,
          [field]: newValues
        }));
        
        setCustomValue("");
        
        // Mark field as touched and clear error
        setTouched(prev => ({
          ...prev,
          [field]: true
        }));
        
        if (newValues.length > 0) {
          setValidationErrors(prev => ({
            ...prev,
            [field]: undefined
          }));
        }
      }
    };

    // Handle value removal
    const handleRemove = (valueToRemove: string) => {
      const newValues = currentValues.filter(item => item !== valueToRemove);
      
      setFormData(prev => ({
        ...prev,
        [field]: newValues
      }));
      
      // Mark field as touched
      setTouched(prev => ({
        ...prev,
        [field]: true
      }));
    };

    // Handle Enter key in custom input
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCustomAdd();
      }
    };

    return (
      <div>
        <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
          {label}
        </label>
        <div className="space-y-2">
          {/* Options checkboxes */}
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              >
                <input
                  type="checkbox"
                  checked={currentValues.includes(option)}
                  onChange={() => handleCheckboxChange(option)}
                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
          
          {/* Custom value input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Add custom ${label.toLowerCase()}`}
              className="w-48 p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleCustomAdd}
              className="px-4 py-2.5 text-white text-sm rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0071E0' }}
              disabled={isLoading || !customValue.trim()}
            >
              <i className="fas fa-plus text-xs"></i>
            </button>
          </div>
          
          {/* Selected values display */}
          {currentValues.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {currentValues.map((value, index) => (
                <span
                  key={`${field}-${value}-${index}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded text-sm"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() => handleRemove(value)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-1"
                    disabled={isLoading}
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        {hasError && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {validationErrors[field]}
          </p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const title = editItem ? "Edit SKU Family" : "Create SKU Family";

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
            id="sku-family-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Name, Code, and Brand Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
                {touched.code && validationErrors.code && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.code}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                    touched.brand && validationErrors.brand
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  placeholder="Enter Brand"
                  required
                  disabled={isLoading}
                />
                {touched.brand && validationErrors.brand && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.brand}
                  </p>
                )}
              </div>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                onBlur={handleBlur}
                rows={3}
                className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                  touched.description && validationErrors.description
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-700"
                } resize-y`}
                placeholder="Enter Description"
                required
                disabled={isLoading}
              />
              {touched.description && validationErrors.description && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {validationErrors.description}
                </p>
              )}
            </div>

            {/* Color Variant Field */}
            <div>
              <MultiSelectField
                field="colorVariant"
                label="Color Variant"
                options={colorOptions}
              />
            </div>

            {/* Country Field */}
            <div>
              <MultiSelectField
                field="country"
                label="Country"
                options={countryOptions}
              />
            </div>

            {/* Images Field */}
            {/* <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Imagesss
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
                  disabled={isLoading}
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
                            (e.currentTarget as HTMLImageElement).src =
                              placeholderImage;
                          }}
                        />
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
                      </div>
                    ))}
                    {newImages.map((image, index) => (
                      <div key={`new-${index}`} className="relative w-20 h-20">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Uploaded ${index}`}
                          className="w-full h-full object-cover rounded-md border border-gray-200 dark:border-gray-600"
                        />
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Drag & drop images here or click to browse
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      Supports JPG, PNG, GIF (max {MAX_IMAGES} images)
                    </p>
                  </>
                )}
              </div>
              {imageError && (
                <p className="text-red-500 text-sm mt-2">{imageError}</p>
              )}
            </div> */}

            {/* SIM Type and Network Bands Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <MultiSelectField
                  field="simType"
                  label="SIM Type"
                  options={simOptions}
                />
              </div>
              <div>
                <MultiSelectField
                  field="networkBands"
                  label="Network Bands"
                  options={networkOptions}
                />
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
              Cancel
            </button>
            <button
              type="submit"
              form="sku-family-form"
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
              ) : editItem ? (
                "Update SKU Family"
              ) : (
                "Create SKU Family"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkuFamilyModal;
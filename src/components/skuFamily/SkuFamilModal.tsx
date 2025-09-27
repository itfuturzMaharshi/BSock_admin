// SkuFamilyModal.tsx
import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";

interface SkuFamily {
  _id?: string;
  name: string;
  code: string;
  brand: string;
  description: string;
  images: string[];
  colorVariant: string;
  country: string;
  simType: string;
  networkBands: string;
  countryVariant?: string;
  isApproved?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  approvedBy?: string | null;
  __v?: string;
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
    colorVariant: "",
    country: "",
    simType: [] as string[],
    networkBands: "",
  });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string>("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    return isAbsolute ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
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
        
        setFormData({
          name: editItem.name || "",
          code: editItem.code || "",
          brand: editItem.brand || "",
          description: editItem.description || "",
          colorVariant: editItem.colorVariant || "",
          country: editItem.country || "",
          simType: editItem.simType ? editItem.simType.split(", ") : [],
          networkBands: editItem.networkBands || "",
        });
        
        // Handle existing images properly - ensure it's always an array
        const images = editItem.images || [];
        console.log("Setting existing images:", images); // Debug log
        const imageArray = Array.isArray(images) ? images.filter(img => img && img.trim() !== "") : [];
        console.log("Filtered existing images:", imageArray); // Debug log
        setExistingImages(imageArray);
      } else {
        setFormData({
          name: "",
          code: "",
          brand: "",
          description: "",
          colorVariant: "",
          country: "",
          simType: [],
          networkBands: "",
        });
        setExistingImages([]);
      }
    } else {
      // Clean up when modal closes
      setFormData({
        name: "",
        code: "",
        brand: "",
        description: "",
        colorVariant: "",
        country: "",
        simType: [],
        networkBands: "",
      });
      setExistingImages([]);
      setNewImages([]);
      setImageError("");
      setFormErrors({});
      setApiError("");
    }
  }, [isOpen, editItem]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.code.trim()) errors.code = "Code is required";
    if (!formData.brand.trim()) errors.brand = "Brand is required";
    if (!formData.description.trim()) errors.description = "Description is required";
    if (!formData.colorVariant) errors.colorVariant = "Color Variant is required";
    if (!formData.country) errors.country = "Country is required";
    if (formData.simType.length === 0) errors.simType = "At least one SIM Type is required";
    if (!formData.networkBands) errors.networkBands = "Network Band is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, colorVariant: e.target.value }));
    setFormErrors((prev) => ({ ...prev, colorVariant: "" }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const simType = checked
        ? [...prev.simType, value]
        : prev.simType.filter((item) => item !== value);
      return { ...prev, simType };
    });
    setFormErrors((prev) => ({ ...prev, simType: "" }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, country: e.target.value }));
    setFormErrors((prev) => ({ ...prev, country: "" }));
  };

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, networkBands: e.target.value }));
    setFormErrors((prev) => ({ ...prev, networkBands: "" }));
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
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
      formDataToSend.append("colorVariant", formData.colorVariant);
      formDataToSend.append("country", formData.country);
      formDataToSend.append("simType", formData.simType.join(", "));
      formDataToSend.append("networkBands", formData.networkBands);
      newImages.forEach((image) => {
        formDataToSend.append("images", image);
      });
      if (editItem && existingImages.length > 0) {
        formDataToSend.append("keptImages", JSON.stringify(existingImages));
      }

      await onSave(formDataToSend);
      onClose();
    } catch (error) {
      const errorMessage = (error as Error).message || "Failed to save SKU family";
      setApiError(errorMessage);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = editItem ? "Edit SKU Family" : "Create SKU Family";

  console.log("Rendering modal with existing images:", existingImages); // Debug log

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform duration-200 hover:scale-110"
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
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
          {title}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full p-3 bg-gray-50 dark:bg-gray-800 border ${
                  formErrors.name ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200`}
                placeholder="Enter Name"
                required
                disabled={isLoading}
              />
              {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Code
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className={`w-full p-3 bg-gray-50 dark:bg-gray-800 border ${
                  formErrors.code ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200`}
                placeholder="Enter Code"
                required
                disabled={isLoading}
              />
              {formErrors.code && <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className={`w-full p-3 bg-gray-50 dark:bg-gray-800 border ${
                  formErrors.brand ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200`}
                placeholder="Enter Brand"
                required
                disabled={isLoading}
              />
              {formErrors.brand && <p className="text-red-500 text-sm mt-1">{formErrors.brand}</p>}
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full p-3 bg-gray-50 dark:bg-gray-800 border ${
                  formErrors.description ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200`}
                placeholder="Enter Description"
                required
                disabled={isLoading}
              />
              {formErrors.description && (
                <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
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
                isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
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
                    <div key={`existing-${index}`} className="relative w-20 h-20">
                      <img
                        src={getImageUrl(url)}
                        alt={`Existing ${index}`}
                        className="w-full h-full object-cover rounded-md border border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          console.log("Image load error for URL:", url); // Debug log
                          (e.currentTarget as HTMLImageElement).src = placeholderImage;
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
            {imageError && <p className="text-red-500 text-sm mt-2">{imageError}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Color Variant
              </label>
              <select
                value={formData.colorVariant}
                onChange={handleColorChange}
                className={`w-full p-3 bg-gray-50 dark:bg-gray-800 border ${
                  formErrors.colorVariant ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200`}
                required
                disabled={isLoading}
              >
                <option value="">Select Color</option>
                {colorOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {formErrors.colorVariant && (
                <p className="text-red-500 text-sm mt-1">{formErrors.colorVariant}</p>
              )}
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Country
              </label>
              <select
                value={formData.country}
                onChange={handleCountryChange}
                className={`w-full p-3 bg-gray-50 dark:bg-gray-800 border ${
                  formErrors.country ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200`}
                required
                disabled={isLoading}
              >
                <option value="">Select Country</option>
                {countryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {formErrors.country && <p className="text-red-500 text-sm mt-1">{formErrors.country}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                SIM Type
              </label>
              <div className="space-y-3">
                {simOptions.map((option) => (
                  <div key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      value={option}
                      checked={formData.simType.includes(option)}
                      onChange={handleCheckboxChange}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
                      disabled={isLoading}
                    />
                    <label className="ml-3 text-base font-medium text-gray-950 dark:text-gray-200">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
              {formErrors.simType && <p className="text-red-500 text-sm mt-1">{formErrors.simType}</p>}
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Network Bands
              </label>
              <select
                value={formData.networkBands}
                onChange={handleNetworkChange}
                className={`w-full p-3 bg-gray-50 dark:bg-gray-800 border ${
                  formErrors.networkBands ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200`}
                required
                disabled={isLoading}
              >
                <option value="">Select Network Band</option>
                {networkOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {formErrors.networkBands && (
                <p className="text-red-500 text-sm mt-1">{formErrors.networkBands}</p>
              )}
            </div>
          </div>
          {apiError && <p className="text-red-500 text-sm mt-2">{apiError}</p>}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 transform hover:scale-105"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 transition duration-200 transform hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : editItem ? "Update SKU Family" : "Create SKU Family"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SkuFamilyModal;
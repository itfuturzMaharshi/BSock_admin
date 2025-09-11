import React, { useState, useEffect, useRef } from "react";

// Define the interface for country variant
interface CountryVariant {
  country: string;
  simType: string;
  networkBands: string;
}

// Define the interface for SKU family data
interface SkuFamily {
  name: string;
  code: string;
  brand: string;
  description: string;
  images: string;
  colorVariant: string;
  countryVariant: CountryVariant;
}

// Define the interface for form data
interface FormData {
  name: string;
  code: string;
  brand: string;
  description: string;
  images: File[];
  colorVariant: string;
  countryVariant: {
    country: string;
    simType: string[];
    networkBands: string;
  };
}

interface SkuFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: SkuFamily) => void;
  editItem?: SkuFamily;
}

const SkuFamilyModal: React.FC<SkuFamilyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    code: "",
    brand: "",
    description: "",
    images: [],
    colorVariant: "",
    countryVariant: {
      country: "",
      simType: [],
      networkBands: "",
    },
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colorOptions = ["Graphite", "Silver", "Gold", "Sierra Blue", "Mixed"];
  const countryOptions = ["Hongkong", "Dubai", "Singapore"];
  const simOptions = ["E-Sim", "Physical Sim"];
  const networkOptions = ["TMobile", "AT&T"];
  const MAX_IMAGES = 5;

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setFormData({
          name: editItem.name,
          code: editItem.code,
          brand: editItem.brand,
          description: editItem.description,
          images: [],
          colorVariant: editItem.colorVariant,
          countryVariant: {
            country: editItem.countryVariant.country,
            simType: editItem.countryVariant.simType
              ? editItem.countryVariant.simType
                  .split(", ")
                  .filter((s) => s.trim() !== "")
              : [],
            networkBands: editItem.countryVariant.networkBands,
          },
        });
      } else {
        setFormData({
          name: "",
          code: "",
          brand: "",
          description: "",
          images: [],
          colorVariant: "",
          countryVariant: {
            country: "",
            simType: [],
            networkBands: "",
          },
        });
      }
      setImageError("");
    }
  }, [isOpen, editItem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, colorVariant: e.target.value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const simType = checked
        ? [...prev.countryVariant.simType, value]
        : prev.countryVariant.simType.filter((item) => item !== value);
      return {
        ...prev,
        countryVariant: { ...prev.countryVariant, simType },
      };
    });
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      countryVariant: { ...prev.countryVariant, country: e.target.value },
    }));
  };

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      countryVariant: { ...prev.countryVariant, networkBands: e.target.value },
    }));
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
    const totalImages = formData.images.length + files.length;
    if (totalImages > MAX_IMAGES) {
      setImageError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    if (files.length > 0) {
      setImageError("");
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...files],
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const totalImages = formData.images.length + files.length;
    if (totalImages > MAX_IMAGES) {
      setImageError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    setImageError("");
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    if (formData.images.length <= MAX_IMAGES) {
      setImageError("");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const imagesString =
      formData.images.length > 0
        ? formData.images.map((file) => URL.createObjectURL(file)).join(", ")
        : editItem
        ? editItem.images
        : "";
    const newItem: SkuFamily = {
      ...formData,
      images: imagesString,
      colorVariant: formData.colorVariant,
      countryVariant: {
        ...formData.countryVariant,
        simType: formData.countryVariant.simType.join(", "),
        networkBands: formData.countryVariant.networkBands,
      },
    };
    onSave(newItem);
    onClose();
  };

  if (!isOpen) return null;

  const title = editItem ? "Edit SKU Family" : "Create SKU Family";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        {/* Font Awesome CDN */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        {/* Close Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform duration-200 hover:scale-110"
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
          {/* Name and Code Row */}
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
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Name"
                required
              />
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
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Code"
                required
              />
            </div>
          </div>

          {/* Brand and Description Row */}
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
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Brand"
                required
              />
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
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Description"
                required
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
              Images
            </label>
            {editItem && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Current images: {editItem.images || "None"}
              </p>
            )}
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
              />
              {formData.images.length > 0 ? (
                <div className="flex flex-wrap gap-3 justify-start">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative w-20 h-20">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Uploaded ${index}`}
                        className="w-full h-full object-cover rounded-md border border-gray-200 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-600 transition-colors shadow-md"
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
          </div>

          {/* Color Variant and Country Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Color Variant
              </label>
              <select
                value={formData.colorVariant}
                onChange={handleColorChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
              >
                <option value="">Select Color</option>
                {colorOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Country
              </label>
              <select
                value={formData.countryVariant.country}
                onChange={handleCountryChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
              >
                <option value="">Select Country</option>
                {countryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SIM Type and Network Bands Row */}
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
                      checked={formData.countryVariant.simType.includes(option)}
                      onChange={handleCheckboxChange}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
                    />
                    <label className="ml-3 text-base font-medium text-gray-950 dark:text-gray-200">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Network Bands
              </label>
              <select
                value={formData.countryVariant.networkBands}
                onChange={handleNetworkChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
              >
                <option value="">Select Network Band</option>
                {networkOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 transition duration-200 transform hover:scale-105"
            >
              {editItem ? "Update SKU Family" : "Create SKU Family"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SkuFamilyModal;
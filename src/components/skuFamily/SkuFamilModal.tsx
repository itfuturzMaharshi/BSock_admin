import React, { useState, useEffect } from "react";

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
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string>("");

  const colorOptions = ["Graphite", "Silver", "Gold", "Sierra Blue", "Mixed"];
  const countryOptions = ["Hongkong", "Dubai", "Singapore"];
  const simOptions = ["eSim", "physical sim"];
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
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

  const title = editItem ? "Edit SKU Family" : "Add SKU Family";
  const buttonText = editItem ? "Update" : "Add";

  return (
    <div className="fixed inset-0 scrollbar-width flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-y-auto relative">
        {/* Font Awesome CDN */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        {/* Close Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          {title}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name and Code Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>
          </div>

          {/* Brand and Description Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Images
            </label>
            {editItem && (
              <p className="text-sm text-gray-500 mb-2">
                Current images: {editItem.images || "None"}
              </p>
            )}
            <div
              className={`w-full p-3 border-2 border-dashed rounded-lg transition-all min-h-[124px] flex flex-col items-center justify-center ${
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center cursor-pointer text-gray-600 dark:text-gray-300 text-center"
              >
                <i className="fas fa-cloud-upload-alt text-3xl mb-2"></i>
                <span className="text-sm">
                  Drag and drop <br /> images here or click to upload
                </span>
              </label>
              {/* Display uploaded images inside the upload box */}
              <div className="mt-2 flex flex-wrap gap-3 justify-start">
                {formData.images.length > 0 &&
                  formData.images.map((image, index) => (
                    <div key={index} className="relative w-20 h-20">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Uploaded ${index}`}
                        className="w-full h-full object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
            {/* Error message */}
            {imageError && (
              <p className="text-red-500 text-sm mt-2">{imageError}</p>
            )}
          </div>

          {/* Color Variant and Country Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color Variant
              </label>
              <select
                value={formData.colorVariant}
                onChange={handleColorChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country
              </label>
              <select
                value={formData.countryVariant.country}
                onChange={handleCountryChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SIM Type
              </label>
              <div className="space-y-2">
                {simOptions.map((option) => (
                  <div key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      value={option}
                      checked={formData.countryVariant.simType.includes(option)}
                      onChange={handleCheckboxChange}
                      className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {option}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Network Bands
              </label>
              <select
                value={formData.countryVariant.networkBands}
                onChange={handleNetworkChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0071E0] text-white rounded-lg hover:bg-blue-700 transition"
            >
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SkuFamilyModal;
import React, { useState, useEffect } from "react";
import { ProductService } from "../../services/product/product.services";

// Define the interface for Product data
interface Product {
  _id?: string;
  skuFamilyId: any; // Can be string or object with _id and name
  simType: string;
  color: string;
  ram: string;
  storage: string;
  condition: string;
  price: number | string;
  stock: number | string;
  country: string;
  moq: number | string;
  isNegotiable: boolean;
}

// Also update the FormData interface to match:
interface FormData {
  skuFamilyId: string;
  simType: string;
  color: string;
  ram: string;
  storage: string;
  condition: string;
  price: number | string;
  stock: number | string;
  country: string;
  moq: number | string;
  isNegotiable: boolean;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: FormData) => void;
  editItem?: Product;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
}) => {
  const [formData, setFormData] = useState<FormData>({
    skuFamilyId: "",
    simType: "",
    color: "",
    ram: "",
    storage: "",
    condition: "",
    price: 0,
    stock: 0,
    country: "",
    moq: 0,
    isNegotiable: false,
  });
  const [skuFamilies, setSkuFamilies] = useState<{ _id: string; name: string }[]>([]);
  const [skuLoading, setSkuLoading] = useState<boolean>(false);
  const [skuError, setSkuError] = useState<string | null>(null);

  const colorOptions = ["Graphite", "Silver", "Gold", "Sierra Blue", "Mixed"];
  const countryOptions = ["Hongkong", "Dubai", "Singapore"];
  const simOptions = ["E-Sim", "Physical Sim"];
  const ramOptions = ["4GB", "6GB", "8GB", "16GB", "32GB"];
  const storageOptions = ["128GB", "256GB", "512GB", "1TB"];
  const conditionOptions = ["AAA", "A+", "Mixed"];

  useEffect(() => {
    if (isOpen) {
      const fetchSkuFamilies = async () => {
        try {
          setSkuLoading(true);
          setSkuError(null);
          const list = await ProductService.getSkuFamilyListByName();
          setSkuFamilies(list);
        } catch (error: any) {
          setSkuError(error.message || "Failed to load SKU Families");
        } finally {
          setSkuLoading(false);
        }
      };
      fetchSkuFamilies();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        const skuId = typeof editItem.skuFamilyId === 'object'
          ? (editItem.skuFamilyId._id || '')
          : (editItem.skuFamilyId || '');
        setFormData({
          skuFamilyId: skuId,
          simType: editItem.simType,
          color: editItem.color,
          ram: editItem.ram,
          storage: editItem.storage,
          condition: editItem.condition,
          price: editItem.price,
          stock: editItem.stock,
          country: editItem.country,
          moq: editItem.moq,
          isNegotiable: editItem.isNegotiable,
        });
      } else {
        setFormData({
          skuFamilyId: "",
          simType: "",
          color: "",
          ram: "",
          storage: "",
          condition: "",
          price: 0,
          stock: 0,
          country: "",
          moq: 0,
          isNegotiable: false,
        });
      }
    }
  }, [isOpen, editItem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.skuFamilyId && skuFamilies.length > 0) {
      alert("Please select a SKU Family");
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  const title = editItem ? "Edit Product" : "Create Product";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[88vh] overflow-y-auto transform transition-all duration-300 scale-100">
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
          {/* SKU Family ID and Country Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                SKU Family ID
              </label>
              <select
                name="skuFamilyId"
                value={formData.skuFamilyId}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
                disabled={skuLoading || skuError !== null}
              >
                <option value="" disabled>
                  {skuLoading ? "Loading SKU Families..." : skuError ? "Error loading SKU Families" : "Select SKU Family"}
                </option>
                {skuFamilies.map((sku) => (
                  <option key={sku._id} value={sku._id}>
                    {sku.name}
                  </option>
                ))}
              </select>
              {skuError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{skuError}</p>
              )}
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Country
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
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
            </div>
          </div>

          {/* SIM Type and Color Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                SIM Type
              </label>
              <select
                name="simType"
                value={formData.simType}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
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
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Color
              </label>
              <select
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
              >
                <option value="" disabled>
                  Select Color
                </option>
                {colorOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RAM and Storage Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                RAM
              </label>
              <select
                name="ram"
                value={formData.ram}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
              >
                <option value="" disabled>
                  Select RAM
                </option>
                {ramOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Storage
              </label>
              <select
                name="storage"
                value={formData.storage}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
              >
                <option value="" disabled>
                  Select Storage
                </option>
                {storageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition and Price Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
              >
                <option value="" disabled>
                  Select Condition
                </option>
                {conditionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Price"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Stock and MOQ Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Stock
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Stock Quantity"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                MOQ
              </label>
              <input
                type="number"
                name="moq"
                value={formData.moq}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Minimum Order Quantity"
                required
                min="1"
              />
            </div>
          </div>

          {/* Is Negotiable */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isNegotiable"
              checked={formData.isNegotiable}
              onChange={handleInputChange}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
            />
            <label className="ml-3 text-base font-medium text-gray-950 dark:text-gray-200">
              Is Negotiable
            </label>
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
              disabled={skuLoading || skuError !== null}
            >
              {editItem ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
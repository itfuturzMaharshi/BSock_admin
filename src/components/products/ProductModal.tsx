import React, { useState, useEffect } from "react";
import { ProductService, Product } from "../../services/product/product.services";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  purchaseType: string; // 'full' | 'partial'
  isNegotiable: boolean;
  isFlashDeal: string;
  expiryTime: string; // ISO string (e.g., "2025-10-30T03:30:00.000Z")
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
    purchaseType: "partial",
    isNegotiable: false,
    isFlashDeal: "false",
    expiryTime: "",
  });
  const [skuFamilies, setSkuFamilies] = useState<{ _id: string; name: string }[]>([]);
  const [skuLoading, setSkuLoading] = useState<boolean>(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [moqError, setMoqError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

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
        const skuId = typeof editItem.skuFamilyId === "object"
          ? (editItem.skuFamilyId._id || "")
          : (editItem.skuFamilyId || "");
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
          purchaseType: (editItem as any).purchaseType || "partial",
          isNegotiable: editItem.isNegotiable,
          isFlashDeal: `${(editItem as any).isFlashDeal ?? false}`,
          expiryTime: editItem.expiryTime || "",
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
          purchaseType: "partial",
          isNegotiable: false,
          isFlashDeal: "false",
          expiryTime: "",
        });
      }
      setDateError(null);
      setPriceError(null);
    }
  }, [isOpen, editItem]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((previous) => {
      let updatedValue: any;
      if (type === "checkbox") {
        const checked = (e.target as HTMLInputElement).checked;
        updatedValue = name === "isFlashDeal" ? (checked ? "true" : "false") : checked;
      } else if (type === "number") {
        updatedValue = parseFloat(value) || 0;
      } else {
        updatedValue = value;
      }

      // Start with previous, then apply the change
      let next = { ...previous, [name]: updatedValue } as FormData;

      // If isFlashDeal becomes "false", clear expiryTime
      if (name === "isFlashDeal" && updatedValue === "false") {
        next.expiryTime = "";
        setDateError(null);
      }

      // If purchaseType switches to 'full', sync moq to stock
      if (name === "purchaseType" && updatedValue === "full") {
        next.moq = Number(previous.stock) || 0;
      }

      // If stock changes and purchaseType is 'full', keep moq in sync
      if (name === "stock" && previous.purchaseType === "full") {
        next.moq = typeof updatedValue === "number" ? updatedValue : parseFloat(String(updatedValue)) || 0;
      }

      // Validate MOQ vs Stock for 'partial' type
      // const numericStock = parseFloat(String(name === "stock" ? updatedValue : previous.stock)) || 0;
      // const numericMoq = parseFloat(String(name === "moq" ? updatedValue : previous.moq)) || 0;
      const purchaseType = String(name === "purchaseType" ? updatedValue : previous.purchaseType);
      if (purchaseType === "partial") {
        // if (numericMoq >= numericStock) {
        //   setMoqError("MOQ must be less than Stock");
        // } else {
          setMoqError(null);
        // }
      } else {
        // For 'full', equality is enforced elsewhere; no error
        setMoqError(null);
      }

      return next;
    });
  };

  const handleDateChange = (date: Date | null) => {
    if (date && date > new Date() && !isNaN(date.getTime())) {
      setFormData((prev) => ({
        ...prev,
        expiryTime: date.toISOString(),
      }));
      setDateError(null);
    } else {
      setFormData((prev) => ({
        ...prev,
        expiryTime: "",
      }));
      setDateError("Please select a valid future date and time");
    }
  };

  // Ensure numeric-only input for price, stock, and moq (text inputs)
  const handleNumericChange = (
    name: "price" | "stock" | "moq",
    e: React.ChangeEvent<HTMLInputElement>,
    allowDecimal: boolean
  ) => {
    let value = e.target.value;

    // Strip invalid characters
    if (allowDecimal) {
      // Keep digits and at most one dot
      value = value.replace(/[^0-9.]/g, "");
      const parts = value.split(".");
      if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("").replace(/\./g, "");
      }
    } else {
      value = value.replace(/[^0-9]/g, "");
    }

    setFormData((previous) => {
      const next: FormData = { ...previous, [name]: value } as FormData;

      // Keep MOQ synced with stock when purchaseType is 'full'
      if (name === "stock" && previous.purchaseType === "full") {
        const numeric = value === "" ? 0 : parseFloat(value) || 0;
        next.moq = numeric;
      }

      // Validate MOQ vs Stock for 'partial' type
      // const numericStock = parseFloat(String(name === "stock" ? value : previous.stock)) || 0;
      // const numericMoq = parseFloat(String(name === "moq" ? value : previous.moq)) || 0;
      if (previous.purchaseType === "partial") {
        // if (numericMoq >= numericStock) {
        //   setMoqError("MOQ must be less than Stock");
        // } else {
          setMoqError(null);
        // }
      } else {
        setMoqError(null);
      }

      return next;
    });

    // Validate price if changed
    if (name === "price") {
      const numeric = parseFloat(value) || 0;
      if (value !== "" && numeric <= 0) {
        setPriceError("Price must be greater than 0");
      } else {
        setPriceError(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.skuFamilyId && skuFamilies.length > 0) {
      alert("Please select a SKU Family");
      return;
    }
    const numericPrice = parseFloat(String(formData.price)) || 0;
    if (numericPrice <= 0) {
      setPriceError("Please enter a valid price greater than 0");
      return;
    }
    if (formData.isFlashDeal === "true" && !formData.expiryTime) {
      setDateError("Expiry time is required for Flash Deals");
      return;
    }
    // Final MOQ validation before submit
    // const numericStock = parseFloat(String(formData.stock)) || 0;
    // const numericMoq = parseFloat(String(formData.moq)) || 0;
    // if (formData.purchaseType === "partial" && numericMoq >= numericStock) {
    //   setMoqError("MOQ must be less than Stock");
    //   return;
    // }
    onSave(formData);
  };

  if (!isOpen) return null;

  const title = editItem ? "Edit Product" : "Create Product";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[100vh] overflow-y-auto transform transition-all duration-300 scale-100">
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
                type="text"
                name="price"
                value={formData.price}
                onChange={(e) => handleNumericChange("price", e, true)}
                inputMode="decimal"
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Price"
                required
              />
              {priceError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{priceError}</p>
              )}
            </div>
          </div>

          {/* Purchase Type Row (after Price) */}
          <div>
            <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
              Purchase Type
            </label>
            <select
              name="purchaseType"
              value={formData.purchaseType}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              required
            >
              <option value="partial">Partial</option>
              <option value="full">Full</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Stock
              </label>
              <input
                type="text"
                name="stock"
                value={formData.stock}
                onChange={(e) => handleNumericChange("stock", e, false)}
                inputMode="numeric"
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Stock Quantity"
                required
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                MOQ
              </label>
              <input
                type="text"
                name="moq"
                value={formData.moq}
                onChange={(e) => handleNumericChange("moq", e, false)}
                inputMode="numeric"
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Minimum Order Quantity"
                required
                disabled={formData.purchaseType === "full"}
              />
              {moqError && formData.purchaseType === "partial" && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{moqError}</p>
              )}
              {formData.purchaseType === "full" && (
                <p className="mt-1 text-sm text-gray-500">MOQ equals Stock for Full purchase type.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
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
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isFlashDeal"
                checked={formData.isFlashDeal === "true"}
                onChange={handleInputChange}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
              />
              <label className="ml-3 text-base font-medium text-gray-950 dark:text-gray-200">
                Is Flash Deal
              </label>
            </div>
            {formData.isFlashDeal === "true" && (
              <div>
                <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Expiry Time
                </label>
                <DatePicker
                  selected={formData.expiryTime ? new Date(formData.expiryTime) : null}
                  onChange={handleDateChange}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  placeholderText="Select date and time"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  minDate={new Date()}
                  required
                />
                {dateError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{dateError}</p>
                )}
              </div>
            )}
          </div>

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
              disabled={skuLoading || skuError !== null || !!dateError || !!moqError || !!priceError}
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
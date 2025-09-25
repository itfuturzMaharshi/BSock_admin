import React, { useState, useEffect } from "react";
import { CostModuleService } from "../../services/costModule/costModule.services";
import toastHelper from "../../utils/toastHelper";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

// Define the interface for CostModule data
interface CostModule {
  _id?: string;
  type: "Product" | "Categories" | "Country" | "ExtraDelivery";
  products: Product[];
  categories: string[];
  countries: string[];
  remark: string;
  costType: "Percentage" | "Fixed";
  value: number;
  minValue?: number;
  maxValue?: number;
  isDeleted: boolean;
}

// Define the interface for form data
interface FormData {
  type: "Product" | "Categories" | "Country" | "ExtraDelivery";
  products: string[];
  categories: string[];
  countries: string[];
  remark: string;
  costType: "Percentage" | "Fixed";
  value: string;
  minValue: string;
  maxValue: string;
  isDeleted: boolean;
}

interface Product {
  _id: string;
  specification: string;
}

interface CostModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: CostModule) => void;
  editItem?: CostModule;
}

const CostModuleModal: React.FC<CostModuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
}) => {
  const [formData, setFormData] = useState<FormData>({
    type: "Product",
    products: [],
    categories: [],
    countries: [],
    remark: "",
    costType: "Percentage",
    value: "",
    minValue: "",
    maxValue: "",
    isDeleted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  // Static countries list
  const countriesList = ["Hongkong", "Dubai", "Singapore"];

  // Fetch products when modal opens
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const products = await CostModuleService.listProductsByName();
        console.log("Fetched products:", products); // Debug log
        setProductsList(products.filter((product) => product.specification)); // Filter out products with null/undefined specification
      } catch (error) {
        console.error("Error fetching products:", error);
        toastHelper.error("Failed to fetch products");
      } finally {
        setLoadingProducts(false);
      }
    };

    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  // Update form data when modal opens or editItem changes
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setFormData({
          type: editItem.type,
          products: editItem.products.map(p => p._id),
          categories: editItem.categories || [],
          countries: editItem.countries || [],
          remark: editItem.remark,
          costType: editItem.costType,
          value: editItem.value.toString(),
          minValue: editItem.minValue?.toString() || "",
          maxValue: editItem.maxValue?.toString() || "",
          isDeleted: editItem.isDeleted,
        });
      } else {
        setFormData({
          type: "Product",
          products: [],
          categories: [],
          countries: [],
          remark: "",
          costType: "Percentage",
          value: "",
          minValue: "",
          maxValue: "",
          isDeleted: false,
        });
      }
    }
  }, [isOpen, editItem]);

  // Handle input changes for regular inputs and select elements
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle product selection change for react-select
  const handleProductChange = (selectedOption: any) => {
    setFormData((prev) => ({
      ...prev,
      products: selectedOption ? selectedOption.map((option: any) => option.value) : [],
    }));
  };

  const handleCategoryChange = (selectedOption: any) => {
    setFormData((prev) => ({
      ...prev,
      categories: selectedOption ? selectedOption.map((option: any) => option.value) : [],
    }));
  };

  const handleCountryChange = (selectedOption: any) => {
    setFormData((prev) => ({
      ...prev,
      countries: selectedOption ? selectedOption.map((option: any) => option.value) : [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const type = formData.type;
    let valid = !!formData.value;
    if (type === 'Product' && formData.products.length === 0) valid = false;
    if (type === 'Categories' && formData.categories.length === 0) valid = false;
    if (['Country', 'ExtraDelivery'].includes(type) && formData.countries.length === 0) valid = false;
    if (!valid) {
      toastHelper.error(
        "Please fill all required fields."
      );
      return;
    }
    setIsSubmitting(true);
    const newItem: CostModule = {
      type: formData.type,
      products: formData.products.map(id => ({
        _id: id,
        specification: productsList.find(p => p._id === id)?.specification || 'Unknown',
      })),
      categories: formData.categories,
      countries: formData.countries,
      remark: formData.remark,
      costType: formData.costType as "Percentage" | "Fixed",
      value: parseFloat(formData.value) || 0,
      minValue: formData.minValue ? parseFloat(formData.minValue) : undefined,
      maxValue: formData.maxValue ? parseFloat(formData.maxValue) : undefined,
      isDeleted: formData.isDeleted,
    };
    try {
      await onSave(newItem);
      toastHelper.showTost("Cost module saved successfully!", "success");
    } catch (error) {
      console.error("Error saving cost module:", error);
      toastHelper.error("Failed to save cost module");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const title = editItem ? "Edit Cost Module" : "Create Cost Module";

  // Prepare product options for react-select
  const productOptions = productsList.map((product) => ({
    value: product._id,
    label: product.specification,
  }));

  // Prepare country options
  const countryOptions = countriesList.map((country) => ({
    value: country,
    label: country,
  }));

  // Find the selected products for react-select
  const selectedProducts = productOptions.filter((option) =>
    formData.products.includes(option.value)
  );

  const selectedCategories = formData.categories.map((cat) => ({
    value: cat,
    label: cat,
  }));

  const selectedCountries = countryOptions.filter((option) =>
    formData.countries.includes(option.value)
  );

  const customStyles = {
    control: (defaultStyles: any, state: any) => ({
      ...defaultStyles,
      display: "flex",
      alignItems: "center",
      minHeight: "48px",
      padding: "6px 12px",
      backgroundColor: state.isDisabled
        ? "#f9fafb"
        : "var(--tw-colors-gray-50)", // light mode background
      border: state.isFocused
        ? "2px solid #3b82f6" // blue-500 on focus
        : "1px solid #e5e7eb", // gray-200 default
      borderRadius: "0.5rem", // rounded-lg
      boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
      transition: "all 0.2s ease",
      cursor: "pointer",
    }),
    placeholder: (defaultStyles: any) => ({
      ...defaultStyles,
      textAlign: "left",
      color: "#6b7280", // gray-500 placeholder
    }),
    singleValue: (defaultStyles: any) => ({
      ...defaultStyles,
      textAlign: "left",
      color: "#1f2937", // gray-800 text
    }),
    input: (defaultStyles: any) => ({
      ...defaultStyles,
      textAlign: "left",
      color: "#1f2937", // gray-800
    }),
    menu: (defaultStyles: any) => ({
      ...defaultStyles,
      borderRadius: "0.5rem",
      marginTop: "4px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      zIndex: 20,
    }),
    option: (defaultStyles: any, state: any) => ({
      ...defaultStyles,
      textAlign: "left",
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#e6f0ff"
        : "white",
      color: state.isSelected ? "white" : "#1f2937",
      cursor: "pointer",
      padding: "10px 12px",
    }),
  };

  return (
    <div className="fixed inset-0 flex  items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[88vh] overflow-y-auto transform transition-all duration-300 scale-100">
        {/* Close Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform duration-200 hover:scale-110"
          disabled={isSubmitting}
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
          {/* Type and Cost Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
                disabled={isSubmitting}
              >
                <option value="Product">Product</option>
                <option value="Categories">Categories</option>
                <option value="Country">Country</option>
                <option value="ExtraDelivery">Extra Delivery</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Cost Type
              </label>
              <select
                name="costType"
                value={formData.costType}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
                disabled={isSubmitting}
              >
                <option value="Percentage">Percentage</option>
                <option value="Fixed">Fixed</option>
              </select>
            </div>
          </div>

          {/* Conditional Fields */}
          {formData.type === "Product" && (
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Product
              </label>
              <div className="w-full">
                <Select
                  isMulti
                  options={productOptions}
                  value={selectedProducts}
                  onChange={handleProductChange}
                  placeholder={
                    loadingProducts ? "Loading products..." : "Select products"
                  }
                  isLoading={loadingProducts}
                  isDisabled={isSubmitting || loadingProducts}
                  styles={customStyles}
                  isClearable
                  isSearchable
                  classNamePrefix="react-select"
                />
              </div>
            </div>
          )}
          {formData.type === "Categories" && (
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Categories
              </label>
              <div className="w-full">
                <CreatableSelect
                  isMulti
                  value={selectedCategories}
                  onChange={handleCategoryChange}
                  placeholder="Add categories"
                  isDisabled={isSubmitting}
                  styles={customStyles}
                  isClearable
                  isSearchable
                  classNamePrefix="react-select"
                />
              </div>
            </div>
          )}
          {["Country", "ExtraDelivery"].includes(formData.type) && (
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Countries
              </label>
              <div className="w-full">
                <Select
                  isMulti
                  options={countryOptions}
                  value={selectedCountries}
                  onChange={handleCountryChange}
                  placeholder="Select countries"
                  isDisabled={isSubmitting}
                  styles={customStyles}
                  isClearable
                  isSearchable
                  classNamePrefix="react-select"
                />
              </div>
            </div>
          )}

          {/* Remark */}
          <div>
            <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
              Remark
            </label>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              placeholder="Enter Remark"
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          {/* Value, Min Value, Max Value */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Value
              </label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Value"
                required
                step="0.01"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Min Value
              </label>
              <input
                type="number"
                name="minValue"
                value={formData.minValue}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Min Value"
                step="0.01"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Max Value
              </label>
              <input
                type="number"
                name="maxValue"
                value={formData.maxValue}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Max Value"
                step="0.01"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 transform hover:scale-105"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 transition duration-200 transform hover:scale-105 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : editItem
                ? "Update Cost Module"
                : "Create Cost Module"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CostModuleModal;
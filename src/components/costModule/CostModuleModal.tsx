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

interface ValidationErrors {
  type?: string;
  products?: string;
  categories?: string;
  countries?: string;
  remark?: string;
  costType?: string;
  value?: string;
  minValue?: string;
  maxValue?: string;
  isDeleted?: string;
}

interface TouchedFields {
  type: boolean;
  products: boolean;
  categories: boolean;
  countries: boolean;
  remark: boolean;
  costType: boolean;
  value: boolean;
  minValue: boolean;
  maxValue: boolean;
  isDeleted: boolean;
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({
    type: false,
    products: false,
    categories: false,
    countries: false,
    remark: false,
    costType: false,
    value: false,
    minValue: false,
    maxValue: false,
    isDeleted: false,
  });

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
    
    // Validate the field if it's been touched
    if (touched[name as keyof TouchedFields]) {
      const error = validateField(name as keyof FormData, value);
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    }
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

  const validateField = (name: keyof FormData, value: any): string | undefined => {
    switch (name) {
      case 'type':
        return !value ? 'Type is required' : undefined;
      case 'products':
        return formData.type === 'Product' && (!value || (Array.isArray(value) && value.length === 0)) ? 'At least one product is required' : undefined;
      case 'categories':
        return formData.type === 'Categories' && (!value || (Array.isArray(value) && value.length === 0)) ? 'At least one category is required' : undefined;
      case 'countries':
        return formData.type === 'Country' && (!value || (Array.isArray(value) && value.length === 0)) ? 'At least one country is required' : undefined;
      case 'remark':
        return !value || value.trim() === '' ? 'Remark is required' : undefined;
      case 'costType':
        return !value ? 'Cost Type is required' : undefined;
      case 'value':
        if (!value || value.trim() === '') return 'Value is required';
        const numericValue = parseFloat(String(value));
        return isNaN(numericValue) ? 'Value must be a valid number' : numericValue <= 0 ? 'Value must be greater than 0' : undefined;
      case 'minValue':
        if (value && value.trim() !== '') {
          const numericMinValue = parseFloat(String(value));
          if (isNaN(numericMinValue)) return 'Min Value must be a valid number';
          if (numericMinValue < 0) return 'Min Value must be greater than or equal to 0';
        }
        return undefined;
      case 'maxValue':
        if (value && value.trim() !== '') {
          const numericMaxValue = parseFloat(String(value));
          if (isNaN(numericMaxValue)) return 'Max Value must be a valid number';
          if (numericMaxValue < 0) return 'Max Value must be greater than or equal to 0';
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Only validate required fields
    const requiredFields: (keyof FormData)[] = [
      'type', 'remark', 'costType', 'value'
    ];

    requiredFields.forEach((fieldName) => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    });

    // Conditional validation based on type
    if (formData.type === 'Product') {
      const error = validateField('products', formData.products);
      if (error) {
        errors.products = error;
        isValid = false;
      }
    } else if (formData.type === 'Categories') {
      const error = validateField('categories', formData.categories);
      if (error) {
        errors.categories = error;
        isValid = false;
      }
    } else if (formData.type === 'Country') {
      const error = validateField('countries', formData.countries);
      if (error) {
        errors.countries = error;
        isValid = false;
      }
    }

    // Validate min/max values
    const minError = validateField('minValue', formData.minValue);
    if (minError) {
      errors.minValue = minError;
      isValid = false;
    }

    const maxError = validateField('maxValue', formData.maxValue);
    if (maxError) {
      errors.maxValue = maxError;
      isValid = false;
    }

    // Additional validation: minValue should be less than maxValue if both are provided
    if (formData.minValue && formData.maxValue && formData.minValue.trim() !== '' && formData.maxValue.trim() !== '') {
      const numericMinValue = parseFloat(String(formData.minValue));
      const numericMaxValue = parseFloat(String(formData.maxValue));
      if (!isNaN(numericMinValue) && !isNaN(numericMaxValue) && numericMinValue >= numericMaxValue) {
        errors.maxValue = 'Max Value must be greater than Min Value';
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name as keyof FormData, formData[name as keyof FormData]);
    setValidationErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      type: true,
      products: true,
      categories: true,
      countries: true,
      remark: true,
      costType: true,
      value: true,
      minValue: true,
      maxValue: true,
      isDeleted: true,
    });

    const isValid = validateForm();
    if (!isValid) {
      toastHelper.error("Please fill all required fields");
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
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-[800px] max-h-[80vh] transform transition-all duration-300 scale-100 flex flex-col">
        
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
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="cost-module-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Type and Cost Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                Type
              </label>
              <div className="relative">
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                    touched.type && validationErrors.type
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  required
                  disabled={isSubmitting}
                >
                  <option value="Product">Product</option>
                  <option value="Categories">Categories</option>
                  <option value="Country">Country</option>
                  <option value="ExtraDelivery">Extra Delivery</option>
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
              </div>
              {touched.type && validationErrors.type && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.type}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                Cost Type
              </label>
              <div className="relative">
                <select
                  name="costType"
                  value={formData.costType}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                    touched.costType && validationErrors.costType
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  required
                  disabled={isSubmitting}
                >
                  <option value="Percentage">Percentage</option>
                  <option value="Fixed">Fixed</option>
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
              </div>
              {touched.costType && validationErrors.costType && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.costType}</p>
              )}
            </div>
          </div>

          {/* Conditional Fields */}
          {formData.type === "Product" && (
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
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
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
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
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
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
            <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
              Remark
            </label>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                touched.remark && validationErrors.remark
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder="Enter Remark"
              rows={4}
              required
              disabled={isSubmitting}
            />
            {touched.remark && validationErrors.remark && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.remark}</p>
            )}
          </div>

          {/* Value, Min Value, Max Value */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                Value
              </label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                  touched.value && validationErrors.value
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                placeholder="Enter Value"
                required
                step="0.01"
                disabled={isSubmitting}
              />
              {touched.value && validationErrors.value && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.value}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                Min Value
              </label>
              <input
                type="number"
                name="minValue"
                value={formData.minValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                  touched.minValue && validationErrors.minValue
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                placeholder="Enter Min Value"
                step="0.01"
                disabled={isSubmitting}
              />
              {touched.minValue && validationErrors.minValue && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.minValue}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                Max Value
              </label>
              <input
                type="number"
                name="maxValue"
                value={formData.maxValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                  touched.maxValue && validationErrors.maxValue
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                placeholder="Enter Max Value"
                step="0.01"
                disabled={isSubmitting}
              />
              {touched.maxValue && validationErrors.maxValue && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.maxValue}</p>
              )}
            </div>
          </div>

          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-6 pt-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="cost-module-form"
              className="px-4 py-2 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 transition duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : editItem
                ? "Update Cost Module"
                : "Create Cost Module"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostModuleModal;
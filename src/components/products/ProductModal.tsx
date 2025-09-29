import React, { useState, useEffect } from "react";
import {
  ProductService,
  Product,
} from "../../services/product/product.services";
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

interface ValidationErrors {
  skuFamilyId?: string;
  simType?: string;
  color?: string;
  ram?: string;
  storage?: string;
  condition?: string;
  price?: string;
  stock?: string;
  country?: string;
  moq?: string;
  purchaseType?: string;
  expiryTime?: string;
  isNegotiable?: string;
  isFlashDeal?: string;
}

interface TouchedFields {
  skuFamilyId: boolean;
  simType: boolean;
  color: boolean;
  ram: boolean;
  storage: boolean;
  condition: boolean;
  price: boolean;
  stock: boolean;
  country: boolean;
  moq: boolean;
  purchaseType: boolean;
  expiryTime: boolean;
  isNegotiable: boolean;
  isFlashDeal: boolean;
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
  const [skuFamilies, setSkuFamilies] = useState<
    { _id: string; name: string }[]
  >([]);
  const [skuLoading, setSkuLoading] = useState<boolean>(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [moqError, setMoqError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touched, setTouched] = useState<TouchedFields>({
    skuFamilyId: false,
    simType: false,
    color: false,
    ram: false,
    storage: false,
    condition: false,
    price: false,
    stock: false,
    country: false,
    moq: false,
    purchaseType: false,
    expiryTime: false,
    isNegotiable: false,
    isFlashDeal: false,
  });

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
        const skuId =
          typeof editItem.skuFamilyId === "object"
            ? editItem.skuFamilyId._id || ""
            : editItem.skuFamilyId || "";
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((previous) => {
      let updatedValue: any;
      if (type === "checkbox") {
        const checked = (e.target as HTMLInputElement).checked;
        updatedValue =
          name === "isFlashDeal" ? (checked ? "true" : "false") : checked;
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
        next.moq =
          typeof updatedValue === "number"
            ? updatedValue
            : parseFloat(String(updatedValue)) || 0;
      }

      // Validate MOQ vs Stock for 'partial' type
      // const numericStock = parseFloat(String(name === "stock" ? updatedValue : previous.stock)) || 0;
      // const numericMoq = parseFloat(String(name === "moq" ? updatedValue : previous.moq)) || 0;
      const purchaseType = String(
        name === "purchaseType" ? updatedValue : previous.purchaseType
      );
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

    // Validate the field if it's been touched
    if (touched[name as keyof TouchedFields]) {
      const error = validateField(name as keyof FormData, value);
      setValidationErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date && date > new Date() && !isNaN(date.getTime())) {
      setFormData((prev) => ({
        ...prev,
        expiryTime: date.toISOString(),
      }));
      setDateError(null);

      // Validate the field if it's been touched
      if (touched.expiryTime) {
        const error = validateField("expiryTime", date.toISOString());
        setValidationErrors((prev) => ({ ...prev, expiryTime: error }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        expiryTime: "",
      }));
      setDateError("Please select a valid future date and time");

      // Validate the field if it's been touched
      if (touched.expiryTime) {
        const error = validateField("expiryTime", "");
        setValidationErrors((prev) => ({ ...prev, expiryTime: error }));
      }
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

  const validateField = (
    name: keyof FormData,
    value: any
  ): string | undefined => {
    switch (name) {
      case "skuFamilyId":
        return !value ? "SKU Family is required" : undefined;
      case "simType":
        return !value ? "SIM Type is required" : undefined;
      case "color":
        return !value ? "Color is required" : undefined;
      case "ram":
        return !value ? "RAM is required" : undefined;
      case "storage":
        return !value ? "Storage is required" : undefined;
      case "condition":
        return !value ? "Condition is required" : undefined;
      case "price":
        if (value === "" || value === null || value === undefined)
          return "Price is required";
        const numericPrice = parseFloat(String(value));
        return isNaN(numericPrice)
          ? "Price must be a valid number"
          : numericPrice <= 0
          ? "Price must be greater than 0"
          : undefined;
      case "stock":
        if (value === "" || value === null || value === undefined)
          return "Stock is required";
        const numericStock = parseFloat(String(value));
        return isNaN(numericStock)
          ? "Stock must be a valid number"
          : numericStock <= 0
          ? "Stock must be greater than 0"
          : undefined;
      case "country":
        return !value ? "Country is required" : undefined;
      case "moq":
        if (value === "" || value === null || value === undefined)
          return "MOQ is required";
        const numericMoq = parseFloat(String(value));
        return isNaN(numericMoq)
          ? "MOQ must be a valid number"
          : numericMoq <= 0
          ? "MOQ must be greater than 0"
          : undefined;
      case "purchaseType":
        return !value ? "Purchase Type is required" : undefined;
      case "expiryTime":
        return formData.isFlashDeal === "true" && !value
          ? "Expiry time is required for Flash Deals"
          : undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Only validate required fields
    const requiredFields: (keyof FormData)[] = [
      "skuFamilyId",
      "simType",
      "color",
      "ram",
      "storage",
      "condition",
      "price",
      "stock",
      "country",
      "moq",
      "purchaseType",
    ];

    requiredFields.forEach((fieldName) => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    });

    // Validate expiry time only if flash deal is enabled
    if (formData.isFlashDeal === "true") {
      const error = validateField("expiryTime", formData.expiryTime);
      if (error) {
        errors.expiryTime = error;
        isValid = false;
      }
    }

    // Additional MOQ validation
    const numericStock = parseFloat(String(formData.stock));
    const numericMoq = parseFloat(String(formData.moq));
    if (
      formData.purchaseType === "partial" &&
      !isNaN(numericStock) &&
      !isNaN(numericMoq) &&
      numericMoq >= numericStock
    ) {
      errors.moq = "MOQ must be less than Stock";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(
      name as keyof FormData,
      formData[name as keyof FormData]
    );
    setValidationErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      skuFamilyId: true,
      simType: true,
      color: true,
      ram: true,
      storage: true,
      condition: true,
      price: true,
      stock: true,
      country: true,
      moq: true,
      purchaseType: true,
      expiryTime: true,
      isNegotiable: true,
      isFlashDeal: true,
    });

    const isValid = validateForm();
    console.log("Form validation result:", isValid);
    console.log("Current validation errors:", validationErrors);
    console.log("Form data:", formData);

    if (!isValid) {
      console.log("Form validation failed, not submitting");
      return;
    }

    console.log("Form is valid, submitting...");
    onSave(formData);
  };

  if (!isOpen) return null;

  const title = editItem ? "Edit Product" : "Create Product";

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
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            {/* SKU Family ID, Country, and Sim Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  SKU Family ID
                </label>
                <div className="relative">
                  <select
                    name="skuFamilyId"
                    value={formData.skuFamilyId}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.skuFamilyId && validationErrors.skuFamilyId
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                    disabled={skuLoading || skuError !== null}
                  >
                    <option value="" disabled>
                      {skuLoading
                        ? "Loading SKU Families..."
                        : skuError
                        ? "Error loading SKU Families"
                        : "Select SKU Family"}
                    </option>
                    {skuFamilies.map((sku) => (
                      <option key={sku._id} value={sku._id}>
                        {sku.name}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.skuFamilyId && validationErrors.skuFamilyId && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.skuFamilyId}
                  </p>
                )}
                {skuError && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {skuError}
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
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.country && validationErrors.country
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
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
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.country && validationErrors.country && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.country}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  SIM Type
                </label>
                <div className="relative">
                  <select
                    name="simType"
                    value={formData.simType}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.simType && validationErrors.simType
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
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
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.simType && validationErrors.simType && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.simType}
                  </p>
                )}
              </div>
            </div>

            {/* Color, RAM, and Storage Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Color
                </label>
                <div className="relative">
                  <select
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.color && validationErrors.color
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
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
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.color && validationErrors.color && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.color}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  RAM
                </label>
                <div className="relative">
                  <select
                    name="ram"
                    value={formData.ram}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.ram && validationErrors.ram
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
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
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.ram && validationErrors.ram && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.ram}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Storage
                </label>
                <div className="relative">
                  <select
                    name="storage"
                    value={formData.storage}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.storage && validationErrors.storage
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
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
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.storage && validationErrors.storage && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.storage}
                  </p>
                )}
              </div>
            </div>

            {/* Condition, Price, and Stock Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Condition
                </label>
                <div className="relative">
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.condition && validationErrors.condition
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
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
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.condition && validationErrors.condition && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.condition}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Price
                </label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={(e) => handleNumericChange("price", e, true)}
                  onBlur={handleBlur}
                  inputMode="decimal"
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                    touched.price && validationErrors.price
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  placeholder="Enter Price"
                  required
                />
                {touched.price && validationErrors.price && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.price}
                  </p>
                )}
                {priceError && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {priceError}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Stock
                </label>
                <input
                  type="text"
                  name="stock"
                  value={formData.stock}
                  onChange={(e) => handleNumericChange("stock", e, false)}
                  onBlur={handleBlur}
                  inputMode="numeric"
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                    touched.stock && validationErrors.stock
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  placeholder="Enter Stock"
                  required
                />
                {touched.stock && validationErrors.stock && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.stock}
                  </p>
                )}
              </div>
            </div>

            {/* MOQ and Purchase Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  MOQ
                </label>
                <input
                  type="text"
                  name="moq"
                  value={formData.moq}
                  onChange={(e) => handleNumericChange("moq", e, false)}
                  onBlur={handleBlur}
                  inputMode="numeric"
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                    touched.moq && validationErrors.moq
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  placeholder="Enter Minimum Order Quantity"
                  required
                  disabled={formData.purchaseType === "full"}
                />
                {touched.moq && validationErrors.moq && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.moq}
                  </p>
                )}
                {moqError && formData.purchaseType === "partial" && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {moqError}
                  </p>
                )}
                {formData.purchaseType === "full" && (
                  <p className="mt-1 text-xs text-gray-500">
                    MOQ equals Stock for Full purchase type.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Purchase Type
                </label>
                <div className="relative">
                  <select
                    name="purchaseType"
                    value={formData.purchaseType}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.purchaseType && validationErrors.purchaseType
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                  >
                    <option value="partial">Partial</option>
                    <option value="full">Full</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.purchaseType && validationErrors.purchaseType && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.purchaseType}
                  </p>
                )}
              </div>
            </div>

            {/* Expiry Time, Is Negotiable, and Is Flash Deal Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Flash Deal Expiry Time */}
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Expiry Time
                </label>
                <DatePicker
                  selected={
                    formData.expiryTime ? new Date(formData.expiryTime) : null
                  }
                  onChange={handleDateChange}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, expiryTime: true }));
                    const error = validateField(
                      "expiryTime",
                      formData.expiryTime
                    );
                    setValidationErrors((prev) => ({
                      ...prev,
                      expiryTime: error,
                    }));
                  }}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  placeholderText="Select date and time"
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                    touched.expiryTime && validationErrors.expiryTime
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  minDate={new Date()}
                  required={formData.isFlashDeal === "true"}
                />
                {touched.expiryTime && validationErrors.expiryTime && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.expiryTime}
                  </p>
                )}
                {dateError && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {dateError}
                  </p>
                )}
              </div>

              {/* Is Negotiable Checkbox */}
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  name="isNegotiable"
                  checked={formData.isNegotiable}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
                />
                <label className="ml-2 text-sm font-medium text-gray-950 dark:text-gray-200">
                  Is Negotiable
                </label>
              </div>

              {/* Is Flash Deal Checkbox */}
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  name="isFlashDeal"
                  checked={formData.isFlashDeal === "true"}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
                />
                <label className="ml-2 text-sm font-medium text-gray-950 dark:text-gray-200">
                  Is Flash Deal
                </label>
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
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              className="min-w-[160px] px-4 py-2 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 transition duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={skuLoading || skuError !== null}
            >
              {skuLoading ? (
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 
           0 5.373 0 12h4zm2 5.291A7.962 
           7.962 0 014 12H0c0 3.042 1.135 
           5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : editItem ? (
                "Update Product"
              ) : (
                "Create Product"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;

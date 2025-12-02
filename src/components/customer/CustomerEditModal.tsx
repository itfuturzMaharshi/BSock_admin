import React, { useState, useEffect } from "react";
import {
  CustomerService,
  UpdateCustomerRequest,
  Customer,
} from "../../services/customer/customerService";
import { CustomerCategoryService, CustomerCategory } from "../../services/customerCategory/customerCategory.services";
import CountrySelect from "./CountrySelect";

// Define the interface for form data
interface FormData {
  name: string;
  email: string;
  mobileNumber: string;
  mobileCountryCode: string;
  whatsappNumber: string;
  whatsappCountryCode: string;
  isActive: boolean;
  isApproved: boolean;
  isAllowBidding: boolean;
  customerCategory: string;
}

// Define validation errors interface
interface ValidationErrors {
  name?: string;
  email?: string;
  mobileNumber?: string;
}

interface CustomerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editCustomer: Customer | null;
}

const CustomerEditModal: React.FC<CustomerEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editCustomer,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    mobileNumber: "",
    mobileCountryCode: "",
    whatsappNumber: "",
    whatsappCountryCode: "",
    isActive: true,
    isApproved: false,
    isAllowBidding: true,
    customerCategory: "",
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [customerCategories, setCustomerCategories] = useState<CustomerCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomerCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editCustomer) {
      // Populate form with existing customer data
      const categoryId = typeof editCustomer.customerCategory === 'object' && editCustomer.customerCategory !== null
        ? editCustomer.customerCategory._id
        : (editCustomer.customerCategory || "");
      
      setFormData({
        name: editCustomer.name || "",
        email: editCustomer.email || "",
        mobileNumber: editCustomer.mobileNumber || "",
        mobileCountryCode: editCustomer.mobileCountryCode ? editCustomer.mobileCountryCode.trim() : "",
        whatsappNumber: editCustomer.whatsappNumber || "",
        whatsappCountryCode: editCustomer.whatsappCountryCode ? editCustomer.whatsappCountryCode.trim() : "",
        isActive: editCustomer.isActive !== undefined ? editCustomer.isActive : true,
        isApproved: editCustomer.isApproved !== undefined ? editCustomer.isApproved : false,
        isAllowBidding: editCustomer.isAllowBidding !== undefined ? editCustomer.isAllowBidding : true,
        customerCategory: categoryId,
      });
      setValidationErrors({});
      setTouched({});
    }
  }, [isOpen, editCustomer]);

  const fetchCustomerCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await CustomerCategoryService.getCustomerCategoryList(1, 1000, '');
      if (response.data && response.data.docs) {
        setCustomerCategories(response.data.docs);
      }
    } catch (error) {
      console.error("Error fetching customer categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Validation functions
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 2)
          return "Name must be at least 2 characters";
        return undefined;
      case "email":
        if (!value.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value))
          return "Please enter a valid email address";
        return undefined;
      case "mobileNumber":
        // Mobile number is optional, but if provided, validate format
        if (value && value.trim() && !/^[0-9]{10,10}$/.test(value.trim())) {
          return "Mobile number must be 10 digits";
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    // Validate field on change
    if (touched[name]) {
      const error = validateField(name, value);
      setValidationErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    const nameError = validateField("name", formData.name);
    if (nameError) errors.name = nameError;

    const emailError = validateField("email", formData.email);
    if (emailError) errors.email = emailError;

    const mobileError = validateField("mobileNumber", formData.mobileNumber);
    if (mobileError) errors.mobileNumber = mobileError;

    setValidationErrors(errors);
    setTouched({ name: true, email: true, mobileNumber: true });

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!editCustomer) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: UpdateCustomerRequest = {
        customerId: editCustomer._id,
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobileNumber || undefined,
        mobileCountryCode: formData.mobileCountryCode || undefined,
        whatsappNumber: formData.whatsappNumber || undefined,
        whatsappCountryCode: formData.whatsappCountryCode || undefined,
        isActive: formData.isActive,
        isApproved: formData.isApproved,
        isAllowBidding: formData.isAllowBidding,
        customerCategory: formData.customerCategory || null,
      };

      await CustomerService.updateCustomer(updateData);
      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating customer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !editCustomer) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Edit Customer
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ${
                touched.name && validationErrors.name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              placeholder="Enter Name"
              required
            />
            {touched.name && validationErrors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {validationErrors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ${
                touched.email && validationErrors.email
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              placeholder="Enter Email"
              required
            />
            {touched.email && validationErrors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Mobile Number Fields */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                Country Code
              </label>
              <CountrySelect
                key={`mobile-${editCustomer._id}-${formData.mobileCountryCode}`}
                value={formData.mobileCountryCode}
                onChange={(phoneCode) =>
                  setFormData((prev) => ({
                    ...prev,
                    mobileCountryCode: phoneCode,
                  }))
                }
                placeholder="Select Country"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                Mobile Number
              </label>
              <input
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ${
                  touched.mobileNumber && validationErrors.mobileNumber
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-700"
                }`}
                placeholder="Enter Mobile Number"
              />
              {touched.mobileNumber && validationErrors.mobileNumber && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {validationErrors.mobileNumber}
                </p>
              )}
            </div>
          </div>

          {/* WhatsApp Number Fields */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                WhatsApp Code
              </label>
              <CountrySelect
                key={`whatsapp-${editCustomer._id}-${formData.whatsappCountryCode}`}
                value={formData.whatsappCountryCode}
                onChange={(phoneCode) =>
                  setFormData((prev) => ({
                    ...prev,
                    whatsappCountryCode: phoneCode,
                  }))
                }
                placeholder="Select Country"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                WhatsApp Number
              </label>
              <input
                type="text"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter WhatsApp Number"
              />
            </div>
          </div>

          {/* Customer Category Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
              Customer Category
            </label>
            <select
              name="customerCategory"
              value={formData.customerCategory}
              onChange={(e) => setFormData({ ...formData, customerCategory: e.target.value })}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              disabled={loadingCategories}
            >
              <option value="">Select Customer Category (Optional)</option>
              {customerCategories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
              />
              <label className="ml-2 text-sm font-medium text-gray-950 dark:text-gray-200">
                Active Status
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isApproved"
                checked={formData.isApproved}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
              />
              <label className="ml-2 text-sm font-medium text-gray-950 dark:text-gray-200">
                Approved Status
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isAllowBidding"
                checked={formData.isAllowBidding}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
              />
              <label className="ml-2 text-sm font-medium text-gray-950 dark:text-gray-200">
                Allow Bidding
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[140px] px-4 py-2 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? (
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
                "Update Customer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerEditModal;


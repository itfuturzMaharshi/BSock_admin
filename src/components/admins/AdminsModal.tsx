import React, { useState, useEffect } from "react";
import { AdminService, CreateAdminRequest, UpdateAdminRequest, Admin } from "../../services/admin/admin.services";

// Define the interface for form data
interface FormData {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
}

// Define validation errors interface
interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
}

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Changed to void since we'll handle API calls internally
  editAdmin?: Admin | null; // Admin to edit, null for create mode
}

const AdminsModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editAdmin,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    isActive: true,
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (editAdmin) {
        // Edit mode - populate form with existing admin data
        setFormData({
          name: editAdmin.name,
          email: editAdmin.email,
          password: "", // Don't populate password for security
          isActive: editAdmin.isActive,
        });
      } else {
        // Create mode - reset form
        setFormData({
          name: "",
          email: "",
          password: "",
          isActive: true,
        });
      }
      setShowPassword(false);
      setValidationErrors({});
      setTouched({});
    }
  }, [isOpen, editAdmin]);

  // Validation functions
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return undefined;
      case 'password':
        if (!editAdmin && !value.trim()) return 'Password is required'; // Only required for new admins
        if (value && value.length < 6) return 'Password must be at least 6 characters';
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
    
    const nameError = validateField('name', formData.name);
    if (nameError) errors.name = nameError;
    
    const emailError = validateField('email', formData.email);
    if (emailError) errors.email = emailError;
    
    // Only validate password for new admins or if password is provided for existing admins
    if (!editAdmin || formData.password) {
      const passwordError = validateField('password', formData.password);
      if (passwordError) errors.password = passwordError;
    }
    
    setValidationErrors(errors);
    setTouched({ name: true, email: true, password: true });
    
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editAdmin) {
        // Update existing admin
        const updateData: UpdateAdminRequest = {
          id: editAdmin._id,
          name: formData.name,
          email: formData.email,
          isActive: formData.isActive,
        };
        
        // Only include password if it's provided for existing admins
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await AdminService.updateAdmin(updateData);
      } else {
        // Create new admin
        const createData: CreateAdminRequest = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        };
        
        await AdminService.createAdmin(createData);
      }
      
      onSave(); // Refresh the parent component
      onClose();
    } catch (error) {
      console.error('Error saving admin:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const title = editAdmin ? "Edit Admin" : "Create Admin";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl w-full max-w-[500px] max-h-[80vh] overflow-y-auto transform transition-all duration-300 scale-100">
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
          {title}
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
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder="Enter Name"
              required
            />
            {touched.name && validationErrors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.name}</p>
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
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder="Enter Email"
              required
            />
            {touched.email && validationErrors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Field (only for creating new admins) */}
          {!editAdmin && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                Password *
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-10 p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ${
                    touched.password && validationErrors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  placeholder="Enter Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <i
                    className={`fas ${
                      showPassword ? "fa-eye" : "fa-eye-slash"
                    }`}
                  ></i>
                </button>
              </div>
              {touched.password && validationErrors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationErrors.password}</p>
              )}
            </div>
          )}


          {/* Active Status */}
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
              className="px-4 py-2 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>
              )}
              {editAdmin ? "Update Admin" : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminsModal;

import React, { useState, useEffect, useRef } from "react";

// Define the interface for Admin data
interface Admin {
  profileImage: string;
  name: string;
  email: string;
  password: string;
  isSuperAdmin: boolean;
  isApproved: boolean;
  isActive: boolean;
  isDeleted: boolean;
}

// Define the interface for form data
interface FormData {
  profileImage: string;
  name: string;
  email: string;
  password: string;
  isSuperAdmin: boolean;
  isApproved: boolean;
  isActive: boolean;
  isDeleted: boolean;
}

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: Admin) => void;
  editItem?: Admin;
}

const AdminsModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
}) => {
  const [formData, setFormData] = useState<FormData>({
    profileImage: "",
    name: "",
    email: "",
    password: "",
    isSuperAdmin: false,
    isApproved: false,
    isActive: false,
    isDeleted: false,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setFormData({
          profileImage: editItem.profileImage,
          name: editItem.name,
          email: editItem.email,
          password: editItem.password,
          isSuperAdmin: editItem.isSuperAdmin,
          isApproved: editItem.isApproved,
          isActive: editItem.isActive,
          isDeleted: editItem.isDeleted,
        });
      } else {
        setFormData({
          profileImage: "",
          name: "",
          email: "",
          password: "",
          isSuperAdmin: false,
          isApproved: false,
          isActive: false,
          isDeleted: false,
        });
      }
      setShowPassword(false); // Reset password visibility on modal open
    }
  }, [isOpen, editItem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profileImage: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      profileImage: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newItem: Admin = { ...formData };
    onSave(newItem);
    onClose();
  };

  if (!isOpen) return null;

  const title = editItem ? "Edit Admin" : "Create Admin";

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
          {/* Profile Image and Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Profile Image
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={!formData.profileImage ? handleClick : undefined}
                className={`w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition duration-200 flex flex-col items-center justify-center ${
                  isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : ""
                } ${formData.profileImage ? "cursor-default" : ""}`}
              >
                {formData.profileImage ? (
                  <div className="relative">
                    <img
                      src={formData.profileImage}
                      alt="Profile Preview"
                      className="w-32 h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-600 transition-colors shadow-md"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Drag & drop image here or click to browse
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      Supports JPG, PNG, GIF (max 5MB)
                    </p>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
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
          </div>

          {/* Email and Password Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter Email"
                required
              />
            </div>
            <div className="relative">
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  placeholder="Enter Password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <i
                    className={`fas ${
                      showPassword ? "fa-eye" : "fa-eye-slash"
                    }`}
                  ></i>
                </button>
              </div>
            </div>
          </div>

          {/* Boolean Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isSuperAdmin"
                checked={formData.isSuperAdmin}
                onChange={handleInputChange}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
              />
              <label className="ml-3 text-base font-medium text-gray-950 dark:text-gray-200">
                Is Super Admin
              </label>
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
              {editItem ? "Update Admin" : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminsModal;

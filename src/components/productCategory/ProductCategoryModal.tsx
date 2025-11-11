import React, { useState, useEffect } from "react";
import { ProductCategory } from "../../services/productCategory/productCategory.services";                                                                                                                  

interface FormData {
  title: string;
  description: string;
  order: number;
}

interface ProductCategoryModalProps {                                   
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: FormData) => void;
  editItem?: ProductCategory;
}

const ProductCategoryModal: React.FC<ProductCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    order: 0,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (editItem) {
      setFormData({
        title: editItem.title || "",
        description: editItem.description || "",
        order: editItem.order ?? 0,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        order: 0,
      });
    }
    setErrors({});
  }, [editItem, isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (formData.order === undefined || formData.order === null || isNaN(formData.order) || formData.order < 0) {
      newErrors.order = "Order is required and must be 0 or higher";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editItem ? "Edit Product Category" : "Add Product Category"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter product category title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Enter product category description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Order <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.order === 0 ? "" : formData.order.toString()}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow digits
                if (value === "" || /^\d+$/.test(value)) {
                  setFormData({ ...formData, order: value === "" ? 0 : parseInt(value, 10) });
                }
              }}
              onBlur={(e) => {
                // Ensure the value is set to 0 if empty
                if (e.target.value === "") {
                  setFormData({ ...formData, order: 0 });
                }
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                errors.order ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter order number (0 or higher)"
            />
            {errors.order && (
              <p className="mt-1 text-sm text-red-500">{errors.order}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Lower numbers appear first in the customer panel
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              {editItem ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductCategoryModal;


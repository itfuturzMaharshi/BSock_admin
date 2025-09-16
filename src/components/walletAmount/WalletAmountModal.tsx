import React, { useState, useEffect } from "react";
import Select from "react-select";

// Define the interface for Transaction data
interface Transaction {
  customer: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: Date;
}

// Define the interface for form data
interface FormData {
  customer: string;
  type: "credit" | "debit";
  amount: string;
  description: string;
}

interface WalletAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: Transaction) => void;
  editItem?: Transaction;
}

const WalletAmountModal: React.FC<WalletAmountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
}) => {
  const [formData, setFormData] = useState<FormData>({
    customer: "",
    type: "credit",
    amount: "",
    description: "",
  });

  // Sample customers
  const customers = ["customer1", "customer2", "customer3", "customer4", "customer5"];

  // Convert customers array to react-select options
  const customerOptions = customers.map((c) => ({ label: c, value: c }));

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setFormData({
          customer: editItem.customer,
          type: editItem.type,
          amount: editItem.amount.toString(),
          description: editItem.description,
        });
      } else {
        setFormData({
          customer: "",
          type: "credit",
          amount: "",
          description: "",
        });
      }
    }
  }, [isOpen, editItem]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomerChange = (option: any) => {
    setFormData((prev) => ({
      ...prev,
      customer: option ? option.value : "",
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newItem: Transaction = {
      customer: formData.customer,
      type: formData.type as "credit" | "debit",
      amount: parseFloat(formData.amount) || 0,
      description: formData.description,
      date: editItem ? editItem.date : new Date(),
    };
    onSave(newItem);
    onClose();
  };

  if (!isOpen) return null;

  const title = editItem ? "Edit Transaction" : "Create Transaction";

  // Custom styles for react-select (matching your design)
const customSelectStyles = {
  control: (defaultStyles: any, state: any) => ({
    ...defaultStyles,
    display: "flex",
    alignItems: "center",
    minHeight: "48px",
    padding: "2px 6px",
    backgroundColor: "var(--tw-colors-gray-50)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db", // blue-500 on focus, gray-300 otherwise
    borderRadius: "0.5rem",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#9ca3af", // gray-400 on hover
    },
  }),
  placeholder: (defaultStyles: any) => ({
    ...defaultStyles,
    color: "#6b7280", // gray-500
  }),
  singleValue: (defaultStyles: any) => ({
    ...defaultStyles,
    color: "#1f2937", // gray-800
  }),
  menu: (defaultStyles: any) => ({
    ...defaultStyles,
    borderRadius: "0.5rem",
    marginTop: "4px",
    zIndex: 20,
    border: "1px solid #d1d5db", // gray-300
  }),
  option: (defaultStyles: any, state: any) => ({
    ...defaultStyles,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
      ? "#e6f0ff"
      : "white",
    color: state.isSelected ? "white" : "#1f2937",
    cursor: "pointer",
  }),
};


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[88vh] overflow-y-auto transform transition-all duration-300 scale-100 relative">
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
          {/* Customer and Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
                Customer
              </label>
              <Select
                options={customerOptions}
                value={
                  formData.customer
                    ? { label: formData.customer, value: formData.customer }
                    : null
                }
                onChange={handleCustomerChange}
                placeholder="Select Customer"
                isClearable
                isSearchable
                styles={customSelectStyles}
              />
            </div>
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
              >
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              placeholder="Enter Amount"
              required
              step="0.01"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-base font-medium text-gray-950 dark:text-gray-200 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              placeholder="Enter Description"
              rows={4}
              required
            />
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
              {editItem ? "Update Transaction" : "Create Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalletAmountModal;

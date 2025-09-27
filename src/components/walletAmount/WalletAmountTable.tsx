import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import toastHelper from "../../utils/toastHelper";
import WalletAmountModal from "./WalletAmountModal";

// Define the interface for Transaction data
interface Transaction {
  customer: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: Date;
}

const WalletAmountTable: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const itemsPerPage = 10;

  // Simulate data loading (placeholder for actual API call)
  useEffect(() => {
    setLoading(false);
  }, []);

  // Calculate unique customers and customer-specific stats
  const uniqueCustomers = [...new Set(transactions.map((t) => t.customer))];
  const customerTransactions =
    selectedCustomer === "all"
      ? transactions
      : transactions.filter((t) => t.customer === selectedCustomer);

  // Modified: Only calculate stats for a specific customer, not "all"
  const customerCredit =
    selectedCustomer !== "all"
      ? customerTransactions
          .filter((t) => t.type === "credit")
          .reduce((sum, t) => sum + t.amount, 0)
      : 0;
  const customerDebit =
    selectedCustomer !== "all"
      ? customerTransactions
          .filter((t) => t.type === "debit")
          .reduce((sum, t) => sum + t.amount, 0)
      : 0;
  const customerBalance = customerCredit - customerDebit;
  const customerStats = {
    name: selectedCustomer,
    credit: customerCredit,
    debit: customerDebit,
    balance: customerBalance,
    transactionCount: customerTransactions.length,
  };

  // Handle saving a new or edited transaction
  const handleSave = (newItem: Transaction) => {
    if (editIndex !== null) {
      const updatedData = [...transactions];
      updatedData[editIndex] = newItem;
      setTransactions(updatedData);
      setEditIndex(null);
      toastHelper.showTost("Transaction updated successfully!", "success");
    } else {
      setTransactions((prev) => [...prev, newItem]);
      toastHelper.showTost("Transaction added successfully!", "success");
    }
    setIsModalOpen(false);
  };

  // Handle editing a transaction
  const handleEdit = (index: number) => {
    setEditIndex(index);
    setIsModalOpen(true);
  };

  // Handle deleting a transaction
  const handleDelete = async (index: number) => {
    const confirmed = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the transaction!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "No, cancel!",
    });

    if (confirmed.isConfirmed) {
      const updatedData = transactions.filter((_, i) => i !== index);
      setTransactions(updatedData);
      toastHelper.showTost("Transaction deleted successfully!", "success");
    }
  };

  // Filter data by search term and selected customer
  const filteredData = transactions.filter((item) => {
    const matchesSearch =
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer =
      selectedCustomer === "all" || item.customer === selectedCustomer;
    return matchesSearch && matchesCustomer;
  });

  const totalDocs = filteredData.length;
  const totalPages = Math.ceil(totalDocs / itemsPerPage);

  // Paginate data
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCustomer]);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with Stats Cards */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Customer Credit Card */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Customer Credits
                  </p>
                </div>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  ${customerStats.credit.toLocaleString()}
                </p>
                {selectedCustomer !== "all" && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                    {selectedCustomer}
                  </p>
                )}
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
                <i className="fas fa-arrow-up text-emerald-600 dark:text-emerald-400 text-xl"></i>
              </div>
            </div>
          </div>

          {/* Customer Debit Card */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Customer Debits
                  </p>
                </div>
                <p className="text-3xl font-bold text-red-500 dark:text-red-400 mb-1">
                  ${customerStats.debit.toLocaleString()}
                </p>
                {selectedCustomer !== "all" && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {selectedCustomer !== "all"
                      ? `${customerStats.transactionCount} transactions`
                      : ""}
                  </p>
                )}
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                <i className="fas fa-arrow-down text-red-600 dark:text-red-400 text-xl"></i>
              </div>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      customerStats.balance >= 0
                        ? "bg-blue-500"
                        : "bg-orange-500"
                    }`}
                  ></div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Wallet Balance
                  </p>
                </div>
                <p
                  className={`text-3xl font-bold mb-1 ${
                    customerStats.balance >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-orange-600 dark:text-orange-400"
                  }`}
                >
                  {selectedCustomer === "all"
                    ? "$0"
                    : customerStats.balance > 0
                    ? `+$${customerStats.balance.toLocaleString()}`
                    : `-$${Math.abs(customerStats.balance).toLocaleString()}`}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  customerStats.balance >= 0
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "bg-orange-50 dark:bg-orange-900/20"
                }`}
              >
                <i
                  className={`fas fa-wallet text-xl ${
                    customerStats.balance >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-orange-600 dark:text-orange-400"
                  }`}
                ></i>
              </div>
            </div>
          </div>

          {/* Filter by Customer Card */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Filter by Customer
                </p>
              </div>
              <div className="relative flex-1">
                <i className="fas fa-filter absolute left-3 top-3 text-gray-400 text-sm"></i>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer"
                >
                  <option value="all">
                    All Customers ({uniqueCustomers.length})
                  </option>
                  {uniqueCustomers.map((customer: string) => (
                    <option key={customer} value={customer}>
                      {customer}
                    </option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        {/* Table Header with Controls */}
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-[85%]">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by customer or description..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <button
            className="inline-flex items-center gap-1 rounded-lg bg-[#0071E0] text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            onClick={() => {
              setEditIndex(null);
              setIsModalOpen(true);
            }}
          >
            <i className="fas fa-plus text-xs"></i>
            Add Transaction
          </button>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Date
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto mb-4"></div>
                      Loading Transactions...
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      No transactions found
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: Transaction, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {item.customer}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          item.type === "credit"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700"
                        }`}
                      >
                        <i
                          className={`fas ${
                            item.type === "credit"
                              ? "fa-arrow-up"
                              : "fa-arrow-down"
                          } text-xs`}
                        ></i>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <span
                        className={`font-bold ${
                          item.type === "credit"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-500 dark:text-red-400"
                        }`}
                      >
                        {item.type === "debit" ? "-" : "+"}$
                        {item.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.date.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEdit(index)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
            Showing {paginatedData.length} of {totalDocs} items
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm transition-colors"
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentPage === pageNum
                        ? "bg-[#0071E0] text-white dark:bg-blue-500 dark:text-white border border-blue-600 dark:border-blue-500"
                        : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    } transition-colors`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <WalletAmountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditIndex(null);
        }}
        onSave={handleSave}
        editItem={editIndex !== null ? transactions[editIndex] : undefined}
      />
    </div>
  );
};

export default WalletAmountTable;

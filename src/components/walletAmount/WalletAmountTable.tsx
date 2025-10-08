// import React, { useState, useEffect } from "react";
// import toastHelper from "../../utils/toastHelper";
// import WalletAmountModal from "./WalletAmountModal";
// import {
//   walletAmountService,
//   CustomerWalletData,
//   WalletTransaction,
//   ListTransactionsRequest,
// } from "../../services/walletAmount/walletAmountService";
// import {
//   CustomerService,
//   Customer,
// } from "../../services/customer/customerService";

// // Define the interface for Transaction data
// interface Transaction {
//   _id: string;
//   customerId: string;
//   customerName: string;
//   type: "credit" | "debit";
//   amount: number;
//   remark: string;
//   createdAt: string;
//   createdBy: {
//     _id: string;
//     name: string;
//     email: string;
//   };
// }

// const WalletAmountTable: React.FC = () => {
//   const [walletData, setWalletData] = useState<CustomerWalletData[]>([]);
//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
//   const [statusFilter, setStatusFilter] = useState<string>("All");
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
//   const [isViewDetailsOpen, setIsViewDetailsOpen] = useState<boolean>(false);
//   const [editIndex, setEditIndex] = useState<number | null>(null);
//   const [editingCustomer, setEditingCustomer] =
//     useState<CustomerWalletData | null>(null);
//   const [viewingCustomer, setViewingCustomer] =
//     useState<CustomerWalletData | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [totalDocs, setTotalDocs] = useState<number>(0);
//   const [totalPages, setTotalPages] = useState<number>(1);
//   const itemsPerPage = 10;

//   // Fetch wallet data on mount
//   useEffect(() => {
//     fetchWalletData();
//   }, []);

//   // Fetch transactions when filters change
//   useEffect(() => {
//     if (selectedCustomer !== "all") {
//       fetchTransactions();
//     }
//   }, [currentPage, selectedCustomer]);

//   // Fetch customers on mount
//   useEffect(() => {
//     fetchCustomers();
//   }, []);

//   // Update pagination totals when walletData, searchTerm, or statusFilter changes
//   useEffect(() => {
//     let filtered = walletData;

//     if (searchTerm.trim()) {
//       filtered = filtered.filter((item) => {
//         const matchesSearch =
//           item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           (item.businessProfile.businessName &&
//             item.businessProfile.businessName
//               .toLowerCase()
//               .includes(searchTerm.toLowerCase())) ||
//           (item.mobileNumber &&
//             item.mobileNumber.toLowerCase().includes(searchTerm.toLowerCase()));
//         return matchesSearch;
//       });
//     }

//     if (statusFilter !== "All") {
//       filtered = filtered.filter(
//         (item) =>
//           item.businessProfile.status.toLowerCase() ===
//           statusFilter.toLowerCase()
//       );
//     }

//     setTotalDocs(filtered.length);
//     setTotalPages(Math.ceil(filtered.length / itemsPerPage));
//     setCurrentPage(1);
//   }, [walletData, searchTerm, statusFilter]);

//   const fetchWalletData = async () => {
//     try {
//       setLoading(true);
//       const response = await walletAmountService.getWalletBalance();
//       setWalletData(response);
//     } catch (error) {
//       console.error("Error fetching wallet data:", error);
//       toastHelper.error("Failed to fetch wallet data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchTransactions = async () => {
//     try {
//       setLoading(true);
//       if (selectedCustomer === "all") {
//         setTransactions([]);
//         return;
//       }

//       const requestData: ListTransactionsRequest = {
//         customerId: selectedCustomer,
//         page: currentPage,
//         limit: itemsPerPage,
//       };

//       const response = await walletAmountService.listTransactions(requestData);
//       const transformedTransactions: Transaction[] = response.docs.map(
//         (transaction: WalletTransaction) => ({
//           _id: transaction._id,
//           customerId: transaction.customerId,
//           customerName:
//             customers.find((c) => c._id === transaction.customerId)?.name ||
//             "Unknown Customer",
//           type: transaction.type,
//           amount: transaction.amount,
//           remark: transaction.remark,
//           createdAt: transaction.createdAt,
//           createdBy: transaction.createdBy,
//         })
//       );

//       setTransactions(transformedTransactions);
//     } catch (error) {
//       console.error("Failed to fetch transactions:", error);
//       toastHelper.showTost("Failed to fetch transactions", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchCustomers = async () => {
//     try {
//       const customerList = await CustomerService.getAllCustomers();
//       setCustomers(customerList);
//     } catch (error) {
//       console.error("Failed to fetch customers:", error);
//       toastHelper.showTost("Failed to fetch customers", "error");
//     }
//   };

//   // Calculate wallet stats
//   const totalCustomers = walletData.length;
//   const totalWalletBalance = walletData.reduce(
//     (sum, item) => sum + parseFloat(item.walletBalance),
//     0
//   );
//   const approvedCustomers = walletData.filter(
//     (item) => item.businessProfile.status === "approved"
//   ).length;
//   const pendingCustomers = walletData.filter(
//     (item) => item.businessProfile.status === "pending"
//   ).length;
//   const rejectedCustomers = walletData.filter(
//     (item) => item.businessProfile.status === "rejected"
//   ).length;

//   const walletStats = {
//     totalCustomers,
//     totalWalletBalance,
//     approvedCustomers,
//     pendingCustomers,
//     rejectedCustomers,
//   };

//   // Handle saving a new or edited transaction
//   const handleSave = () => {
//     fetchWalletData();
//     if (selectedCustomer !== "all") {
//       fetchTransactions();
//     }
//     setEditIndex(null);
//     setEditingCustomer(null);
//     setIsModalOpen(false);
//   };

//   // Handle viewing customer details
//   const handleViewDetails = (customer: CustomerWalletData) => {
//     setViewingCustomer(customer);
//     setSelectedCustomer(customer._id);
//     setCurrentPage(1);
//     setIsViewDetailsOpen(true);
//   };

//   // Handle editing customer wallet
//   const handleEditCustomer = (customer: CustomerWalletData) => {
//     setEditingCustomer(customer);
//     setIsModalOpen(true);
//   };

//   // Utility function to convert a string to title case
//   const toTitleCase = (str: string): string => {
//     return str
//       .toLowerCase()
//       .split(" ")
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(" ");
//   };

//   // Get status styles
//   const getStatusStyles = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "approved":
//         return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700";
//       case "pending":
//         return "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700";
//       case "rejected":
//         return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700";
//       default:
//         return "";
//     }
//   };

//   // Get status icon
//   const getStatusIcon = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "approved":
//         return "fa-check-circle";
//       case "pending":
//         return "fa-clock";
//       case "rejected":
//         return "fa-times-circle";
//       default:
//         return "";
//     }
//   };

//   // Filter and paginate wallet data (client-side)
//   const filteredWalletData = walletData.filter((item) => {
//     const matchesSearch =
//       item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (item.businessProfile.businessName &&
//         item.businessProfile.businessName
//           .toLowerCase()
//           .includes(searchTerm.toLowerCase())) ||
//       (item.mobileNumber &&
//         item.mobileNumber.toLowerCase().includes(searchTerm.toLowerCase()));
//     const matchesStatus =
//       statusFilter === "All" ||
//       item.businessProfile.status.toLowerCase() === statusFilter.toLowerCase();
//     return matchesSearch && matchesStatus;
//   });

//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const paginatedData = filteredWalletData.slice(
//     startIndex,
//     startIndex + itemsPerPage
//   );

//   return (
//     <div className="p-6">
//       <link
//         rel="stylesheet"
//         href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
//       />

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//         {/* Total Customers Card */}
//         <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                 <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
//                   Total Customers
//                 </p>
//               </div>
//               <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
//                 {walletStats.totalCustomers}
//               </p>
//               <p className="text-xs text-gray-500 dark:text-gray-500">
//                 Registered users
//               </p>
//             </div>
//             <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg">
//               <i className="fas fa-users text-blue-600 dark:text-blue-400 text-lg"></i>
//             </div>
//           </div>
//         </div>

//         {/* Total Wallet Balance Card */}
//         <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
//                 <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
//                   Total Balance
//                 </p>
//               </div>
//               <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
//                 ${walletStats.totalWalletBalance.toLocaleString()}
//               </p>
//               <p className="text-xs text-gray-500 dark:text-gray-500">
//                 Across all wallets
//               </p>
//             </div>
//             <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-lg">
//               <i className="fas fa-wallet text-emerald-600 dark:text-emerald-400 text-lg"></i>
//             </div>
//           </div>
//         </div>

//         {/* Approved Customers Card */}
//         <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                 <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
//                   Approved
//                 </p>
//               </div>
//               <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
//                 {walletStats.approvedCustomers}
//               </p>
//               <p className="text-xs text-gray-500 dark:text-gray-500">
//                 Business verified
//               </p>
//             </div>
//             <div className="bg-green-50 dark:bg-green-900/20 p-2.5 rounded-lg">
//               <i className="fas fa-check-circle text-green-600 dark:text-green-400 text-lg"></i>
//             </div>
//           </div>
//         </div>

//         {/* Pending Customers Card */}
//         <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
//                 <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
//                   Pending
//                 </p>
//               </div>
//               <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
//                 {walletStats.pendingCustomers}
//               </p>
//               <p className="text-xs text-gray-500 dark:text-gray-500">
//                 Awaiting approval
//               </p>
//             </div>
//             <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2.5 rounded-lg">
//               <i className="fas fa-clock text-yellow-600 dark:text-yellow-400 text-lg"></i>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Table Container */}
//       <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
//         {/* Table Header with Controls */}
//         <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
//           <div className="flex items-center gap-3 flex-1">
//             {/* Search */}
//             <div className="relative flex-1 max-w-md">
//               <i className="fas fa-search absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
//               <input
//                 type="text"
//                 placeholder="Search by customer name, business name, or mobile..."
//                 className="pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] text-sm w-full transition-all"
//                 value={searchTerm}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   setSearchTerm(e.target.value);
//                 }}
//               />
//             </div>
//             {/* Status Filter */}
//             <div className="relative">
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="pl-3 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] text-sm min-w-[120px] appearance-none cursor-pointer"
//               >
//                 <option value="All">All Status</option>
//                 <option value="Approved">Approved</option>
//                 <option value="Pending">Pending</option>
//                 <option value="Rejected">Rejected</option>
//               </select>
//               <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
//             </div>
//           </div>

//           <button
//             className="inline-flex items-center gap-2 rounded-lg bg-[#0071E0] hover:bg-[#0061c0] text-white px-5 py-2.5 text-sm font-semibold transition-colors"
//             onClick={() => {
//               setEditIndex(null);
//               setIsModalOpen(true);
//             }}
//           >
//             <i className="fas fa-plus text-sm"></i>
//             Add Transaction
//           </button>
//         </div>

//         {/* Table */}
//         <div className="max-w-full overflow-x-auto">
//           <table className="w-full table-auto">
//             <thead className="bg-gray-50 dark:bg-gray-900">
//               <tr>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Customer Name
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Business Name
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Mobile Number
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Wallet Balance
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left flex justify-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Status
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center justify-center gap-2">
//                     Actions
//                   </div>
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//               {loading ? (
//                 <tr>
//                   <td colSpan={6} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="relative">
//                         <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200 dark:border-gray-700"></div>
//                         <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#0071E0] border-t-transparent absolute top-0 left-0"></div>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-3">
//                         Loading Wallet Data...
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : paginatedData.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
//                         <i className="fas fa-wallet text-2xl text-gray-400"></i>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
//                         No wallet data found
//                       </p>
//                       <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
//                         Try adjusting your search criteria
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 paginatedData.map((item: CustomerWalletData, index: number) => (
//                   <tr
//                     key={index}
//                     className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
//                   >
//                     <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
//                       <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 bg-[#0071E0] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
//                           {item.name.charAt(0).toUpperCase()}
//                         </div>
//                         <span>{toTitleCase(item.name)}</span>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       <div className="flex items-center gap-2">
//                         <i className="fas fa-briefcase text-gray-400 text-xs"></i>
//                         {item.businessProfile.businessName || "N/A"}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       <div className="flex items-center gap-2">
//                         <i className="fas fa-phone text-gray-400 text-xs"></i>
//                         {item.mobileNumber || "N/A"}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       <span
//                         className={`font-semibold ${
//                           parseFloat(item.walletBalance) >= 0
//                             ? "text-emerald-600 dark:text-emerald-400"
//                             : "text-red-500 dark:text-red-400"
//                         }`}
//                       >
//                         ${parseFloat(item.walletBalance).toLocaleString()}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 text-sm flex justify-center">
//                       <span
//                         className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusStyles(
//                           item.businessProfile.status
//                         )}`}
//                       >
//                         <i
//                           className={`fas ${getStatusIcon(
//                             item.businessProfile.status
//                           )} text-xs`}
//                         ></i>
//                         {toTitleCase(item.businessProfile.status)}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-center">
//                       <div className="flex items-center justify-center gap-2">
//                         <button
//                           onClick={() => handleViewDetails(item)}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-[#0071E0] dark:text-blue-400 transition-colors"
//                           title="View Details"
//                         >
//                           <i className="fas fa-eye text-xs"></i>
//                         </button>
//                         <button
//                           onClick={() => handleEditCustomer(item)}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 transition-colors"
//                           title="Edit Wallet"
//                         >
//                           <i className="fas fa-pen text-xs"></i>
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
//           <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
//             <i className="fas fa-list text-[#0071E0] text-xs"></i>
//             <span>
//               Showing{" "}
//               <span className="text-gray-800 dark:text-gray-200 font-semibold">
//                 {paginatedData.length}
//               </span>{" "}
//               of{" "}
//               <span className="text-gray-800 dark:text-gray-200 font-semibold">
//                 {totalDocs}
//               </span>{" "}
//               items
//             </span>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1 || loading}
//               className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
//             >
//               <i className="fas fa-chevron-left text-xs"></i>
//               Previous
//             </button>

//             {/* Page Numbers */}
//             <div className="flex space-x-1.5">
//               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                 const pageNum = i + 1;
//                 return (
//                   <button
//                     key={pageNum}
//                     onClick={() => setCurrentPage(pageNum)}
//                     disabled={loading}
//                     className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
//                       currentPage === pageNum
//                         ? "bg-[#0071E0] text-white"
//                         : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
//                     } disabled:opacity-50 disabled:cursor-not-allowed`}
//                   >
//                     {pageNum}
//                   </button>
//                 );
//               })}
//             </div>

//             <button
//               onClick={() =>
//                 setCurrentPage((prev) => Math.min(prev + 1, totalPages))
//               }
//               disabled={currentPage === totalPages || loading}
//               className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
//             >
//               Next
//               <i className="fas fa-chevron-right text-xs"></i>
//             </button>
//           </div>
//         </div>
//       </div>

//       <WalletAmountModal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setEditIndex(null);
//           setEditingCustomer(null);
//         }}
//         onSave={handleSave}
//         editItem={editIndex !== null ? transactions[editIndex] : undefined}
//         editCustomer={editingCustomer}
//       />

//       {/* View Details Modal */}
//       {isViewDetailsOpen && viewingCustomer && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
//             <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
//               <div className="flex items-center gap-3">
//                 <div className="w-12 h-12 bg-[#0071E0] rounded-lg flex items-center justify-center text-white font-semibold text-lg">
//                   {viewingCustomer.name.charAt(0).toUpperCase()}
//                 </div>
//                 <div>
//                   <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
//                     {toTitleCase(viewingCustomer.name)}'s Transactions
//                   </h2>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">
//                     Recent Transaction Details
//                   </p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => {
//                   setIsViewDetailsOpen(false);
//                   setViewingCustomer(null);
//                   setSelectedCustomer("all");
//                   setTransactions([]);
//                 }}
//                 className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
//               >
//                 <i className="fas fa-times text-sm"></i>
//               </button>
//             </div>

//             <div className="flex-1 overflow-y-auto p-5">
//               {/* Customer Information */}
//               <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
//                 <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200 mb-3">
//                   Customer Information
//                 </h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                       Country
//                     </label>
//                     <p className="text-sm text-gray-800 dark:text-gray-200">
//                       {viewingCustomer.businessProfile.country || "N/A"}
//                     </p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                       Wallet Balance
//                     </label>
//                     <p
//                       className={`text-sm font-semibold ${
//                         parseFloat(viewingCustomer.walletBalance) >= 0
//                           ? "text-emerald-600 dark:text-emerald-400"
//                           : "text-red-500 dark:text-red-400"
//                       }`}
//                     >
//                       ${parseFloat(viewingCustomer.walletBalance).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Transactions Section */}
//               <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
//                 <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200 mb-3">
//                   Recent Transactions
//                 </h3>
//                 {transactions.length > 0 ? (
//                   <div className="space-y-3">
//                     {transactions.slice(0, 5).map((transaction, index) => (
//                       <div
//                         key={index}
//                         className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
//                       >
//                         <div className="flex items-center gap-3">
//                           <div
//                             className={`w-8 h-8 rounded-lg flex items-center justify-center ${
//                               transaction.type === "credit"
//                                 ? "bg-emerald-50 dark:bg-emerald-900/30"
//                                 : "bg-red-50 dark:bg-red-900/30"
//                             }`}
//                           >
//                             <i
//                               className={`fas ${
//                                 transaction.type === "credit"
//                                   ? "fa-arrow-up text-emerald-600 dark:text-emerald-400"
//                                   : "fa-arrow-down text-red-600 dark:text-red-400"
//                               } text-xs`}
//                             ></i>
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
//                               {transaction.remark}
//                             </p>
//                             <p className="text-xs text-gray-500 dark:text-gray-400">
//                               {new Date(transaction.createdAt).toLocaleString()}
//                             </p>
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <p
//                             className={`text-sm font-semibold ${
//                               transaction.type === "credit"
//                                 ? "text-emerald-600 dark:text-emerald-400"
//                                 : "text-red-500 dark:text-red-400"
//                             }`}
//                           >
//                             {transaction.type === "debit" ? "-" : "+"}$
//                             {transaction.amount.toLocaleString()}
//                           </p>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="flex flex-col items-center justify-center py-8">
//                     <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
//                       <i className="fas fa-exchange-alt text-xl text-gray-400"></i>
//                     </div>
//                     <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
//                       No transactions found for this customer
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
//               <button
//                 onClick={() => {
//                   setIsViewDetailsOpen(false);
//                   setViewingCustomer(null);
//                   setSelectedCustomer("all");
//                   setTransactions([]);
//                 }}
//                 className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
//               >
//                 Close
//               </button>
//               <button
//                 onClick={() => {
//                   handleEditCustomer(viewingCustomer);
//                   setIsViewDetailsOpen(false);
//                   setViewingCustomer(null);
//                   setSelectedCustomer("all");
//                   setTransactions([]);
//                 }}
//                 className="px-4 py-2 bg-[#0071E0] hover:bg-[#0061c0] text-white rounded-lg text-sm font-medium transition-colors"
//               >
//                 Edit Wallet
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default WalletAmountTable;

import React, { useState, useEffect } from "react";
import toastHelper from "../../utils/toastHelper";
import WalletAmountModal from "./WalletAmountModal";
import {
  walletAmountService,
  CustomerWalletData,
  WalletTransaction,
  ListTransactionsRequest,
} from "../../services/walletAmount/walletAmountService";
import {
  CustomerService,
  Customer,
} from "../../services/customer/customerService";

// Define the interface for Transaction data
interface Transaction {
  _id: string;
  customerId: string;
  customerName: string;
  type: "credit" | "debit";
  amount: number;
  remark: string;
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
}

const WalletAmountTable: React.FC = () => {
  const [walletData, setWalletData] = useState<CustomerWalletData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerWalletData | null>(null);
  const [viewingCustomer, setViewingCustomer] =
    useState<CustomerWalletData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  // Fetch wallet data on mount
  useEffect(() => {
    fetchWalletData();
  }, []);

  // Fetch transactions when filters change
  useEffect(() => {
    if (selectedCustomer !== "all") {
      fetchTransactions();
    }
  }, [currentPage, selectedCustomer]);

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Update pagination totals when walletData, searchTerm, or statusFilter changes
  useEffect(() => {
    let filtered = walletData;

    if (searchTerm.trim()) {
      filtered = filtered.filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.businessProfile.businessName &&
            item.businessProfile.businessName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (item.mobileNumber &&
            item.mobileNumber.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
      });
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (item) =>
          item.businessProfile.status.toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    setTotalDocs(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  }, [walletData, searchTerm, statusFilter]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await walletAmountService.getWalletBalance();
      setWalletData(response);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toastHelper.error("Failed to fetch wallet data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      if (selectedCustomer === "all") {
        setTransactions([]);
        return;
      }

      const requestData: ListTransactionsRequest = {
        customerId: selectedCustomer,
        page: currentPage,
        limit: itemsPerPage,
      };

      const response = await walletAmountService.listTransactions(requestData);
      const transformedTransactions: Transaction[] = response.docs.map(
        (transaction: WalletTransaction) => ({
          _id: transaction._id,
          customerId: transaction.customerId,
          customerName:
            customers.find((c) => c._id === transaction.customerId)?.name ||
            "Unknown Customer",
          type: transaction.type,
          amount: transaction.amount,
          remark: transaction.remark,
          createdAt: transaction.createdAt,
          createdBy: transaction.createdBy,
        })
      );

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toastHelper.showTost("Failed to fetch transactions", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const customerList = await CustomerService.getAllCustomers();
      setCustomers(customerList);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toastHelper.showTost("Failed to fetch customers", "error");
    }
  };

  // Calculate wallet stats
  const totalCustomers = walletData.length;
  const totalWalletBalance = walletData.reduce(
    (sum, item) => sum + parseFloat(item.walletBalance),
    0
  );
  const approvedCustomers = walletData.filter(
    (item) => item.businessProfile.status === "approved"
  ).length;
  const pendingCustomers = walletData.filter(
    (item) => item.businessProfile.status === "pending"
  ).length;
  const rejectedCustomers = walletData.filter(
    (item) => item.businessProfile.status === "rejected"
  ).length;

  const walletStats = {
    totalCustomers,
    totalWalletBalance,
    approvedCustomers,
    pendingCustomers,
    rejectedCustomers,
  };

  // Handle saving a new or edited transaction
  const handleSave = () => {
    fetchWalletData();
    if (selectedCustomer !== "all") {
      fetchTransactions();
    }
    setEditIndex(null);
    setEditingCustomer(null);
    setIsModalOpen(false);
  };

  // Handle viewing customer details
  const handleViewDetails = (customer: CustomerWalletData) => {
    setViewingCustomer(customer);
    setSelectedCustomer(customer._id);
    setCurrentPage(1);
    setIsViewDetailsOpen(true);
  };

  // Handle editing customer wallet
  const handleEditCustomer = (customer: CustomerWalletData) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  // Utility function to convert a string to title case
  const toTitleCase = (str: string): string => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get status styles
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200/50 dark:border-green-800/50";
      case "pending":
        return "bg-yellow-100/50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 border border-yellow-200/50 dark:border-yellow-800/50";
      case "rejected":
        return "bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200/50 dark:border-red-800/50";
      default:
        return "bg-gray-100/50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800/50";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "fa-check-circle";
      case "pending":
        return "fa-clock";
      case "rejected":
        return "fa-times-circle";
      default:
        return "fa-circle";
    }
  };

  // Filter and paginate wallet data (client-side)
  const filteredWalletData = walletData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.businessProfile.businessName &&
        item.businessProfile.businessName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (item.mobileNumber &&
        item.mobileNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "All" ||
      item.businessProfile.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredWalletData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="p-6 dark:bg-gray-950 min-h-screen font-sans">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Customers Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Total Customers
              </p>
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {walletStats.totalCustomers}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Registered users
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-blue-600 dark:text-blue-400 text-lg"></i>
            </div>
          </div>
        </div>

        {/* Total Wallet Balance Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Total Balance
              </p>
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
                ${walletStats.totalWalletBalance.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Across all wallets
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100/50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <i className="fas fa-wallet text-green-600 dark:text-green-400 text-lg"></i>
            </div>
          </div>
        </div>

        {/* Approved Customers Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Approved
              </p>
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {walletStats.approvedCustomers}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Business verified
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100/50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600 dark:text-green-400 text-lg"></i>
            </div>
          </div>
        </div>

        {/* Pending Customers Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Pending
              </p>
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {walletStats.pendingCustomers}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Awaiting approval
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <i className="fas fa-clock text-yellow-600 dark:text-yellow-400 text-lg"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
        {/* Table Header with Controls */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <i className="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  type="text"
                  placeholder="Search by customer name, business name, or mobile..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] transition-all duration-300 text-sm placeholder-gray-400 shadow-sm"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(e.target.value);
                  }}
                />
              </div>
              <div className="relative max-w-sm">
                <i className="fas fa-filter absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] transition-all duration-300 text-sm appearance-none cursor-pointer shadow-sm"
                >
                  <option value="All">All Status</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"></i>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0071E0] hover:bg-[#005BB5] text-white text-sm font-medium transition-all duration-200 shadow-sm hover:shadow"
              onClick={() => {
                setEditIndex(null);
                setIsModalOpen(true);
              }}
            >
              <i className="fas fa-plus text-sm"></i>
              Add Transaction
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                {[
                  "Customer Name",
                  "Business Name",
                  "Mobile Number",
                  "Wallet Balance",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className={`px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      header === "Actions" || header ==="Status" ? "text-center" : "text-left"
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 dark:border-gray-700"></div>
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0071E0] border-t-transparent absolute top-0 left-0"></div>
                      </div>
                      <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Loading Wallet Data...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="w-14 h-14 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-wallet text-xl text-gray-400"></i>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                        No wallet data found
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: CustomerWalletData, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-200"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0071E0] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{toTitleCase(item.name)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-briefcase text-gray-400 text-xs"></i>
                        {item.businessProfile.businessName || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-phone text-gray-400 text-xs"></i>
                        {item.mobileNumber || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`font-semibold ${
                          parseFloat(item.walletBalance) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        ${parseFloat(item.walletBalance).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${getStatusStyles(
                          item.businessProfile.status
                        )}`}
                      >
                        <i
                          className={`fas ${getStatusIcon(
                            item.businessProfile.status
                          )} text-xs`}
                        ></i>
                        {toTitleCase(item.businessProfile.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0071E0]/10 hover:bg-[#0071E0]/20 dark:bg-[#0071E0]/20 dark:hover:bg-[#0071E0]/30 text-[#0071E0] dark:text-[#0071E0] transition-all duration-200 shadow-sm hover:shadow"
                          title="View Details"
                        >
                          <i className="fas fa-eye text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleEditCustomer(item)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-100/50 hover:bg-green-200/50 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-all duration-200 shadow-sm hover:shadow"
                          title="Edit Wallet"
                        >
                          <i className="fas fa-pen text-sm"></i>
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
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-t border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
            <i className="fas fa-list text-[#0071E0] text-sm"></i>
            <span>
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {((currentPage - 1) * itemsPerPage) + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {Math.min(currentPage * itemsPerPage, totalDocs)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {totalDocs}
              </span>{" "}
              items
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-sm"
            >
              <i className="fas fa-chevron-left text-sm"></i>
              Previous
            </button>
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                      currentPage === pageNum
                        ? "bg-[#0071E0] text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
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
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-sm"
            >
              Next
              <i className="fas fa-chevron-right text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      <WalletAmountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditIndex(null);
          setEditingCustomer(null);
        }}
        onSave={handleSave}
        editItem={editIndex !== null ? transactions[editIndex] : undefined}
        editCustomer={editingCustomer}
      />

      {/* View Details Modal */}
      {isViewDetailsOpen && viewingCustomer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0071E0] rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                    {viewingCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      {toTitleCase(viewingCustomer.name)}'s Transactions
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Recent Transaction Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsViewDetailsOpen(false);
                    setViewingCustomer(null);
                    setSelectedCustomer("all");
                    setTransactions([]);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0071E0]/10 hover:bg-[#0071E0]/20 dark:bg-[#0071E0]/20 dark:hover:bg-[#0071E0]/30 text-[#0071E0] dark:text-[#0071E0] transition-all duration-200 shadow-sm hover:shadow"
                >
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-6">
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                    Customer Information
                  </h3>
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-800/50 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Country
                        </label>
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {viewingCustomer.businessProfile.country || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Wallet Balance
                        </label>
                        <p
                          className={`text-sm font-semibold ${
                            parseFloat(viewingCustomer.walletBalance) >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          $
                          {parseFloat(viewingCustomer.walletBalance).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transactions Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                    Recent Transactions
                  </h3>
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-800/50 rounded-lg">
                    {transactions.length > 0 ? (
                      <div className="space-y-3">
                        {transactions.slice(0, 5).map((transaction, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200/50 dark:border-gray-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  transaction.type === "credit"
                                    ? "bg-green-100/50 dark:bg-green-900/20"
                                    : "bg-red-100/50 dark:bg-red-900/20"
                                }`}
                              >
                                <i
                                  className={`fas ${
                                    transaction.type === "credit"
                                      ? "fa-arrow-up text-green-600 dark:text-green-400"
                                      : "fa-arrow-down text-red-600 dark:text-red-400"
                                  } text-xs`}
                                ></i>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  {transaction.remark}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(transaction.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-sm font-semibold ${
                                  transaction.type === "credit"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {transaction.type === "debit" ? "-" : "+"}$
                                {transaction.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-14 h-14 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                          <i className="fas fa-exchange-alt text-xl text-gray-400"></i>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                          No transactions found for this customer
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 sticky bottom-0">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsViewDetailsOpen(false);
                    setViewingCustomer(null);
                    setSelectedCustomer("all");
                    setTransactions([]);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 text-sm font-medium shadow-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleEditCustomer(viewingCustomer);
                    setIsViewDetailsOpen(false);
                    setViewingCustomer(null);
                    setSelectedCustomer("all");
                    setTransactions([]);
                  }}
                  className="px-4 py-2 bg-[#0071E0] hover:bg-[#005BB5] text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow"
                >
                  Edit Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletAmountTable;
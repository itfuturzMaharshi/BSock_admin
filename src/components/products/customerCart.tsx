// import React, { useState, useEffect } from "react";
// import Swal from "sweetalert2";
// import { format } from "date-fns";
// import toastHelper from "../../utils/toastHelper";
// import CustomerCartService, {
//   CustomerCartItem,
//   CartProduct,
// } from "../../services/order/customerCart.services";

// // Interface for Customer Cart data
// interface Customer {
//   _id: string;
//   name: string;
//   email: string;
//   phone?: string;
//   address?: string;
// }

// type CustomerCart = CustomerCartItem & { updatedAt?: string };

// const CustomerCart: React.FC = () => {
//   const [customerCartsData, setCustomerCartsData] = useState<CustomerCart[]>(
//     []
//   );
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [selectedCustomer, setSelectedCustomer] = useState<string>("");
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [totalDocs, setTotalDocs] = useState<number>(0);
//   const [totalPages, setTotalPages] = useState<number>(1);
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [previewItem, setPreviewItem] = useState<CustomerCart | null>(null);
//   const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
//   const itemsPerPage = 10;

//   useEffect(() => {
//     fetchCustomerCarts();
//   }, [currentPage, searchTerm, selectedCustomer]);

//   useEffect(() => {
//     fetchCustomers();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const fetchCustomerCarts = async () => {
//     try {
//       setLoading(true);
//       const response = await CustomerCartService.getCustomerCartList(
//         currentPage,
//         itemsPerPage,
//         searchTerm,
//         selectedCustomer
//       );
//       const docs = (response?.data?.docs || []) as any[];
//       const mapped: CustomerCart[] = docs.map((d: any) => ({
//         _id: d._id,
//         customer: {
//           _id: d.customerId?._id || "",
//           name: d.customerId?.name || "",
//           email: d.customerId?.email || "",
//         },
//         product: {
//           _id: d.productId?._id || "",
//           skuFamilyId: d.skuFamilyId || null,
//           simType: d.simType,
//           color: d.color,
//           ram: d.ram,
//           storage: d.storage,
//           condition: d.condition,
//           price: d.price ?? d.productId?.price ?? 0,
//           stock: d.stock,
//           country: d.country,
//           moq: d.moq,
//           isNegotiable: d.isNegotiable,
//           isFlashDeal: d.isFlashDeal,
//           expiryTime: d.expiryTime,
//           specification: d.specification ?? null,
//           purchaseType: d.purchaseType,
//           isApproved: d.isApproved,
//           isDeleted: d.isDeleted,
//         },
//         quantity: parseFloat(String(d.quantity)) || 0,
//         addedAt: d.createdAt || d.updatedAt || "",
//         updatedAt: d.updatedAt || "",
//         status: d.isActive ? "active" : "removed",
//         notes: undefined,
//       }));

//       const nTotalDocs =
//         parseInt(String(response?.data?.totalDocs || 0)) || mapped.length;
//       const nTotalPages =
//         parseInt(String(response?.data?.totalPages || 1)) || 1;

//       setCustomerCartsData(mapped);
//       setTotalDocs(nTotalDocs);
//       setTotalPages(nTotalPages);
//     } catch (error) {
//       console.error("Failed to fetch customer carts:", error);
//       toastHelper.showTost(
//         (error as any)?.message || "Failed to fetch customer carts",
//         "error"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchCustomers = async () => {
//     try {
//       const resp = await CustomerCartService.getCustomerCartList(1, 10);
//       const docs = (resp?.data?.docs || []) as any[];
//       const uniqueMap = new Map<string, Customer>();
//       for (const d of docs) {
//         const c = d?.customerId;
//         if (c?._id && !uniqueMap.has(c._id)) {
//           uniqueMap.set(c._id, { _id: c._id, name: c.name, email: c.email });
//         }
//       }
//       setCustomers(Array.from(uniqueMap.values()));
//     } catch (error) {
//       console.error("Failed to fetch customers:", error);
//       toastHelper.showTost(
//         (error as any)?.message || "Failed to fetch customers",
//         "error"
//       );
//     }
//   };

//   const handleRemoveFromCart = async (cartItem: CustomerCart) => {
//     if (!cartItem._id) return;

//     const confirmed = await Swal.fire({
//       title: "Remove from Cart?",
//       text: "This will remove the item from customer's cart!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, remove it!",
//       cancelButtonText: "No, cancel!",
//     });

//     if (confirmed.isConfirmed) {
//       try {
//         // Replace with your actual API call
//         // await CustomerCartService.removeFromCart(cartItem._id);

//         toastHelper.showTost("Item removed from cart successfully!", "success");
//         fetchCustomerCarts();
//       } catch (error) {
//         console.error("Failed to remove item from cart:", error);
//         toastHelper.showTost("Failed to remove item from cart!", "error");
//       }
//     }
//   };

//   const handlePreview = (cartItem: CustomerCart) => {
//     setPreviewItem(cartItem);
//     setIsPreviewModalOpen(true);
//   };

//   const getProductTitle = (productOrSku: any): string => {
//     const product: any = productOrSku && productOrSku._id ? productOrSku : null;
//     if (product) {
//       const spec = product.specification;
//       if (spec === null || spec === undefined || String(spec).trim() === "") {
//         return "N/A";
//       }
//       return String(spec);
//     }
//     return "";
//   };

//   const buildImageUrl = (relativeOrAbsolute: string): string => {
//     if (!relativeOrAbsolute)
//       return "https://via.placeholder.com/60x60?text=Product";
//     const isAbsolute = /^https?:\/\//i.test(relativeOrAbsolute);
//     if (isAbsolute) return relativeOrAbsolute;
//     const base = import.meta.env.VITE_BASE_URL || "";
//     return `${base}${
//       relativeOrAbsolute.startsWith("/") ? "" : "/"
//     }${relativeOrAbsolute}`;
//   };

//   const getProductImageSrc = (product: CartProduct): string => {
//     try {
//       const sku = product?.skuFamilyId as any;
//       const first =
//         Array.isArray(sku?.images) && sku.images.length > 0
//           ? sku.images[0]
//           : "";
//       if (first) return buildImageUrl(first);
//     } catch (_) {}
//     return "https://via.placeholder.com/60x60?text=Product";
//   };

//   const formatPrice = (price: number | string): string => {
//     if (typeof price === "string") {
//       const num = parseFloat(price);
//       return isNaN(num) ? "0.00" : num.toFixed(2);
//     }
//     return price.toFixed(2);
//   };

//   const formatDate = (dateString: string): string => {
//     if (!dateString) return "-";
//     try {
//       const date = new Date(dateString);
//       return format(date, "yyyy-MM-dd HH:mm");
//     } catch {
//       return "-";
//     }
//   };

//   const toTitleCase = (str: string): string => {
//     if (!str) return str;
//     return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
//   };

//   const getStatusStyles = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "active":
//         return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700";
//       case "removed":
//         return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700";
//       case "ordered":
//         return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700";
//       default:
//         return "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-700";
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "active":
//         return "fa-check-circle";
//       case "removed":
//         return "fa-times-circle";
//       case "ordered":
//         return "fa-shopping-cart";
//       default:
//         return "fa-circle";
//     }
//   };

//   return (
//     <div className="p-6">
//       <link
//         rel="stylesheet"
//         href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
//       />

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
//                 placeholder="Search by product title..."
//                 className="pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] text-sm w-full transition-all"
//                 value={searchTerm}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   setSearchTerm(e.target.value);
//                   setCurrentPage(1);
//                 }}
//               />
//             </div>

//             {/* Customer Filter (Right side) */}
//             <div className="relative ml-auto">
//               <i className="fas fa-user absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
//               <select
//                 className="pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] text-sm min-w-48 appearance-none cursor-pointer transition-all"
//                 value={selectedCustomer}
//                 onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
//                   setSelectedCustomer(e.target.value);
//                   setCurrentPage(1);
//                 }}
//               >
//                 <option value="">All Customers</option>
//                 {customers.map((customer) => (
//                   <option key={customer._id} value={customer._id}>
//                     {customer.name}
//                   </option>
//                 ))}
//               </select>
//               <i className="fas fa-chevron-down absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="max-w-full overflow-x-auto">
//           <table className="w-full table-auto">
//             <thead className="bg-gray-50 dark:bg-gray-900">
//               <tr>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">Product Details</div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Customer Details
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">Quantity</div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">Status</div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">Added Date</div>
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
//                         Loading Customer Carts...
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : customerCartsData.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
//                         <i className="fas fa-shopping-cart text-2xl text-gray-400"></i>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
//                         No customer carts found
//                       </p>
//                       <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
//                         Try adjusting your search criteria
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 customerCartsData.map((item: CustomerCart, index: number) => (
//                   <tr
//                     key={item._id || index}
//                     className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
//                   >
//                     {/* Product Details Column */}
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-4">
//                         <img
//                           src={getProductImageSrc(item.product)}
//                           alt={getProductTitle(item.product)}
//                           className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-600 flex-shrink-0"
//                           onError={(e) => {
//                             e.currentTarget.src =
//                               "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAQhoZ9wi9UzWyWDidI7NIP2qPzL4dGE6k9w&s";
//                           }}
//                         />
//                         <div className="min-w-0 flex-1">
//                           <h3
//                             className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate"
//                             title={getProductTitle(item.product)}
//                           >
//                             {getProductTitle(item.product)}
//                           </h3>
//                           <div className="mt-1 flex flex-col items-start gap-1 text-xs text-gray-600 dark:text-gray-400">
//                             {item.product.color && (
//                               <span className="flex items-center gap-1">
//                                 <label className="font-bold">Color :</label>
//                                 <span title={item.product.color}>
//                                   {item.product.color}
//                                 </span>
//                               </span>
//                             )}
//                             <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
//                               <i className="fas fa-dollar-sign text-xs"></i>
//                               <span
//                                 title={`${formatPrice(item.product.price)}`}
//                               >
//                                 {formatPrice(item.product.price)}
//                               </span>
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     </td>

//                     {/* Customer Details Column */}
//                     <td className="px-6 py-4 text-sm">
//                       <div className="space-y-1">
//                         <h4 className="font-medium text-gray-800 dark:text-gray-200">
//                           {item.customer.name}
//                         </h4>
//                         <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
//                           <i className="fas fa-at text-gray-400 text-xs"></i>
//                           {item.customer.email}
//                         </p>
//                       </div>
//                     </td>

//                     {/* Quantity Column */}
//                     <td className="px-6 py-4 text-sm">
//                       <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-[#0071E0] dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
//                         {item.quantity}
//                       </span>
//                     </td>

//                     {/* Status Column */}
//                     <td className="px-6 py-4 text-sm">
//                       <span
//                         className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusStyles(
//                           item.status
//                         )}`}
//                       >
//                         <i
//                           className={`fas ${getStatusIcon(
//                             item.status
//                           )} text-xs`}
//                         ></i>
//                         {toTitleCase(item.status)}
//                       </span>
//                     </td>

//                     {/* Added Date Column */}
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       <div className="flex items-center gap-2">
//                         <i className="fas fa-clock text-gray-400 text-xs"></i>
//                         {formatDate(item.addedAt)}
//                       </div>
//                     </td>

//                     {/* Actions Column */}
//                     <td className="px-6 py-4 text-sm text-center">
//                       <div className="flex items-center justify-center gap-2">
//                         <button
//                           onClick={() => handlePreview(item)}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-[#0071E0] dark:text-blue-400 transition-colors"
//                           title="Preview Details"
//                         >
//                           <i className="fas fa-eye text-xs"></i>
//                         </button>
//                         <button
//                           onClick={() => handleRemoveFromCart(item)}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors"
//                           title="Remove from Cart"
//                         >
//                           <i className="fas fa-trash text-xs"></i>
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
//                 {customerCartsData.length}
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

//       {/* Preview Modal */}
//       {isPreviewModalOpen && previewItem && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
//           <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
//             {/* Header */}
//             <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
//               <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
//                   Cart Item Details
//                 </h2>
//                 <button
//                   type="button"
//                   onClick={() => setIsPreviewModalOpen(false)}
//                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
//                 >
//                   <svg
//                     className="w-5 h-5"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M6 18L18 6M6 6l12 12"
//                     />
//                   </svg>
//                 </button>
//               </div>
//             </div>

//             {/* Scrollable Content */}
//             <div className="overflow-y-auto flex-1 px-6 py-4">
//               <div className="space-y-6">
//                 {/* Product Information */}
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
//                     Product Information
//                   </h3>
//                   <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
//                     <div className="flex items-start gap-4">
//                       <img
//                         src={getProductImageSrc(previewItem.product)}
//                         alt={getProductTitle(previewItem.product)}
//                         className="w-16 h-16 object-contain rounded-md border border-gray-200 dark:border-gray-600 bg-white"
//                         onError={(e) => {
//                           e.currentTarget.src =
//                             "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAQhoZ9wi9UzWyWDidI7NIP2qPzL4dGE6k9w&s";
//                         }}
//                       />
//                       <div className="flex-1">
//                         <h4 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
//                           {getProductTitle(previewItem.product)}
//                         </h4>
//                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
//                           {previewItem.product.simType && (
//                             <div className="flex justify-left gap-1">
//                               <span className="text-gray-800 dark:text-gray-200">
//                                 SIM Type:
//                               </span>
//                               <span className="text-gray-600 dark:text-gray-400">
//                                 {previewItem.product.simType}
//                               </span>
//                             </div>
//                           )}
//                           {previewItem.product.color && (
//                             <div className="flex justify-left gap-1">
//                               <span className="text-gray-800 dark:text-gray-200">
//                                 Color:
//                               </span>
//                               <span className="text-gray-600 dark:text-gray-400">
//                                 {previewItem.product.color}
//                               </span>
//                             </div>
//                           )}
//                           {previewItem.product.ram && (
//                             <div className="flex justify-left gap-1">
//                               <span className="text-gray-800 dark:text-gray-200">
//                                 RAM:
//                               </span>
//                               <span className="text-gray-600 dark:text-gray-400">
//                                 {previewItem.product.ram}
//                               </span>
//                             </div>
//                           )}
//                           {previewItem.product.storage && (
//                             <div className="flex justify-left gap-1">
//                               <span className="text-gray-800 dark:text-gray-200">
//                                 Storage:
//                               </span>
//                               <span className="text-gray-600 dark:text-gray-400">
//                                 {previewItem.product.storage}
//                               </span>
//                             </div>
//                           )}
//                           {previewItem.product.specification && (
//                             <div className="flex justify-left gap-1">
//                               <span className="text-gray-800 dark:text-gray-200">
//                                 Specification:
//                               </span>
//                               <span className="text-gray-600 dark:text-gray-400">
//                                 {previewItem.product.specification}
//                               </span>
//                             </div>
//                           )}
//                           <div className="flex justify-left gap-1">
//                             <span className="text-gray-800 dark:text-gray-200">
//                               Condition:
//                             </span>
//                             <span className="text-gray-600 dark:text-gray-400">
//                               {previewItem.product.condition}
//                             </span>
//                           </div>
//                           <div className="flex justify-left gap-1">
//                             <span className="text-gray-800 dark:text-gray-200">
//                               Price:
//                             </span>
//                             <span className="text-green-600 dark:text-green-200 font-medium">
//                               ${formatPrice(previewItem.product.price)}
//                             </span>
//                           </div>
//                           <div className="flex justify-left gap-1">
//                             <span className="text-gray-800 dark:text-gray-200">
//                               Stock:
//                             </span>
//                             <span className="text-gray-600 dark:text-gray-400">
//                               {previewItem.product.stock}
//                             </span>
//                           </div>
//                           <div className="flex justify-left gap-1">
//                             <span className="text-gray-800 dark:text-gray-200">
//                               Country:
//                             </span>
//                             <span className="text-gray-600 dark:text-gray-400">
//                               {previewItem.product.country}
//                             </span>
//                           </div>
//                           <div className="flex justify-left gap-1">
//                             <span className="text-gray-800 dark:text-gray-200">
//                               MOQ:
//                             </span>
//                             <span className="text-gray-600 dark:text-gray-400">
//                               {previewItem.product.moq}
//                             </span>
//                           </div>
//                           {previewItem.product.purchaseType && (
//                             <div className="flex justify-left gap-1">
//                               <span className="text-gray-800 dark:text-gray-200">
//                                 Purchase Type:
//                               </span>
//                               <span className="text-gray-600 dark:text-gray-400 capitalize">
//                                 {previewItem.product.purchaseType}
//                               </span>
//                             </div>
//                           )}
//                           <div className="flex justify-left gap-1">
//                             <span className="text-gray-800 dark:text-gray-200">
//                               Negotiable:
//                             </span>
//                             <span
//                               className={`${
//                                 previewItem.product.isNegotiable
//                                   ? "text-green-600 dark:text-green-400"
//                                   : "text-red-600 dark:text-red-400"
//                               }`}
//                             >
//                               {previewItem.product.isNegotiable ? "Yes" : "No"}
//                             </span>
//                           </div>
//                           <div className="flex justify-left gap-1">
//                             <span className="text-gray-800 dark:text-gray-200">
//                               Flash Deal:
//                             </span>
//                             <span
//                               className={`${
//                                 previewItem.product.isFlashDeal === true ||
//                                 previewItem.product.isFlashDeal === "true"
//                                   ? "text-green-600 dark:text-green-400"
//                                   : "text-red-600 dark:text-red-400"
//                               }`}
//                             >
//                               {previewItem.product.isFlashDeal === true ||
//                               previewItem.product.isFlashDeal === "true"
//                                 ? "Yes"
//                                 : "No"}
//                             </span>
//                           </div>
//                           {previewItem.product.expiryTime && (
//                             <div className="flex justify-left gap-1">
//                               <span className="text-gray-800 dark:text-gray-200">
//                                 Expires:
//                               </span>
//                               <span className="text-gray-600 dark:text-gray-400">
//                                 {formatDate(previewItem.product.expiryTime)}
//                               </span>
//                             </div>
//                           )}
//                           {typeof previewItem.product.isApproved !==
//                             "undefined" && (
//                             <div className="flex justify-left gap-1">
//                               <span className="text-gray-800 dark:text-gray-200">
//                                 Approved:
//                               </span>
//                               <span
//                                 className={`${
//                                   previewItem.product.isApproved
//                                     ? "text-green-600 dark:text-green-400"
//                                     : "text-red-600 dark:text-red-400"
//                                 }`}
//                               >
//                                 {previewItem.product.isApproved ? "Yes" : "No"}
//                               </span>
//                             </div>
//                           )}
//                           {typeof previewItem.product.isDeleted !==
//                             "undefined" && (
//                             <div className="flex justify-left gap-1">
//                               <span className="text-gray-800 dark:text-gray-200">
//                                 Deleted:
//                               </span>
//                               <span
//                                 className={`${
//                                   previewItem.product.isDeleted
//                                     ? "text-red-600 dark:text-red-400"
//                                     : "text-green-600 dark:text-green-400"
//                                 }`}
//                               >
//                                 {previewItem.product.isDeleted ? "Yes" : "No"}
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Customer Information */}
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
//                     Customer Information
//                   </h3>
//                   <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//                       {/* Name */}
//                       <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
//                           <svg
//                             className="w-5 h-5 text-gray-600 dark:text-gray-300"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                             />
//                           </svg>
//                         </div>
//                         <div>
//                           <div className="text-gray-800 dark:text-gray-200 font-medium">
//                             {previewItem.customer.name}
//                           </div>
//                           <div className="text-xs text-gray-500 dark:text-gray-400">
//                             Customer Name
//                           </div>
//                         </div>
//                       </div>

//                       {/* Email */}
//                       <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
//                           <svg
//                             className="w-5 h-5 text-gray-600 dark:text-gray-300"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
//                             />
//                           </svg>
//                         </div>
//                         <div>
//                           <div className="text-gray-800 dark:text-gray-200 font-medium">
//                             {previewItem.customer.email}
//                           </div>
//                           <div className="text-xs text-gray-500 dark:text-gray-400">
//                             Email Address
//                           </div>
//                         </div>
//                       </div>

//                       {/* Phone */}
//                       {previewItem.customer.phone && (
//                         <div className="flex items-center gap-3">
//                           <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
//                             <svg
//                               className="w-5 h-5 text-gray-600 dark:text-gray-300"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
//                               />
//                             </svg>
//                           </div>
//                           <div>
//                             <div className="text-gray-800 dark:text-gray-200 font-medium">
//                               {previewItem.customer.phone}
//                             </div>
//                             <div className="text-xs text-gray-500 dark:text-gray-400">
//                               Phone Number
//                             </div>
//                           </div>
//                         </div>
//                       )}

//                       {/* Address */}
//                       {previewItem.customer.address && (
//                         <div className="flex items-start gap-3">
//                           <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mt-1">
//                             <svg
//                               className="w-5 h-5 text-gray-600 dark:text-gray-300"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
//                               />
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
//                               />
//                             </svg>
//                           </div>
//                           <div>
//                             <div className="text-gray-800 dark:text-gray-200 font-medium">
//                               {previewItem.customer.address}
//                             </div>
//                             <div className="text-xs text-gray-500 dark:text-gray-400">
//                               Address
//                             </div>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Cart Statistics */}
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
//                     Cart Statistics
//                   </h3>
//                   <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//                     <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                       <div className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
//                         {previewItem.quantity}
//                       </div>
//                       <div className="text-xs text-gray-500 dark:text-gray-400">
//                         Quantity
//                       </div>
//                     </div>

//                     <div
//                       className={`text-center p-4 rounded-lg border ${
//                         previewItem.status === "active"
//                           ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
//                           : previewItem.status === "removed"
//                           ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
//                           : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
//                       }`}
//                     >
//                       <div
//                         className={`text-lg font-semibold mb-1 capitalize ${
//                           previewItem.status === "active"
//                             ? "text-green-600 dark:text-green-400"
//                             : previewItem.status === "removed"
//                             ? "text-red-600 dark:text-red-400"
//                             : "text-blue-600 dark:text-blue-400"
//                         }`}
//                       >
//                         {toTitleCase(previewItem.status)}
//                       </div>
//                       <div className="text-xs text-gray-500 dark:text-gray-400">
//                         Status
//                       </div>
//                     </div>

//                     <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                       <div className="text-lg font-semibold text-green-600 dark:text-green-400 mb-1">
//                         $
//                         {(
//                           (parseFloat(String(previewItem.product.price)) || 0) *
//                           previewItem.quantity
//                         ).toFixed(2)}
//                       </div>
//                       <div className="text-xs text-gray-500 dark:text-gray-400">
//                         Total Value
//                       </div>
//                     </div>

//                     <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                       <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
//                         {formatDate(previewItem.addedAt)}
//                       </div>
//                       <div className="text-xs text-gray-500 dark:text-gray-400">
//                         Added Date
//                       </div>
//                     </div>

//                     <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                       <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
//                         {formatDate(
//                           previewItem.updatedAt || previewItem.addedAt
//                         )}
//                       </div>
//                       <div className="text-xs text-gray-500 dark:text-gray-400">
//                         Updated Date
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Notes Section */}
//                 {previewItem.notes && (
//                   <div>
//                     <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
//                       Notes
//                     </h3>
//                     <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
//                       <p className="text-gray-700 dark:text-gray-300 text-sm">
//                         {previewItem.notes}
//                       </p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky bottom-0">
//               <div className="flex justify-end">
//                 <button
//                   onClick={() => setIsPreviewModalOpen(false)}
//                   className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 text-sm"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CustomerCart;


import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { format } from "date-fns";
import toastHelper from "../../utils/toastHelper";
import CustomerCartService, {
  CustomerCartItem,
  CartProduct,
} from "../../services/order/customerCart.services";

// Interface for Customer Cart data
interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

type CustomerCart = CustomerCartItem & { updatedAt?: string };

const CustomerCart: React.FC = () => {
  const [customerCartsData, setCustomerCartsData] = useState<CustomerCart[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [previewItem, setPreviewItem] = useState<CustomerCart | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomerCarts();
  }, [currentPage, searchTerm, selectedCustomer]);

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomerCarts = async () => {
    try {
      setLoading(true);
      const response = await CustomerCartService.getCustomerCartList(
        currentPage,
        itemsPerPage,
        searchTerm,
        selectedCustomer
      );
      const docs = (response?.data?.docs || []) as any[];
      const mapped: CustomerCart[] = docs.map((d: any) => ({
        _id: d._id,
        customer: {
          _id: d.customerId?._id || "",
          name: d.customerId?.name || "",
          email: d.customerId?.email || "",
        },
        product: {
          _id: d.productId?._id || "",
          skuFamilyId: d.skuFamilyId || null,
          simType: d.simType,
          color: d.color,
          ram: d.ram,
          storage: d.storage,
          condition: d.condition,
          price: d.price ?? d.productId?.price ?? 0,
          stock: d.stock,
          country: d.country,
          moq: d.moq,
          isNegotiable: d.isNegotiable,
          isFlashDeal: d.isFlashDeal,
          expiryTime: d.expiryTime,
          specification: d.specification ?? null,
          purchaseType: d.purchaseType,
          isApproved: d.isApproved,
          isDeleted: d.isDeleted,
        },
        quantity: parseFloat(String(d.quantity)) || 0,
        addedAt: d.createdAt || d.updatedAt || "",
        updatedAt: d.updatedAt || "",
        status: d.isActive ? "active" : "removed",
        notes: undefined,
      }));

      const nTotalDocs =
        parseInt(String(response?.data?.totalDocs || 0)) || mapped.length;
      const nTotalPages =
        parseInt(String(response?.data?.totalPages || 1)) || 1;

      setCustomerCartsData(mapped);
      setTotalDocs(nTotalDocs);
      setTotalPages(nTotalPages);
    } catch (error) {
      console.error("Failed to fetch customer carts:", error);
      toastHelper.showTost(
        (error as any)?.message || "Failed to fetch customer carts",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const resp = await CustomerCartService.getCustomerCartList(1, 10);
      const docs = (resp?.data?.docs || []) as any[];
      const uniqueMap = new Map<string, Customer>();
      for (const d of docs) {
        const c = d?.customerId;
        if (c?._id && !uniqueMap.has(c._id)) {
          uniqueMap.set(c._id, { _id: c._id, name: c.name, email: c.email });
        }
      }
      setCustomers(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toastHelper.showTost(
        (error as any)?.message || "Failed to fetch customers",
        "error"
      );
    }
  };

  const handleRemoveFromCart = async (cartItem: CustomerCart) => {
    if (!cartItem._id) return;

    const confirmed = await Swal.fire({
      title: "Remove from Cart?",
      text: "This will remove the item from customer's cart!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "No, cancel!",
    });

    if (confirmed.isConfirmed) {
      try {
        // Replace with your actual API call
        // await CustomerCartService.removeFromCart(cartItem._id);

        toastHelper.showTost("Item removed from cart successfully!", "success");
        fetchCustomerCarts();
      } catch (error) {
        console.error("Failed to remove item from cart:", error);
        toastHelper.showTost("Failed to remove item from cart!", "error");
      }
    }
  };

  const handlePreview = (cartItem: CustomerCart) => {
    setPreviewItem(cartItem);
    setIsPreviewModalOpen(true);
  };

  const getProductTitle = (productOrSku: any): string => {
    const product: any = productOrSku && productOrSku._id ? productOrSku : null;
    if (product) {
      const spec = product.specification;
      if (spec === null || spec === undefined || String(spec).trim() === "") {
        return "N/A";
      }
      return String(spec);
    }
    return "";
  };

  const buildImageUrl = (relativeOrAbsolute: string): string => {
    if (!relativeOrAbsolute)
      return "https://via.placeholder.com/60x60?text=Product";
    const isAbsolute = /^https?:\/\//i.test(relativeOrAbsolute);
    if (isAbsolute) return relativeOrAbsolute;
    const base = import.meta.env.VITE_BASE_URL || "";
    return `${base}${
      relativeOrAbsolute.startsWith("/") ? "" : "/"
    }${relativeOrAbsolute}`;
  };

  const getProductImageSrc = (product: CartProduct): string => {
    try {
      const sku = product?.skuFamilyId as any;
      const first =
        Array.isArray(sku?.images) && sku.images.length > 0
          ? sku.images[0]
          : "";
      if (first) return buildImageUrl(first);
    } catch (_) {}
    return "https://via.placeholder.com/60x60?text=Product";
  };

  const formatPrice = (price: number | string): string => {
    if (typeof price === "string") {
      const num = parseFloat(price);
      return isNaN(num) ? "0.00" : num.toFixed(2);
    }
    return price.toFixed(2);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "yyyy-MM-dd HH:mm");
    } catch {
      return "-";
    }
  };

  const toTitleCase = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200/50 dark:border-green-800/50";
      case "removed":
        return "bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200/50 dark:border-red-800/50";
      case "ordered":
        return "bg-blue-100/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50";
      default:
        return "bg-gray-100/50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "fa-check-circle";
      case "removed":
        return "fa-times-circle";
      case "ordered":
        return "fa-shopping-cart";
      default:
        return "fa-circle";
    }
  };

  return (
    <div className="p-6 dark:bg-gray-950 min-h-screen font-sans">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
        {/* Table Header with Controls */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <i className="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  type="text"
                  placeholder="Search by product title..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] transition-all duration-300 text-sm placeholder-gray-400 shadow-sm"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <div className="max-w-sm">
              <div className="relative">
                <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <select
                  className="w-full pl-12 pr-10 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] transition-all duration-300 text-sm appearance-none cursor-pointer shadow-sm"
                  value={selectedCustomer}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setSelectedCustomer(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Customers</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                {[
                  "Product Details",
                  "Customer Details",
                  "Quantity",
                  "Status",
                  "Added Date",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className={`px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      header === "Actions" ? "text-center" : "text-left"
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
                        Loading Customer Carts...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : customerCartsData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="w-14 h-14 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-shopping-cart text-xl text-gray-400"></i>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                        No customer carts found
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                customerCartsData.map((item: CustomerCart, index: number) => (
                  <tr
                    key={item._id || index}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-200"
                  >
                    {/* Product Details Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={getProductImageSrc(item.product)}
                          alt={getProductTitle(item.product)}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200/50 dark:border-gray-800/50 flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAQhoZ9wi9UzWyWDidI7NIP2qPzL4dGE6k9w&s";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h3
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                            title={getProductTitle(item.product)}
                          >
                            {getProductTitle(item.product)}
                          </h3>
                          <div className="mt-1 flex flex-col items-start gap-1 text-xs text-gray-600 dark:text-gray-400">
                            {item.product.color && (
                              <span className="flex items-center gap-1">
                                <label className="font-medium">Color:</label>
                                <span title={item.product.color}>
                                  {item.product.color}
                                </span>
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                              <i className="fas fa-dollar-sign text-xs"></i>
                              <span
                                title={`${formatPrice(item.product.price)}`}
                              >
                                {formatPrice(item.product.price)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Customer Details Column */}
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {item.customer.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <i className="fas fa-at text-gray-400 text-xs"></i>
                          {item.customer.email}
                        </p>
                      </div>
                    </td>

                    {/* Quantity Column */}
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100/50 text-[#0071E0] dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                        {item.quantity}
                      </span>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${getStatusStyles(
                          item.status
                        )}`}
                      >
                        <i
                          className={`fas ${getStatusIcon(
                            item.status
                          )} text-xs`}
                        ></i>
                        {toTitleCase(item.status)}
                      </span>
                    </td>

                    {/* Added Date Column */}
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-clock text-gray-400 text-xs"></i>
                        {formatDate(item.addedAt)}
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handlePreview(item)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0071E0]/10 hover:bg-[#0071E0]/20 dark:bg-[#0071E0]/20 dark:hover:bg-[#0071E0]/30 text-[#0071E0] dark:text-[#0071E0] transition-all duration-200 shadow-sm hover:shadow"
                          title="Preview Details"
                        >
                          <i className="fas fa-eye text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleRemoveFromCart(item)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100/50 hover:bg-red-200/50 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all duration-200 shadow-sm hover:shadow"
                          title="Remove from Cart"
                        >
                          <i className="fas fa-trash text-sm"></i>
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

      {/* Preview Modal */}
      {isPreviewModalOpen && previewItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Cart Item Details
                </h2>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0071E0]/10 hover:bg-[#0071E0]/20 dark:bg-[#0071E0]/20 dark:hover:bg-[#0071E0]/30 text-[#0071E0] dark:text-[#0071E0] transition-all duration-200 shadow-sm hover:shadow"
                >
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 px-6 py-6">
              <div className="space-y-6">
                {/* Product Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                    Product Information
                  </h3>
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-800/50 rounded-lg space-y-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={getProductImageSrc(previewItem.product)}
                        alt={getProductTitle(previewItem.product)}
                        className="w-16 h-16 object-contain rounded-lg border border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-gray-800"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAQhoZ9wi9UzWyWDidI7NIP2qPzL4dGE6k9w&s";
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {getProductTitle(previewItem.product)}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          {previewItem.product.simType && (
                            <div className="flex justify-left gap-1">
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                SIM Type:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {previewItem.product.simType}
                              </span>
                            </div>
                          )}
                          {previewItem.product.color && (
                            <div className="flex justify-left gap-1">
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                Color:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {previewItem.product.color}
                              </span>
                            </div>
                          )}
                          {previewItem.product.ram && (
                            <div className="flex justify-left gap-1">
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                RAM:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {previewItem.product.ram}
                              </span>
                            </div>
                          )}
                          {previewItem.product.storage && (
                            <div className="flex justify-left gap-1">
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                Storage:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {previewItem.product.storage}
                              </span>
                            </div>
                          )}
                          {previewItem.product.specification && (
                            <div className="flex justify-left gap-1">
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                Specification:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {previewItem.product.specification}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-left gap-1">
                            <span className="text-gray-800 dark:text-gray-200 font-medium">
                              Condition:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {previewItem.product.condition}
                              </span>
                            </div>
                          <div className="flex justify-left gap-1">
                            <span className="text-gray-800 dark:text-gray-200 font-medium">
                              Price:
                              </span>
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                ${formatPrice(previewItem.product.price)}
                              </span>
                            </div>
                          <div className="flex justify-left gap-1">
                            <span className="text-gray-800 dark:text-gray-200 font-medium">
                              Stock:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {previewItem.product.stock}
                              </span>
                            </div>
                          <div className="flex justify-left gap-1">
                            <span className="text-gray-800 dark:text-gray-200 font-medium">
                              Country:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {previewItem.product.country}
                              </span>
                            </div>
                          <div className="flex justify-left gap-1">
                            <span className="text-gray-800 dark:text-gray-200 font-medium">
                              MOQ:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {previewItem.product.moq}
                              </span>
                            </div>
                          {previewItem.product.purchaseType && (
                            <div className="flex justify-left gap-1">
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                Purchase Type:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 capitalize">
                                {previewItem.product.purchaseType}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-left gap-1">
                            <span className="text-gray-800 dark:text-gray-200 font-medium">
                              Negotiable:
                              </span>
                              <span
                                className={`${
                                  previewItem.product.isNegotiable
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {previewItem.product.isNegotiable ? "Yes" : "No"}
                              </span>
                            </div>
                          <div className="flex justify-left gap-1">
                            <span className="text-gray-800 dark:text-gray-200 font-medium">
                              Flash Deal:
                              </span>
                              <span
                                className={`${
                                  previewItem.product.isFlashDeal === true ||
                                  previewItem.product.isFlashDeal === "true"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {previewItem.product.isFlashDeal === true ||
                                previewItem.product.isFlashDeal === "true"
                                  ? "Yes"
                                  : "No"}
                              </span>
                            </div>
                          {previewItem.product.expiryTime && (
                            <div className="flex justify-left gap-1">
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                Expires:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {formatDate(previewItem.product.expiryTime)}
                              </span>
                            </div>
                          )}
                          {typeof previewItem.product.isApproved !==
                            "undefined" && (
                            <div className="flex justify-left gap-1">
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                Approved:
                              </span>
                              <span
                                className={`${
                                  previewItem.product.isApproved
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {previewItem.product.isApproved ? "Yes" : "No"}
                              </span>
                            </div>
                          )}
                          {typeof previewItem.product.isDeleted !==
                            "undefined" && (
                            <div className="flex justify-left gap-1">
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                Deleted:
                              </span>
                              <span
                                className={`${
                                  previewItem.product.isDeleted
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-green-600 dark:text-green-400"
                                }`}
                              >
                                {previewItem.product.isDeleted ? "Yes" : "No"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                    Customer Information
                  </h3>
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-800/50 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Name */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center">
                          <i className="fas fa-user text-gray-600 dark:text-gray-300 text-base"></i>
                        </div>
                        <div>
                          <div className="text-gray-800 dark:text-gray-200 font-medium">
                            {previewItem.customer.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Customer Name
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center">
                          <i className="fas fa-envelope text-gray-600 dark:text-gray-300 text-base"></i>
                        </div>
                        <div>
                          <div className="text-gray-800 dark:text-gray-200 font-medium">
                            {previewItem.customer.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Email Address
                          </div>
                        </div>
                      </div>

                      {/* Phone */}
                      {previewItem.customer.phone && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center">
                            <i className="fas fa-phone text-gray-600 dark:text-gray-300 text-base"></i>
                          </div>
                          <div>
                            <div className="text-gray-800 dark:text-gray-200 font-medium">
                              {previewItem.customer.phone}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Phone Number
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Address */}
                      {previewItem.customer.address && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mt-1">
                            <i className="fas fa-map-marker-alt text-gray-600 dark:text-gray-300 text-base"></i>
                          </div>
                          <div>
                            <div className="text-gray-800 dark:text-gray-200 font-medium">
                              {previewItem.customer.address}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Address
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cart Statistics */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                    Cart Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-800/50 rounded-lg">
                      <div className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        {previewItem.quantity}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Quantity
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-800/50 rounded-lg">
                      <div
                        className={`text-lg font-semibold mb-1 capitalize ${
                          previewItem.status === "active"
                            ? "text-green-600 dark:text-green-400"
                            : previewItem.status === "removed"
                            ? "text-red-600 dark:text-red-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {toTitleCase(previewItem.status)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Status
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-800/50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400 mb-1">
                        $
                        {(
                          (parseFloat(String(previewItem.product.price)) || 0) *
                          previewItem.quantity
                        ).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total Value
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-800/50 rounded-lg">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                        {formatDate(previewItem.addedAt)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Added Date
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-800/50 rounded-lg">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                        {formatDate(
                          previewItem.updatedAt || previewItem.addedAt
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Updated Date
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {previewItem.notes && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                      Notes
                    </h3>
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-800/50 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {previewItem.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 sticky bottom-0">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 text-sm font-medium shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCart;
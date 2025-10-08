// import React, { useState, useEffect } from "react";
// import Swal from "sweetalert2";
// import { format } from "date-fns";
// import toastHelper from "../../utils/toastHelper";
// import {
//   AdminOrderService,
//   Order,
//   TrackingItem,
//   OrderItem,
// } from "../../services/order/adminOrder.services";

// const OrdersTable: React.FC = () => {
//   const [ordersData, setOrdersData] = useState<Order[]>([]);
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [statusFilter, setStatusFilter] = useState<string>("");
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [totalDocs, setTotalDocs] = useState<number>(0);
//   const [totalPages, setTotalPages] = useState<number>(1);
//   const [currentAdminId, setCurrentAdminId] = useState<string>("");
//   const itemsPerPage = 10;

//   const allStatusOptions = [
//     "request",
//     "verified",
//     "approved",
//     "accepted",
//     "shipped",
//     "delivered",
//     "cancel",
//   ];

//   const getAvailableFilterStatuses = (): string[] => {
//     return allStatusOptions;
//   };

//   useEffect(() => {
//     const adminId = localStorage.getItem("adminId") || "";
//     setCurrentAdminId(adminId);
//     fetchOrders();
//   }, [currentPage, searchTerm, statusFilter]);

//   const fetchOrders = async () => {
//     try {
//       setLoading(true);
//       const response = await AdminOrderService.getOrderList(
//         currentPage,
//         itemsPerPage,
//         searchTerm || undefined,
//         statusFilter || undefined
//       );
//       setOrdersData(response.data.docs);
//       setTotalDocs(response.data.totalDocs);
//       setTotalPages(response.data.totalPages);
//     } catch (error) {
//       console.error("Failed to fetch orders:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getAvailableStatusOptions = (order: Order): string[] => {
//     const currentStatus = order.status;
//     const orderTrackingStatus = order.orderTrackingStatus;

//     const statusFlow = [
//       "request",
//       "verified",
//       "approved",
//       "accepted",
//       "shipped",
//       "delivered",
//     ];

//     const getNextStatus = (current: string): string | null => {
//       const currentIndex = statusFlow.indexOf(current);
//       return currentIndex >= 0 && currentIndex < statusFlow.length - 1
//         ? statusFlow[currentIndex + 1]
//         : null;
//     };

//     const getPreviousStatus = (current: string): string | null => {
//       const currentIndex = statusFlow.indexOf(current);
//       return currentIndex > 0 ? statusFlow[currentIndex - 1] : null;
//     };

//     if (orderTrackingStatus === "cancel") {
//       if (!order.verifiedBy && !order.approvedBy) {
//         return ["cancel", "verified"];
//       } else if (order.verifiedBy && !order.approvedBy) {
//         return ["cancel", "verified", "approved"];
//       } else if (order.verifiedBy && order.approvedBy) {
//         return ["cancel"];
//       }
//     }

//     if (currentStatus === "cancel" || orderTrackingStatus === "cancel") {
//       return ["cancel"];
//     }

//     const availableStatuses: string[] = [];
//     availableStatuses.push(currentStatus);

//     const nextStatus = getNextStatus(currentStatus);
//     if (nextStatus) {
//       availableStatuses.push(nextStatus);
//     }

//     const previousStatus = getPreviousStatus(currentStatus);
//     if (previousStatus) {
//       availableStatuses.push(previousStatus);
//     }

//     availableStatuses.push("cancel");

//     if (currentStatus === "request" && !order.verifiedBy && !order.approvedBy) {
//       return ["request", "verified", "cancel"];
//     }

//     if (order.verifiedBy && currentStatus === "request") {
//       return ["verified", "approved", "cancel"];
//     }

//     if (order.approvedBy && currentStatus === "verified") {
//       return ["approved", "accepted", "cancel"];
//     }

//     return [...new Set(availableStatuses)];
//   };

//   const handleUpdateStatus = async (order: Order) => {
//     const currentStatus = order.status;
//     const availableStatusOptions = getAvailableStatusOptions(order);

//     const canUpdateStatus =
//       order.verifiedBy === currentAdminId ||
//       order.approvedBy === currentAdminId;

//     if (availableStatusOptions.length === 0) {
//       toastHelper.showTost(
//         "No status options available for this order",
//         "warning"
//       );
//       return;
//     }

//     const isNewOrder =
//       currentStatus === "request" && !order.verifiedBy && !order.approvedBy;

//     if (
//       !isNewOrder &&
//       !canUpdateStatus &&
//       ["verified", "approved"].includes(currentStatus)
//     ) {
//       // Allow updates for flow-based approach
//     }

//     let selectedStatus = currentStatus;
//     let editedCartItems: OrderItem[] = [...order.cartItems];
//     let message = "";

//     const modalHtml = `
//       <div style="text-align: left; padding: 20px; font-family: 'Inter', sans-serif; max-height: 500px; overflow-y: auto;">
//         <div style="margin-bottom: 20px;">
//           <label for="statusSelect" style="display: block; font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 8px;">Select Status</label>
//           <select id="statusSelect" class="swal2-select" style="width: 100%; padding: 10px; font-size: 14px; margin:0px; border: 1px solid #D1D5DB; border-radius: 6px; background-color: #F9FAFB; color: #1F2937; outline: none; transition: border-color 0.2s;">
//             ${availableStatusOptions
//               .map(
//                 (status) =>
//                   `<option value="${status}" ${
//                     status === currentStatus ? "selected" : ""
//                   }>${
//                     status.charAt(0).toUpperCase() + status.slice(1)
//                   }</option>`
//               )
//               .join("")}
//           </select>
//         </div>
//         <div id="cartItemsContainer" style="margin-bottom: 20px; display: none;">
//           <h4 style="font-size: 16px; font-weight: 600; color: #1F2937; margin-bottom: 12px;">Edit Quantities</h4>
//           ${order.cartItems
//             .map(
//               (item, index) =>
//                 `
//                 <div style="margin-bottom: 16px; padding: 12px; background-color: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
//                   <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">
//                     ${item.skuFamilyId?.name || item.productId.name}
//                   </label>
//                   <input
//                     type="number"
//                     min="1"
//                     value="${item.quantity}"
//                     class="swal2-input quantity-input"
//                     data-item-index="${index}"
//                     style="width: 100%; margin:0px; padding: 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px; background-color: #FFFFFF; color: #1F2937; outline: none; transition: border-color 0.2s;"
//                   />
//                 </div>
//                 `
//             )
//             .join("")}
//         </div>
//         <div>
//           <label for="messageInput" style="display: block; font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 8px;">Message (Optional)</label>
//           <textarea
//             id="messageInput"
//             class="swal2-textarea"
//             placeholder="Enter a message for this status change"
//             style="width: 100%; margin:0px; padding: 10px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px; background-color: #F9FAFB; color: #1F2937; min-height: 100px; resize: vertical; outline: none; transition: border-color 0.2s;"
//           ></textarea>
//         </div>
//       </div>
//     `;

//     const result = await Swal.fire({
//       title: `Update Status for Order`,
//       html: modalHtml,
//       showCancelButton: true,
//       confirmButtonText: "Change Status",
//       cancelButtonText: "Cancel",
//       width: 600,
//       customClass: {
//         popup: "swal2-custom-popup",
//         title: "swal2-custom-title",
//         confirmButton: "swal2-custom-confirm",
//         cancelButton: "swal2-custom-cancel",
//       },
//       preConfirm: () => {
//         const statusSelect = document.getElementById(
//           "statusSelect"
//         ) as HTMLSelectElement;
//         const quantityInputs = document.querySelectorAll(
//           ".quantity-input"
//         ) as NodeListOf<HTMLInputElement>;
//         const messageInput = document.getElementById(
//           "messageInput"
//         ) as HTMLTextAreaElement;

//         if (!statusSelect) {
//           Swal.showValidationMessage("Status select element not found");
//           return false;
//         }

//         selectedStatus = statusSelect.value;
//         message = messageInput?.value || "";

//         console.log("Selected Status:", selectedStatus);
//         console.log("Current Status:", currentStatus);
//         console.log("Message:", message);

//         if (
//           ["verified", "approved"].includes(selectedStatus) &&
//           ["request", "accepted"].includes(currentStatus)
//         ) {
//           editedCartItems = order.cartItems.map((item, index) => ({
//             ...item,
//             quantity: parseInt(quantityInputs[index]?.value) || item.quantity,
//           }));
//         } else {
//           editedCartItems = order.cartItems;
//         }

//         return true;
//       },
//       didOpen: () => {
//         const statusSelect = document.getElementById(
//           "statusSelect"
//         ) as HTMLSelectElement;
//         const cartItemsContainer = document.getElementById(
//           "cartItemsContainer"
//         ) as HTMLElement;

//         statusSelect.addEventListener("change", () => {
//           const newStatus = statusSelect.value;
//           cartItemsContainer.style.display =
//             newStatus !== "cancel" &&
//             ["verified", "approved"].includes(newStatus) &&
//             ["request", "accepted"].includes(currentStatus)
//               ? "block"
//               : "none";
//         });

//         const inputs = document.querySelectorAll(
//           ".swal2-input, .swal2-select, .swal2-textarea"
//         );
//         inputs.forEach((input) => {
//           input.addEventListener("focus", () => {
//             (input as HTMLElement).style.borderColor = "#3B82F6";
//             (input as HTMLElement).style.boxShadow =
//               "0 0 0 3px rgba(59, 130, 246, 0.1)";
//           });
//           input.addEventListener("blur", () => {
//             (input as HTMLElement).style.borderColor = "#D1D5DB";
//             (input as HTMLElement).style.boxShadow = "none";
//           });
//         });
//       },
//     });

//     if (result.isConfirmed) {
//       if (selectedStatus === currentStatus && !message) {
//         toastHelper.showTost("No changes made to the order status", "info");
//         return;
//       }

//       try {
//         const cartItemsToSend =
//           selectedStatus !== "cancel" &&
//           ["request", "accepted"].includes(currentStatus) &&
//           ["verified", "approved"].includes(selectedStatus)
//             ? editedCartItems
//             : undefined;

//         console.log("Updating order status:", {
//           orderId: order._id,
//           selectedStatus,
//           cartItemsToSend,
//           message,
//         });

//         const response = await AdminOrderService.updateOrderStatus(
//           order._id,
//           selectedStatus,
//           cartItemsToSend,
//           message || undefined
//         );

//         console.log("Update response:", response);

//         if (response !== false) {
//           fetchOrders();
//         }
//       } catch (error) {
//         console.error("Failed to update order status:", error);
//         toastHelper.showTost("Failed to update order status", "error");
//       }
//     }
//   };

//   const handleViewTracking = async (orderId: string) => {
//     try {
//       const response = await AdminOrderService.getOrderTracking(orderId);
//       const trackingItems: TrackingItem[] = response.data.docs;

//       if (trackingItems.length === 0) {
//         await Swal.fire({
//           title: "No Tracking Information",
//           text: "No tracking details are available for this order.",
//           icon: "info",
//           confirmButtonText: "OK",
//         });
//         return;
//       }

//       const trackingHtml = `
//         <div style="text-align: left;">
//           <h3 style="margin-bottom: 16px;">Tracking Details for Order ${orderId}</h3>
//           <table style="width: 100%; border-collapse: collapse;">
//             <thead>
//               <tr style="background-color: #f4f4f4;">
//                 <th style="padding: 8px; border: 1px solid #ddd;">Status</th>
//                 <th style="padding: 8px; border: 1px solid #ddd;">Changed By</th>
//                 <th style="padding: 8px; border: 1px solid #ddd;">User Type</th>
//                 <th style="padding: 8px; border: 1px solid #ddd;">Changed At</th>
//                 <th style="padding: 8px; border: 1px solid #ddd;">Message</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${trackingItems
//                 .map(
//                   (item) => `
//                     <tr>
//                       <td style="padding: 8px; border: 1px solid #ddd;">
//                         ${
//                           item.status.charAt(0).toUpperCase() +
//                           item.status.slice(1)
//                         }
//                       </td>
//                       <td style="padding: 8px; border: 1px solid #ddd;">
//                         ${item?.changedBy?.name || "-"}
//                       </td>
//                       <td style="padding: 8px; border: 1px solid #ddd;">
//                         ${item.userType}
//                       </td>
//                       <td style="padding: 8px; border: 1px solid #ddd;">
//                         ${format(new Date(item.changedAt), "yyyy-MM-dd HH:mm")}
//                       </td>
//                       <td style="padding: 8px; border: 1px solid #ddd;">
//                         ${item.message || "-"}
//                       </td>
//                     </tr>
//                   `
//                 )
//                 .join("")}
//             </tbody>
//           </table>
//         </div>
//       `;

//       await Swal.fire({
//         title: "Order Tracking",
//         html: trackingHtml,
//         width: 800,
//         showConfirmButton: true,
//         confirmButtonText: "Close",
//       });
//     } catch (error) {
//       console.error("Failed to fetch tracking:", error);
//       toastHelper.showTost("Failed to fetch tracking details", "error");
//     }
//   };

//   const formatPrice = (price: number | string): string => {
//     if (typeof price === "string") {
//       const num = parseFloat(price);
//       return isNaN(num) ? "0.00" : num.toFixed(2);
//     }
//     return price.toFixed(2);
//   };

//   const formatDate = (date: string): string => {
//     if (!date) return "-";
//     try {
//       return format(new Date(date), "yyyy-MM-dd HH:mm");
//     } catch {
//       return "-";
//     }
//   };

//   const getStatusBadge = (order: Order) => {
//     const statusStyles: { [key: string]: string } = {
//       request:
//         "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700",
//       verified:
//         "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700",
//       approved:
//         "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700",
//       shipped:
//         "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-700",
//       delivered:
//         "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-700",
//       cancelled:
//         "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700",
//       accepted:
//         "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700",
//       cancel:
//         "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-700",
//     };

//     const statusIcons: { [key: string]: string } = {
//       request: "fa-clock",
//       verified: "fa-check",
//       approved: "fa-check-circle",
//       shipped: "fa-truck",
//       delivered: "fa-box",
//       cancelled: "fa-times-circle",
//       accepted: "fa-handshake",
//       cancel: "fa-exclamation-triangle",
//     };

//     let displayStatus = order.status;

//     if (order.orderTrackingStatus === "cancel") {
//       if (order.verifiedBy && order.approvedBy) {
//         displayStatus = "cancel";
//       } else if (order.verifiedBy) {
//         displayStatus = "verified";
//       } else {
//         displayStatus = "cancel";
//       }
//     } else {
//       if (order.approvedBy) {
//         displayStatus = "approved";
//       } else if (order.verifiedBy) {
//         displayStatus = "verified";
//       } else {
//         displayStatus = order.status;
//       }
//     }

//     const isVerifiedByOtherAdmin =
//       order.orderTrackingStatus === "verified" &&
//       order.verifiedBy !== currentAdminId;
//     const isInCancellationFlow = order.orderTrackingStatus === "cancel";
//     const showOnlyIcons =
//       isInCancellationFlow && (order.verifiedBy || order.approvedBy);

//     return (
//       <span className="inline-flex items-center gap-2">
//         <span
//           className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
//             statusStyles[displayStatus] ||
//             "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
//           }`}
//         >
//           <i
//             className={`fas ${
//               statusIcons[displayStatus] || "fa-info-circle"
//             } text-xs`}
//           ></i>
//           {!showOnlyIcons &&
//             displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
//         </span>

//         {isInCancellationFlow && (
//           <>
//             {order.verifiedBy && (
//               <span
//                 className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 border border-blue-200"
//                 title="Verified by admin"
//               >
//                 <i className="fas fa-check text-xs"></i>
//               </span>
//             )}
//             {order.approvedBy && (
//               <span
//                 className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200"
//                 title="Approved by admin"
//               >
//                 <i className="fas fa-check-circle text-xs"></i>
//               </span>
//             )}
//           </>
//         )}

//         {isVerifiedByOtherAdmin && (
//           <span
//             className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
//             title="This order has been verified by another admin"
//           >
//             <i className="fas fa-info-circle text-xs"></i>
//             Verified
//           </span>
//         )}
//       </span>
//     );
//   };

//   return (
//     <div className="p-6">
//       <link
//         rel="stylesheet"
//         href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
//       />

//       <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
//         <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
//           <div className="flex items-center gap-3 flex-1">
//             <div className="relative flex-1 max-w-md">
//               <i className="fas fa-search absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
//               <input
//                 type="text"
//                 placeholder="Search by order ID or customer..."
//                 className="pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] text-sm w-full transition-all"
//                 value={searchTerm}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   setSearchTerm(e.target.value);
//                   setCurrentPage(1);
//                 }}
//               />
//             </div>
//           </div>
//           <div className="relative">
//             <select
//               value={statusFilter}
//               onChange={(e) => {
//                 setStatusFilter(e.target.value);
//                 setCurrentPage(1);
//               }}
//               className="pl-3 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] text-sm appearance-none cursor-pointer transition-all min-w-[140px]"
//             >
//               <option value="">All Status</option>
//               {getAvailableFilterStatuses().map((status) => (
//                 <option key={status} value={status}>
//                   {status.charAt(0).toUpperCase() + status.slice(1)}
//                 </option>
//               ))}
//             </select>
//             <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
//           </div>
//         </div>

//         <div className="max-w-full overflow-x-auto">
//           <table className="w-full table-auto">
//             <thead className="bg-gray-50 dark:bg-gray-900">
//               <tr>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
//                   <div className="flex items-center gap-2">
//                     Customer
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
//                   <div className="flex items-center gap-2">
//                     Items
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
//                   <div className="flex items-center gap-2">
//                     Total
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
//                   <div className="flex items-center gap-2">
//                     Date
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
//                   <div className="flex items-center justify-center gap-2">
//                     Status
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
//                   <div className="flex items-center justify-center gap-2">
//                     Actions
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
//                   <div className="flex items-center justify-center gap-2">
//                     Tracking
//                   </div>
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//               {loading ? (
//                 <tr>
//                   <td colSpan={7} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="relative">
//                         <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200 dark:border-gray-700"></div>
//                         <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#0071E0] border-t-transparent absolute top-0 left-0"></div>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-3">
//                         Loading Orders...
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : ordersData.length === 0 ? (
//                 <tr>
//                   <td colSpan={7} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
//                         <i className="fas fa-shopping-cart text-2xl text-gray-400"></i>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
//                         No orders found
//                       </p>
//                       <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
//                         Try adjusting your search or filters
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 ordersData.map((order: Order) => (
//                   <tr
//                     key={order._id}
//                     className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
//                   >
//                     <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
//                       {order?.customerId?.name ||
//                         order?.customerId?.email ||
//                         order?.customerId?._id}
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       {order.cartItems.map((item) => (
//                         <div key={item?.productId?._id}>
//                           {item?.skuFamilyId?.name || item?.productId?.name} (x
//                           {item.quantity})
//                         </div>
//                       ))}
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       ${formatPrice(order.totalAmount)}
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       {formatDate(order.createdAt)}
//                     </td>
//                     <td className="px-6 py-4 text-sm text-center">
//                       {getStatusBadge(order)}
//                     </td>
//                     <td className="px-6 py-4 text-sm text-center">
//                       <button
//                         onClick={() => handleUpdateStatus(order)}
//                         className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-[#0071E0] dark:text-blue-400 transition-colors mx-auto"
//                         title="Update Status"
//                       >
//                         <i className="fas fa-pen text-xs"></i>
//                       </button>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-center">
//                       <button
//                         onClick={() => handleViewTracking(order._id)}
//                         className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-[#0071E0] dark:text-blue-400 transition-colors mx-auto"
//                         title="View Tracking"
//                       >
//                         <i className="fas fa-eye text-xs"></i>
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
//           <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
//             <i className="fas fa-list text-[#0071E0] text-xs"></i>
//             <span>
//               Showing{" "}
//               <span className="text-gray-800 dark:text-gray-200 font-semibold">
//                 {ordersData.length}
//               </span>{" "}
//               of{" "}
//               <span className="text-gray-800 dark:text-gray-200 font-semibold">
//                 {totalDocs}
//               </span>{" "}
//               orders
//             </span>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//               className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
//             >
//               <i className="fas fa-chevron-left text-xs"></i>
//               Previous
//             </button>
//             <div className="flex space-x-1.5">
//               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                 const pageNum = i + 1;
//                 return (
//                   <button
//                     key={pageNum}
//                     onClick={() => setCurrentPage(pageNum)}
//                     className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
//                       currentPage === pageNum
//                         ? "bg-[#0071E0] text-white"
//                         : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
//                     }`}
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
//               disabled={currentPage === totalPages}
//               className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
//             >
//               Next
//               <i className="fas fa-chevron-right text-xs"></i>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrdersTable;


import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { format } from "date-fns";
import toastHelper from "../../utils/toastHelper";
import {
  AdminOrderService,
  Order,
  TrackingItem,
  OrderItem,
} from "../../services/order/adminOrder.services";

const OrdersTable: React.FC = () => {
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentAdminId, setCurrentAdminId] = useState<string>("");
  const itemsPerPage = 10;

  const allStatusOptions = [
    "request",
    "verified",
    "approved",
    "accepted",
    "shipped",
    "delivered",
    "cancel",
  ];

  const getAvailableFilterStatuses = (): string[] => {
    return allStatusOptions;
  };

  useEffect(() => {
    const adminId = localStorage.getItem("adminId") || "";
    setCurrentAdminId(adminId);
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await AdminOrderService.getOrderList(
        currentPage,
        itemsPerPage,
        searchTerm || undefined,
        statusFilter || undefined
      );
      setOrdersData(response.data.docs);
      setTotalDocs(response.data.totalDocs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableStatusOptions = (order: Order): string[] => {
    const currentStatus = order.status;
    const orderTrackingStatus = order.orderTrackingStatus;

    const statusFlow = [
      "request",
      "verified",
      "approved",
      "accepted",
      "shipped",
      "delivered",
    ];

    const getNextStatus = (current: string): string | null => {
      const currentIndex = statusFlow.indexOf(current);
      return currentIndex >= 0 && currentIndex < statusFlow.length - 1
        ? statusFlow[currentIndex + 1]
        : null;
    };

    const getPreviousStatus = (current: string): string | null => {
      const currentIndex = statusFlow.indexOf(current);
      return currentIndex > 0 ? statusFlow[currentIndex - 1] : null;
    };

    if (orderTrackingStatus === "cancel") {
      if (!order.verifiedBy && !order.approvedBy) {
        return ["cancel", "verified"];
      } else if (order.verifiedBy && !order.approvedBy) {
        return ["cancel", "verified", "approved"];
      } else if (order.verifiedBy && order.approvedBy) {
        return ["cancel"];
      }
    }

    if (currentStatus === "cancel" || orderTrackingStatus === "cancel") {
      return ["cancel"];
    }

    const availableStatuses: string[] = [];
    availableStatuses.push(currentStatus);

    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus) {
      availableStatuses.push(nextStatus);
    }

    const previousStatus = getPreviousStatus(currentStatus);
    if (previousStatus) {
      availableStatuses.push(previousStatus);
    }

    availableStatuses.push("cancel");

    if (currentStatus === "request" && !order.verifiedBy && !order.approvedBy) {
      return ["request", "verified", "cancel"];
    }

    if (order.verifiedBy && currentStatus === "request") {
      return ["verified", "approved", "cancel"];
    }

    if (order.approvedBy && currentStatus === "verified") {
      return ["approved", "accepted", "cancel"];
    }

    return [...new Set(availableStatuses)];
  };

  const handleUpdateStatus = async (order: Order) => {
    const currentStatus = order.status;
    const availableStatusOptions = getAvailableStatusOptions(order);

    const canUpdateStatus =
      order.verifiedBy === currentAdminId ||
      order.approvedBy === currentAdminId;

    if (availableStatusOptions.length === 0) {
      toastHelper.showTost(
        "No status options available for this order",
        "warning"
      );
      return;
    }

    const isNewOrder =
      currentStatus === "request" && !order.verifiedBy && !order.approvedBy;

    if (
      !isNewOrder &&
      !canUpdateStatus &&
      ["verified", "approved"].includes(currentStatus)
    ) {
      // Allow updates for flow-based approach
    }

    let selectedStatus = currentStatus;
    let editedCartItems: OrderItem[] = [...order.cartItems];
    let message = "";

    const modalHtml = `
      <div style="text-align: left; padding: 20px; font-family: 'Inter', sans-serif; max-height: 500px; overflow-y: auto;">
        <div style="margin-bottom: 20px;">
          <label for="statusSelect" style="display: block; font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 8px;">Select Status</label>
          <select id="statusSelect" class="swal2-select" style="width: 100%; padding: 10px; font-size: 14px; margin:0px; border: 1px solid #D1D5DB; border-radius: 6px; background-color: #F9FAFB; color: #1F2937; outline: none; transition: border-color 0.2s;">
            ${availableStatusOptions
              .map(
                (status) =>
                  `<option value="${status}" ${
                    status === currentStatus ? "selected" : ""
                  }>${
                    status.charAt(0).toUpperCase() + status.slice(1)
                  }</option>`
              )
              .join("")}
          </select>
        </div>
        <div id="cartItemsContainer" style="margin-bottom: 20px; display: none;">
          <h4 style="font-size: 16px; font-weight: 600; color: #1F2937; margin-bottom: 12px;">Edit Quantities</h4>
          ${order.cartItems
            .map(
              (item, index) =>
                `
                <div style="margin-bottom: 16px; padding: 12px; background-color: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
                  <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">
                    ${item.skuFamilyId?.name || item.productId.name}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value="${item.quantity}"
                    class="swal2-input quantity-input"
                    data-item-index="${index}"
                    style="width: 100%; margin:0px; padding: 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px; background-color: #FFFFFF; color: #1F2937; outline: none; transition: border-color 0.2s;"
                  />
                </div>
                `
            )
            .join("")}
        </div>
        <div>
          <label for="messageInput" style="display: block; font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 8px;">Message (Optional)</label>
          <textarea
            id="messageInput"
            class="swal2-textarea"
            placeholder="Enter a message for this status change"
            style="width: 100%; margin:0px; padding: 10px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px; background-color: #F9FAFB; color: #1F2937; min-height: 100px; resize: vertical; outline: none; transition: border-color 0.2s;"
          ></textarea>
        </div>
      </div>
    `;

    const result = await Swal.fire({
      title: `Update Status for Order`,
      html: modalHtml,
      showCancelButton: true,
      confirmButtonText: "Change Status",
      cancelButtonText: "Cancel",
      width: 600,
      customClass: {
        popup: "swal2-custom-popup",
        title: "swal2-custom-title",
        confirmButton: "swal2-custom-confirm",
        cancelButton: "swal2-custom-cancel",
      },
      preConfirm: () => {
        const statusSelect = document.getElementById(
          "statusSelect"
        ) as HTMLSelectElement;
        const quantityInputs = document.querySelectorAll(
          ".quantity-input"
        ) as NodeListOf<HTMLInputElement>;
        const messageInput = document.getElementById(
          "messageInput"
        ) as HTMLTextAreaElement;

        if (!statusSelect) {
          Swal.showValidationMessage("Status select element not found");
          return false;
        }

        selectedStatus = statusSelect.value;
        message = messageInput?.value || "";

        console.log("Selected Status:", selectedStatus);
        console.log("Current Status:", currentStatus);
        console.log("Message:", message);

        if (
          ["verified", "approved"].includes(selectedStatus) &&
          ["request", "accepted"].includes(currentStatus)
        ) {
          editedCartItems = order.cartItems.map((item, index) => ({
            ...item,
            quantity: parseInt(quantityInputs[index]?.value) || item.quantity,
          }));
        } else {
          editedCartItems = order.cartItems;
        }

        return true;
      },
      didOpen: () => {
        const statusSelect = document.getElementById(
          "statusSelect"
        ) as HTMLSelectElement;
        const cartItemsContainer = document.getElementById(
          "cartItemsContainer"
        ) as HTMLElement;

        statusSelect.addEventListener("change", () => {
          const newStatus = statusSelect.value;
          cartItemsContainer.style.display =
            newStatus !== "cancel" &&
            ["verified", "approved"].includes(newStatus) &&
            ["request", "accepted"].includes(currentStatus)
              ? "block"
              : "none";
        });

        const inputs = document.querySelectorAll(
          ".swal2-input, .swal2-select, .swal2-textarea"
        );
        inputs.forEach((input) => {
          input.addEventListener("focus", () => {
            (input as HTMLElement).style.borderColor = "#3B82F6";
            (input as HTMLElement).style.boxShadow =
              "0 0 0 3px rgba(59, 130, 246, 0.1)";
          });
          input.addEventListener("blur", () => {
            (input as HTMLElement).style.borderColor = "#D1D5DB";
            (input as HTMLElement).style.boxShadow = "none";
          });
        });
      },
    });

    if (result.isConfirmed) {
      if (selectedStatus === currentStatus && !message) {
        toastHelper.showTost("No changes made to the order status", "info");
        return;
      }

      try {
        const cartItemsToSend =
          selectedStatus !== "cancel" &&
          ["request", "accepted"].includes(currentStatus) &&
          ["verified", "approved"].includes(selectedStatus)
            ? editedCartItems
            : undefined;

        console.log("Updating order status:", {
          orderId: order._id,
          selectedStatus,
          cartItemsToSend,
          message,
        });

        const response = await AdminOrderService.updateOrderStatus(
          order._id,
          selectedStatus,
          cartItemsToSend,
          message || undefined
        );

        console.log("Update response:", response);

        if (response !== false) {
          fetchOrders();
        }
      } catch (error) {
        console.error("Failed to update order status:", error);
        toastHelper.showTost("Failed to update order status", "error");
      }
    }
  };

  const handleViewTracking = async (orderId: string) => {
    try {
      const response = await AdminOrderService.getOrderTracking(orderId);
      const trackingItems: TrackingItem[] = response.data.docs;

      if (trackingItems.length === 0) {
        await Swal.fire({
          title: "No Tracking Information",
          text: "No tracking details are available for this order.",
          icon: "info",
          confirmButtonText: "OK",
        });
        return;
      }

      const trackingHtml = `
        <div style="text-align: left;">
          <h3 style="margin-bottom: 16px;">Tracking Details for Order ${orderId}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f4f4f4;">
                <th style="padding: 8px; border: 1px solid #ddd;">Status</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Changed By</th>
                <th style="padding: 8px; border: 1px solid #ddd;">User Type</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Changed At</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Message</th>
              </tr>
            </thead>
            <tbody>
              ${trackingItems
                .map(
                  (item) => `
                    <tr>
                      <td style="padding: 8px; border: 1px solid #ddd;">
                        ${
                          item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)
                        }
                      </td>
                      <td style="padding: 8px; border: 1px solid #ddd;">
                        ${item?.changedBy?.name || "-"}
                      </td>
                      <td style="padding: 8px; border: 1px solid #ddd;">
                        ${item.userType}
                      </td>
                      <td style="padding: 8px; border: 1px solid #ddd;">
                        ${format(new Date(item.changedAt), "yyyy-MM-dd HH:mm")}
                      </td>
                      <td style="padding: 8px; border: 1px solid #ddd;">
                        ${item.message || "-"}
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;

      await Swal.fire({
        title: "Order Tracking",
        html: trackingHtml,
        width: 800,
        showConfirmButton: true,
        confirmButtonText: "Close",
      });
    } catch (error) {
      console.error("Failed to fetch tracking:", error);
      toastHelper.showTost("Failed to fetch tracking details", "error");
    }
  };

  const formatPrice = (price: number | string): string => {
    if (typeof price === "string") {
      const num = parseFloat(price);
      return isNaN(num) ? "0.00" : num.toFixed(2);
    }
    return price.toFixed(2);
  };

  const formatDate = (date: string): string => {
    if (!date) return "-";
    try {
      return format(new Date(date), "yyyy-MM-dd HH:mm");
    } catch {
      return "-";
    }
  };

  const getStatusBadge = (order: Order) => {
    const statusStyles: { [key: string]: string } = {
      request:
        "bg-yellow-100/50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 border border-yellow-200/50 dark:border-yellow-800/50",
      verified:
        "bg-blue-100/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50",
      approved:
        "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200/50 dark:border-green-800/50",
      shipped:
        "bg-purple-100/50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50",
      delivered:
        "bg-teal-100/50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/50",
      cancelled:
        "bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200/50 dark:border-red-800/50",
      accepted:
        "bg-indigo-100/50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50",
      cancel:
        "bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200/50 dark:border-red-800/50",
    };

    const statusIcons: { [key: string]: string } = {
      request: "fa-clock",
      verified: "fa-check",
      approved: "fa-circle-check",
      shipped: "fa-truck",
      delivered: "fa-box",
      cancelled: "fa-circle-xmark",
      accepted: "fa-handshake",
      cancel: "fa-circle-xmark",
    };

    let displayStatus = order.status;

    if (order.orderTrackingStatus === "cancel") {
      if (order.verifiedBy && order.approvedBy) {
        displayStatus = "cancel";
      } else if (order.verifiedBy) {
        displayStatus = "verified";
      } else {
        displayStatus = "cancel";
      }
    } else {
      if (order.approvedBy) {
        displayStatus = "approved";
      } else if (order.verifiedBy) {
        displayStatus = "verified";
      } else {
        displayStatus = order.status;
      }
    }

    const isVerifiedByOtherAdmin =
      order.orderTrackingStatus === "verified" &&
      order.verifiedBy !== currentAdminId;
    const isInCancellationFlow = order.orderTrackingStatus === "cancel";
    const showOnlyIcons =
      isInCancellationFlow && (order.verifiedBy || order.approvedBy);

    return (
      <span className="inline-flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
            statusStyles[displayStatus] ||
            "bg-gray-100/50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 border border-gray-200/50 dark:border-gray-800/50"
          }`}
        >
          <i
            className={`fas ${
              statusIcons[displayStatus] || "fa-info-circle"
            } text-xs`}
          ></i>
          {!showOnlyIcons &&
            displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
        </span>

        {isInCancellationFlow && (
          <>
            {order.verifiedBy && (
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100/50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50"
                title="Verified by admin"
              >
                <i className="fas fa-check text-xs"></i>
              </span>
            )}
            {order.approvedBy && (
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100/50 text-green-600 dark:bg-green-900/20 dark:text-green-300 border border-green-200/50 dark:border-green-800/50"
                title="Approved by admin"
              >
                <i className="fas fa-circle-check text-xs"></i>
              </span>
            )}
          </>
        )}

        {isVerifiedByOtherAdmin && (
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50"
            title="This order has been verified by another admin"
          >
            <i className="fas fa-info-circle text-xs"></i>
            Verified
          </span>
        )}
      </span>
    );
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
                  placeholder="Search by order ID or customer..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] transition-all duration-300 text-sm placeholder-gray-400 shadow-sm"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-3 pr-10 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] text-sm appearance-none cursor-pointer transition-all min-w-[160px] shadow-sm"
              >
                <option value="">All Status</option>
                {getAvailableFilterStatuses().map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                {[
                  "Customer",
                  "Items",
                  "Total",
                  "Date",
                  "Status",
                  "Actions",
                  "Tracking",
                ].map((header) => (
                  <th
                    key={header}
                    className={`px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      ["Status", "Actions", "Tracking"].includes(header)
                        ? "text-center"
                        : "text-left"
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
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 dark:border-gray-700"></div>
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0071E0] border-t-transparent absolute top-0 left-0"></div>
                      </div>
                      <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Loading Orders...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : ordersData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="w-14 h-14 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-shopping-cart text-xl text-gray-400"></i>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                        No orders found
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                ordersData.map((order: Order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {order?.customerId?.name ||
                          order?.customerId?.email ||
                          order?.customerId?._id ||
                          "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {order.cartItems.map((item) => (
                          <div key={item?.productId?._id}>
                            {item?.skuFamilyId?.name || item?.productId?.name} (x
                            {item.quantity})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ${formatPrice(order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <i className="fas fa-calendar text-gray-400 text-sm"></i>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(order)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleUpdateStatus(order)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0071E0]/10 hover:bg-[#0071E0]/20 dark:bg-[#0071E0]/20 dark:hover:bg-[#0071E0]/30 text-[#0071E0] dark:text-[#0071E0] transition-all duration-200 shadow-sm hover:shadow"
                          title="Update Status"
                        >
                          <i className="fas fa-pen text-sm"></i>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center justify-center flex">
                      <button
                        onClick={() => handleViewTracking(order._id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0071E0]/10 hover:bg-[#0071E0]/20 dark:bg-[#0071E0]/20 dark:hover:bg-[#0071E0]/30 text-[#0071E0] dark:text-[#0071E0] transition-all duration-200 shadow-sm hover:shadow"
                        title="View Tracking"
                      >
                        <i className="fas fa-eye text-sm"></i>
                      </button>
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
              orders
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
    </div>
  );
};

export default OrdersTable;
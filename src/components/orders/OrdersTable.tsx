import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { format } from "date-fns";
import toastHelper from "../../utils/toastHelper";
import { AdminOrderService, Order, TrackingItem, OrderItem } from "../../services/order/adminOrder.services";
import { LOCAL_STORAGE_KEYS } from "../../constants/localStorage";

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

  const allStatusOptions = ["request", "verified", "approved", "accepted", "shipped", "delivered", "cancel"];
  
  // Get available status options for filter dropdown based on admin
  const getAvailableFilterStatuses = (): string[] => {
    // For now, show all statuses in filter dropdown
    // This can be customized based on specific admin requirements
    return allStatusOptions;
  };

  useEffect(() => {
    // Get current admin ID from localStorage
    const adminId = localStorage.getItem(LOCAL_STORAGE_KEYS.ADMIN_ID) || "";
    setCurrentAdminId(adminId);
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter]);

  const handleExport = async () => {
    try {
      const blob = await AdminOrderService.exportOrdersExcel(statusFilter || undefined);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toastHelper.showTost('Export started', 'success');
    } catch (e) {}
  };

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

  // Get available status options based on current order and admin
  const getAvailableStatusOptions = (order: Order): string[] => {
    const currentStatus = order.status;
    const orderTrackingStatus = order.orderTrackingStatus;
    
    // Define status flow: request → verified → approved → accepted → shipped → delivered
    const statusFlow = ["request", "verified", "approved", "accepted", "shipped", "delivered"];
    
    // Get the next status in the flow
    const getNextStatus = (current: string): string | null => {
      const currentIndex = statusFlow.indexOf(current);
      return currentIndex >= 0 && currentIndex < statusFlow.length - 1 
        ? statusFlow[currentIndex + 1] 
        : null;
    };
    
    // Get the previous status in the flow (for going back)
    const getPreviousStatus = (current: string): string | null => {
      const currentIndex = statusFlow.indexOf(current);
      return currentIndex > 0 ? statusFlow[currentIndex - 1] : null;
    };
    
    // Handle cancellation flow: cancel → verified → approved → cancel
    if (orderTrackingStatus === "cancel") {
      // If order is in cancel state, show verification and approval options
      if (!order.verifiedBy && !order.approvedBy) {
        // No one has verified or approved yet - show "verified" for first admin
        return ["cancel", "verified"];
      } else if (order.verifiedBy && !order.approvedBy) {
        // Verified but not approved - show "approved" for second admin
        return ["cancel", "verified", "approved"];
      } else if (order.verifiedBy && order.approvedBy) {
        // Both verified and approved - order becomes cancel, no more options
        return ["cancel"];
      }
    }
    
    // If order is already cancelled, no status options
    if (currentStatus === "cancel" || orderTrackingStatus === "cancel") {
      return ["cancel"];
    }
    
    const availableStatuses: string[] = [];
    
    // Add current status
    availableStatuses.push(currentStatus);
    
    // Add next status in flow
    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus) {
      availableStatuses.push(nextStatus);
    }
    
    // Add previous status in flow (for going back)
    const previousStatus = getPreviousStatus(currentStatus);
    if (previousStatus) {
      availableStatuses.push(previousStatus);
    }
    
    // Add cancel option for all statuses except already cancelled
    availableStatuses.push("cancel");
    
    // Special handling for admin-specific statuses
    if (currentStatus === "request" && !order.verifiedBy && !order.approvedBy) {
      // For new orders, only show "verified"
      return ["request", "verified", "cancel"];
    }
    
    // If order is verified but status is still "request", show only "verified" and "approved"
    if (order.verifiedBy && currentStatus === "request") {
      return ["verified", "approved", "cancel"];
    }
    
    // If order is approved but status is still "verified", show only "approved" and next status
    if (order.approvedBy && currentStatus === "verified") {
      return ["approved", "accepted", "cancel"];
    }
    
    // Remove duplicates and return
    return [...new Set(availableStatuses)];
  };

  const handleUpdateStatus = async (order: Order) => {
    try {
      const currentStatus = order.status;
      const availableStatusOptions = getAvailableStatusOptions(order);
      
      // Check if current admin has permission to update this order's status
      const canUpdateStatus = order.verifiedBy === currentAdminId || order.approvedBy === currentAdminId;
      
      // If no options available (shouldn't happen, but safety check)
      if (availableStatusOptions.length === 0) {
        toastHelper.showTost("No status options available for this order", "warning");
        return;
      }
      
      // Check if admin has permission to update status
      // Allow updates for new orders (request status) or if admin has permission
      const isNewOrder = currentStatus === "request" && !order.verifiedBy && !order.approvedBy;
      
      // Allow status updates for all statuses in the flow
      // No need for complex permission checks since we're following the flow
      if (!isNewOrder && !canUpdateStatus && ["verified", "approved"].includes(currentStatus)) {
        // Only restrict if it's not a new order and admin doesn't have permission
        // For the flow-based approach, we'll allow updates
      }

      let selectedStatus = currentStatus;
      let editedCartItems: OrderItem[] = [...order.cartItems];
      let message = "";

      // Create a simpler modal HTML structure
      const modalHtml = `
        <div style="text-align: left; padding: 20px; font-family: 'Inter', sans-serif; max-height: 500px; overflow-y: auto;">
          <div style="margin-bottom: 20px;">
            <label for="statusSelect" style="display: block; font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 8px;">Select Status</label>
            <select id="statusSelect" style="width: 100%; padding: 10px; font-size: 14px; margin:0px; border: 1px solid #D1D5DB; border-radius: 6px; background-color: #F9FAFB; color: #1F2937; outline: none; transition: border-color 0.2s;">
              ${availableStatusOptions
                .map(
                  (status) =>
                    `<option value="${status}" ${
                      status === currentStatus ? "selected" : ""
                    }>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`
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
                      ${item.skuFamilyId?.name || item.productId?.name}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value="${item.quantity}"
                      class="quantity-input"
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
        allowOutsideClick: false,
        allowEscapeKey: true,
        showLoaderOnConfirm: true,
        preConfirm: () => {
          try {
            const statusSelect = document.getElementById("statusSelect") as HTMLSelectElement;
            const quantityInputs = document.querySelectorAll(".quantity-input") as NodeListOf<HTMLInputElement>;
            const messageInput = document.getElementById("messageInput") as HTMLTextAreaElement;

            if (!statusSelect) {
              Swal.showValidationMessage('Status select element not found');
              return false;
            }

            selectedStatus = statusSelect.value;
            message = messageInput?.value || "";

            console.log('Selected Status:', selectedStatus);
            console.log('Current Status:', currentStatus);
            console.log('Message:', message);

            if (["verified", "approved"].includes(selectedStatus) && ["request", "accepted"].includes(currentStatus)) {
              editedCartItems = order.cartItems.map((item, index) => ({
                ...item,
                quantity: parseInt(quantityInputs[index]?.value) || item.quantity,
              }));
            } else {
              editedCartItems = order.cartItems;
            }

            return true;
          } catch (error) {
            console.error('Error in preConfirm:', error);
            Swal.showValidationMessage('An error occurred while processing the form');
            return false;
          }
        },
        didOpen: () => {
          try {
            const statusSelect = document.getElementById("statusSelect") as HTMLSelectElement;
            const cartItemsContainer = document.getElementById("cartItemsContainer") as HTMLElement;

            if (statusSelect && cartItemsContainer) {
              statusSelect.addEventListener("change", () => {
                const newStatus = statusSelect.value;
                // Hide cart items for cancel status
                cartItemsContainer.style.display =
                  newStatus !== "cancel" && 
                  ["verified", "approved"].includes(newStatus) && 
                  ["request", "accepted"].includes(currentStatus)
                    ? "block"
                    : "none";
              });

              // Add focus styles for inputs
              const inputs = document.querySelectorAll("input, select, textarea");
              inputs.forEach((input) => {
                input.addEventListener("focus", () => {
                  (input as HTMLElement).style.borderColor = "#3B82F6";
                  (input as HTMLElement).style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                });
                input.addEventListener("blur", () => {
                  (input as HTMLElement).style.borderColor = "#D1D5DB";
                  (input as HTMLElement).style.boxShadow = "none";
                });
              });
            }
          } catch (error) {
            console.error('Error in didOpen:', error);
          }
        },
      });

      if (result.isConfirmed) {
        // Check if status actually changed
        if (selectedStatus === currentStatus && !message) {
          toastHelper.showTost("No changes made to the order status", "info");
          return;
        }

        try {
          // Don't send cart items for cancel status
          const cartItemsToSend =
            selectedStatus !== "cancel" && 
            ["request", "accepted"].includes(currentStatus) && 
            ["verified", "approved"].includes(selectedStatus)
              ? editedCartItems
              : undefined;

          console.log('Updating order status:', {
            orderId: order._id,
            selectedStatus,
            cartItemsToSend,
            message
          });

          const response = await AdminOrderService.updateOrderStatus(
            order._id,
            selectedStatus,
            cartItemsToSend,
            message || undefined
          );

          console.log('Update response:', response);

          if (response !== false) {
            // Success message is already shown in the service
            fetchOrders();
          }
        } catch (error) {
          console.error("Failed to update order status:", error);
          toastHelper.showTost("Failed to update order status", "error");
        }
      }
    } catch (error) {
      console.error("Error in handleUpdateStatus:", error);
      toastHelper.showTost("Failed to open status update modal", "error");
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
                        ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
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
      request: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700",
      verified: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700",
      approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700",
      shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-700",
      delivered: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-700",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-700",
      accepted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700",
      cancel: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-700",
    };

    // Determine the actual status to display
    let displayStatus = order.status;
    
    // Handle cancellation flow display
    if (order.orderTrackingStatus === "cancel") {
      displayStatus = "cancel";
    } else {
      // Priority: approved > verified > request
      // If order is approved, show "approved" regardless of other statuses
      if (order.approvedBy) {
        displayStatus = "approved";
      } else if (order.verifiedBy) {
        displayStatus = "request";
      } else {
        displayStatus = order.status;
      }
    }

    return (
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider ${
          statusStyles[displayStatus] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
        }`}
      >
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </span>
    );
  };

  const getVerificationBadge = (order: Order) => {
    // Show verified if verifiedBy exists OR if orderTrackingStatus is "verified"
    if (order?.verifiedBy || order?.orderTrackingStatus === "verified") {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
          Verified
        </span>
      );
    }
    return <span className="text-gray-500 dark:text-gray-400">-</span>;
  };

  return (
    <div className="p-4">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by order ID or customer..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              {getAvailableFilterStatuses().map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-lg bg-[#0071E0] text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              onClick={handleExport}
            >
              <i className="fas fa-download text-xs"></i>
              Export
            </button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Date
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Verification
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto mb-4"></div>
                      Loading Orders...
                    </div>
                  </td>
                </tr>
              ) : ordersData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      No orders found
                    </div>
                  </td>
                </tr>
              ) : (
                ordersData.map((order: Order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {order?.customerId?.name || order?.customerId?.email || order?.customerId?._id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {order.cartItems.map((item) => (
                        <div key={item?.productId?._id}>
                          {item?.skuFamilyId?.name || item?.productId?.name} (x{item.quantity})
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      ${formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {getStatusBadge(order)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {getVerificationBadge(order)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateStatus(order)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                          title="Update Status"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleViewTracking(order._id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          title="View Tracking"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
            Showing {ordersData.length} of {totalDocs} orders
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm transition-colors"
            >
              Previous
            </button>
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
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersTable;
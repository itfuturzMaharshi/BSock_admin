import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { format } from "date-fns";
import toastHelper from "../../utils/toastHelper";
import { AdminOrderService, Order, TrackingItem, OrderItem } from "../../services/order/adminOrder.services";

const OrdersTable: React.FC = () => {
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<{ [key: string]: string }>({});
  const [editedCartItems, setEditedCartItems] = useState<{ [key: string]: OrderItem[] }>({});
  const itemsPerPage = 10;

  const statusOptions = ["request", "verified", "approved", "shipped", "delivered", "cancelled"];

  useEffect(() => {
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

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setSelectedStatus((prev) => ({ ...prev, [orderId]: newStatus }));
    if (["request", "accepted"].includes(ordersData.find((o) => o._id === orderId)?.status || "") &&
        ["verified", "approved"].includes(newStatus)) {
      setEditOrderId(orderId);
      setEditedCartItems((prev) => ({
        ...prev,
        [orderId]: ordersData.find((o) => o._id === orderId)?.cartItems.map((item) => ({ ...item })) || [],
      }));
    } else {
      setEditOrderId(null);
    }
  };

  const handleQuantityChange = (orderId: string, itemId: string, newQuantity: string) => {
    setEditedCartItems((prev) => {
      const updatedItems = prev[orderId].map((item) =>
        item._id === itemId ? { ...item, quantity: parseInt(newQuantity) || 1 } : item
      );
      return { ...prev, [orderId]: updatedItems };
    });
  };

  const handleUpdateStatus = async (order: Order) => {
    const newStatus = selectedStatus[order._id] || order.status;
    if (!order._id || newStatus === order.status && !editedCartItems[order._id]) return;

    const confirmed = await Swal.fire({
      title: "Change Order Status",
      text: `Are you sure you want to change the status of this order to "${newStatus}"${
        editedCartItems[order._id] ? " and update quantities" : ""
      }?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, update it!",
      cancelButtonText: "No, cancel!",
    });

    if (confirmed.isConfirmed) {
      try {
        const cartItems = ["request", "accepted"].includes(order.status) && ["verified", "approved"].includes(newStatus)
          ? editedCartItems[order._id] || order.cartItems
          : undefined;
        const result = await AdminOrderService.updateOrderStatus(order._id, newStatus, cartItems);
        if (result !== false) {
          toastHelper.showTost(`Order status updated to ${newStatus}!`, "success");
          setEditOrderId(null);
          setEditedCartItems((prev) => {
            const updated = { ...prev };
            delete updated[order._id];
            return updated;
          });
          fetchOrders();
        }
      } catch (error) {
        console.error("Failed to update order status:", error);
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
                        ${item.changedBy || "-"}
                      </td>
                      <td style="padding: 8px; border: 1px solid #ddd;">
                        ${item.userType}
                      </td>
                      <td style="padding: 8px; border: 1px solid #ddd;">
                        ${format(new Date(item.changedAt), "yyyy-MM-dd HH:mm")}
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
    const statusColors: { [key: string]: string } = {
      request: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      verified: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      delivered: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      accepted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          statusColors[order.status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-4 max-w-[calc(100vw-360px)] mx-auto">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by order ID or customer..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-4 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Order ID
                </th>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Actions
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Tracking
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
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {order._id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {order.customerId.name || order.customerId.email || order.customerId._id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {editOrderId === order._id &&
                      ["request", "accepted"].includes(order.status) &&
                      ["verified", "approved"].includes(selectedStatus[order._id] || "") ? (
                        editedCartItems[order._id]?.map((item) => (
                          <div key={item._id} className="flex items-center gap-2 mb-2">
                            <span>{item.skuFamilyId?.name || item.productId.name} (x</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(order._id, item._id, e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm"
                            />
                            <span>)</span>
                          </div>
                        ))
                      ) : (
                        order.cartItems.map((item) => (
                          <div key={item._id}>
                            {item.skuFamilyId?.name || item.productId.name} (x{item.quantity})
                          </div>
                        ))
                      )}
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
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedStatus[order._id] || order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleUpdateStatus(order)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-sm"
                          disabled={!selectedStatus[order._id] && !editedCartItems[order._id]}
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <button
                        onClick={() => handleViewTracking(order._id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        title="View Tracking"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
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
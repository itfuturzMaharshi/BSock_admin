import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { format } from "date-fns";
import toastHelper from "../../utils/toastHelper";
import { AdminOrderService, Order, TrackingItem, OrderItem } from "../../services/order/adminOrder.services";
import { LOCAL_STORAGE_KEYS } from "../../constants/localStorage";
import OrderDetailsModal from "./OrderDetailsModal";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermissions } from "../../context/PermissionsContext";

const OrdersTable: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canVerifyApprove = hasPermission('/orders', 'verifyApprove');
  
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentAdminId, setCurrentAdminId] = useState<string>("");
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [itemsPerPage] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);

  const allStatusOptions = ["requested", "rejected", "verify", "approved", "confirm", "waiting_for_payment", "payment_received", "packing", "ready_to_ship", "on_the_way", "ready_to_pick", "delivered", "cancelled"];
  
  // Get available status options for filter dropdown based on admin
  const getAvailableFilterStatuses = (): string[] => {
    // For now, show all statuses in filter dropdown
    // This can be customized based on specific admin requirements
    return allStatusOptions;
  };

  useEffect(() => {
    // Get current admin ID from localStorage
    // Try ADMIN_ID first, then USER_ID as fallback
    let adminId = localStorage.getItem(LOCAL_STORAGE_KEYS.ADMIN_ID) || "";
    if (!adminId) {
      adminId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID) || "";
    }
    // Also try to get from user object if available
    if (!adminId) {
      const userStr = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          adminId = user._id || user.id || "";
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }
    }
    setCurrentAdminId(adminId);
    fetchOrders();
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  // Reset to first page when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

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
        debouncedSearchTerm || undefined,
        statusFilter || undefined
      );
      setOrdersData(response.data.docs);
      setTotalPages(response.data.totalPages);
      setTotalDocs(response.data.totalDocs || 0);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrdersData([]);
      setTotalPages(1);
      setTotalDocs(0);
    } finally {
      setLoading(false);
    }
  };

  // Get available status options based on current order and admin
  const getAvailableStatusOptions = async (order: Order): Promise<string[]> => {
    // Get current admin ID (refresh from localStorage to ensure we have latest)
    let adminId = currentAdminId;
    if (!adminId) {
      adminId = localStorage.getItem(LOCAL_STORAGE_KEYS.ADMIN_ID) || "";
      if (!adminId) {
        adminId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID) || "";
      }
      if (!adminId) {
        const userStr = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            adminId = user._id || user.id || "";
          } catch (e) {
            console.error('Error parsing user from localStorage:', e);
          }
        }
      }
    }
    
    const currentStatus = order.status;
    const orderTrackingStatus = order.orderTrackingStatus;
    
    // If order is already cancelled, no status options
    if (currentStatus === "cancelled" || orderTrackingStatus === "cancelled") {
      return ["cancelled"];
    }
    
    // Get dynamic stages from backend based on order's location and currency
    // Backend will include internal admin stages (verify, approved) in the response
    let orderStages: string[] = [];
    try {
      if (order.currentLocation && order.deliveryLocation && order.currency) {
        orderStages = await AdminOrderService.getOrderStages(
          order.currentLocation,
          order.deliveryLocation,
          order.currency
        );
      } else {
        // Fallback to default stages including internal admin stages
        orderStages = ["requested", "rejected", "verify", "approved", "confirm", "waiting_for_payment", "payment_received", "packing", "ready_to_ship", "on_the_way", "ready_to_pick", "delivered", "cancelled"];
      }
    } catch (error) {
      console.error('Error fetching order stages:', error);
      // Fallback to default stages including internal admin stages
      orderStages = ["requested", "rejected", "verify", "approved", "confirm", "waiting_for_payment", "payment_received", "packing", "ready_to_ship", "on_the_way", "ready_to_pick", "delivered", "cancelled"];
    }
    
    // Show only next/previous stages (progressive flow)
    const currentIndex = orderStages.indexOf(currentStatus);
    const availableStatuses: string[] = [];
    
    // Always include current status
    availableStatuses.push(currentStatus);
    
    // Add next stage in flow
    if (currentIndex >= 0 && currentIndex < orderStages.length - 1) {
      const nextStage = orderStages[currentIndex + 1];
      if (nextStage && nextStage !== "cancelled") {
        availableStatuses.push(nextStage);
      }
    }
    
    // Add previous stage (for going back)
    if (currentIndex > 0) {
      availableStatuses.push(orderStages[currentIndex - 1]);
    }
    
    // Special handling for requested status - can go to verify, rejected, or cancelled
    if (currentStatus === "requested") {
      if (!availableStatuses.includes("verify")) availableStatuses.push("verify");
      if (!availableStatuses.includes("rejected")) availableStatuses.push("rejected");
    }
    
    // Special handling for verify status - can go to approved or back to requested
    if (currentStatus === "verify") {
      if (!availableStatuses.includes("approved")) availableStatuses.push("approved");
      if (!availableStatuses.includes("requested")) availableStatuses.push("requested");
    }
    
    // Always allow rejected and cancelled
    if (!availableStatuses.includes("rejected")) availableStatuses.push("rejected");
    if (!availableStatuses.includes("cancelled")) availableStatuses.push("cancelled");
    
    // Filter based on admin permissions
    // Extract verifiedBy and approvedBy IDs properly
    let verifiedById: string | null = null;
    let approvedById: string | null = null;
    
    // Handle verifiedBy - can be object with _id, string, or null
    if (order.verifiedBy) {
      if (typeof order.verifiedBy === 'object' && order.verifiedBy !== null) {
        // Handle both { _id: ... } and direct ID
        verifiedById = (order.verifiedBy as any)._id ? String((order.verifiedBy as any)._id) : 
                      (order.verifiedBy as any).id ? String((order.verifiedBy as any).id) : 
                      String(order.verifiedBy);
      } else if (typeof order.verifiedBy === 'string') {
        verifiedById = order.verifiedBy;
      }
    }
    
    // Handle approvedBy - can be object with _id, string, or null
    if (order.approvedBy) {
      if (typeof order.approvedBy === 'object' && order.approvedBy !== null) {
        // Handle both { _id: ... } and direct ID
        approvedById = (order.approvedBy as any)._id ? String((order.approvedBy as any)._id) : 
                       (order.approvedBy as any).id ? String((order.approvedBy as any).id) : 
                       String(order.approvedBy);
      } else if (typeof order.approvedBy === 'string') {
        approvedById = order.approvedBy;
      }
    }
    
    // Normalize currentAdminId for comparison - ensure it's a string
    // Use the adminId we just retrieved
    const normalizedCurrentAdminId = adminId ? String(adminId).trim() : '';
    
    // Normalize verifiedById and approvedById for comparison
    const normalizedVerifiedById = verifiedById ? String(verifiedById).trim() : null;
    const normalizedApprovedById = approvedById ? String(approvedById).trim() : null;
    
    // If order is already verified, don't show verify option
    if (normalizedVerifiedById) {
      const verifyIndex = availableStatuses.indexOf("verify");
      if (verifyIndex >= 0) {
        availableStatuses.splice(verifyIndex, 1);
      }
    }
    
    // If order is already approved, don't show approved option
    if (normalizedApprovedById) {
      const approvedIndex = availableStatuses.indexOf("approved");
      if (approvedIndex >= 0) {
        availableStatuses.splice(approvedIndex, 1);
      }
    }
    
    // Critical: If current admin verified the order, hide "approved" option (same admin cannot approve)
    // Compare both normalized strings
    if (normalizedVerifiedById && normalizedCurrentAdminId) {
      const isMatch = normalizedVerifiedById === normalizedCurrentAdminId;
      if (isMatch) {
        const approvedIndex = availableStatuses.indexOf("approved");
        if (approvedIndex >= 0) {
          availableStatuses.splice(approvedIndex, 1);
          console.log('✅ Removed "approved" option - Current admin verified this order', {
            currentAdminId: normalizedCurrentAdminId,
            verifiedById: normalizedVerifiedById
          });
        }
      }
    }
    
    // If current admin approved the order, hide "verify" option (same admin cannot verify)
    if (normalizedApprovedById && normalizedCurrentAdminId) {
      const isMatch = normalizedApprovedById === normalizedCurrentAdminId;
      if (isMatch) {
        const verifyIndex = availableStatuses.indexOf("verify");
        if (verifyIndex >= 0) {
          availableStatuses.splice(verifyIndex, 1);
          console.log('✅ Removed "verify" option - Current admin approved this order', {
            currentAdminId: normalizedCurrentAdminId,
            approvedById: normalizedApprovedById
          });
        }
      }
    }
    
    return [...new Set(availableStatuses)];
  };

  const handleUpdateStatus = async (order: Order) => {
    try {
      // Ensure we have the latest admin ID
      let adminId = currentAdminId;
      if (!adminId) {
        adminId = localStorage.getItem(LOCAL_STORAGE_KEYS.ADMIN_ID) || "";
        if (!adminId) {
          adminId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID) || "";
        }
        if (!adminId) {
          const userStr = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              adminId = user._id || user.id || "";
            } catch (e) {
              console.error('Error parsing user from localStorage:', e);
            }
          }
        }
      }
      
      const currentStatus = order.status;
      const availableStatusOptions = await getAvailableStatusOptions(order);
      
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
      // Payment method removed - will be handled in separate module
      let selectedOtherCharges: number | null = order.otherCharges || null;
      let selectedImages: File[] = [];

      // Get order stages to check if we can edit order
      let orderStages: string[] = [];
      try {
        if (order.currentLocation && order.deliveryLocation && order.currency) {
          orderStages = await AdminOrderService.getOrderStages(
            order.currentLocation,
            order.deliveryLocation,
            order.currency
          );
        }
      } catch (error) {
        console.error('Error fetching order stages:', error);
      }
      
      // Debug: Log cart items to check MOQ availability (NOT stock)
      console.log('Order cart items for MOQ check:', order.cartItems.map(item => {
        const productId = item.productId;
        const isPopulated = productId && typeof productId === 'object' && productId !== null;
        return {
          productIdType: typeof productId,
          moq: isPopulated && 'moq' in productId ? productId.moq : ((item as any).moq || 'not found'),
          stock: isPopulated && 'stock' in productId ? productId.stock : ((item as any).stock || 'not found'),
          usingMoq: isPopulated && 'moq' in productId && productId.moq != null && productId.moq > 0 ? productId.moq : 1,
        };
      }));

      // Create a simpler modal HTML structure
      const modalHtml = `
        <div style="text-align: left; padding: 20px; font-family: 'Inter', sans-serif; max-height: 600px; overflow-y: auto;">
          <div style="margin-bottom: 20px;">
            <label for="statusSelect" style="display: block; font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 8px;">Select Status</label>
            <select id="statusSelect" style="width: 100%; padding: 10px; font-size: 14px; margin:0px; border: 1px solid #D1D5DB; border-radius: 6px; background-color: #F9FAFB; color: #1F2937; outline: none; transition: border-color 0.2s;">
              ${availableStatusOptions
                .map(
                  (status) =>
                    `<option value="${status}" ${
                      status === currentStatus ? "selected" : ""
                    }>${status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}</option>`
                )
                .join("")}
            </select>
          </div>
          <div id="cartItemsContainer" style="margin-bottom: 20px; display: none;">
            <h4 style="font-size: 16px; font-weight: 600; color: #1F2937; margin-bottom: 12px;">Edit Quantities</h4>
            ${order.cartItems
              .map(
                (item, index) => {
                  // Helper function to get MOQ from item (NOT stock)
                  const getMoq = () => {
                    // Check if productId is populated object with moq
                    if (item.productId && typeof item.productId === 'object' && item.productId !== null) {
                      // Explicitly check for moq property, not stock
                      if ('moq' in item.productId && item.productId.moq != null && item.productId.moq > 0) {
                        return item.productId.moq;
                      }
                    }
                    // Check if moq is directly on item (from cart)
                    if ((item as any).moq != null && (item as any).moq > 0) {
                      return (item as any).moq;
                    }
                    // Default to 1 (NOT stock)
                    return 1;
                  };
                  
                  const moq = getMoq();
                  
                  return `
                  <div style="margin-bottom: 16px; padding: 12px; background-color: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">
                      ${item.skuFamilyId?.name || (item.productId && typeof item.productId === 'object' ? item.productId.name : 'Product')}
                      ${moq > 1 ? `<span style="font-size: 12px; color: #6B7280; font-weight: normal;"> (MOQ: ${moq})</span>` : ''}
                    </label>
                    <input
                      type="number"
                      min="${moq}"
                      value="${item.quantity}"
                      class="quantity-input"
                      data-item-index="${index}"
                      data-moq="${moq}"
                      style="width: 100%; margin:0px; padding: 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px; background-color: #FFFFFF; color: #1F2937; outline: none; transition: border-color 0.2s;"
                    />
                    ${moq > 1 ? `<p style="font-size: 11px; color: #6B7280; margin-top: 4px; margin-bottom: 0;">Minimum order quantity: ${moq}</p>` : ''}
                  </div>
                  `;
                }
              )
              .join("")}
          </div>
          <div id="otherChargesContainer" style="margin-bottom: 20px;">
            <label for="otherChargesInput" style="display: block; font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 8px;">Other Charges (Optional)</label>
            <input
              type="number"
              id="otherChargesInput"
              min="0"
              step="0.01"
              value="${selectedOtherCharges || ''}"
              placeholder="Enter other charges amount"
              style="width: 100%; margin:0px; padding: 10px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px; background-color: #F9FAFB; color: #1F2937; outline: none; transition: border-color 0.2s;"
            />
            <p style="font-size: 12px; color: #6B7280; margin-top: 4px;">Note: Other charges can only be added before WAITING_FOR_PAYMENT stage</p>
          </div>
          <div id="imagesContainer" style="margin-bottom: 20px;">
            <label for="imagesInput" style="display: block; font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 8px;">Upload Images (Optional)</label>
            <input
              type="file"
              id="imagesInput"
              multiple
              accept="image/*"
              style="width: 100%; margin:0px; padding: 10px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px; background-color: #F9FAFB; color: #1F2937; outline: none; transition: border-color 0.2s;"
            />
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
            const otherChargesInput = document.getElementById("otherChargesInput") as HTMLInputElement;
            const imagesInput = document.getElementById("imagesInput") as HTMLInputElement;

            if (!statusSelect) {
              Swal.showValidationMessage('Status select element not found');
              return false;
            }

            selectedStatus = statusSelect.value;
            message = messageInput?.value || "";
            // Payment method removed - will be handled in separate module
            
            // Get otherCharges
            if (otherChargesInput) {
              const otherChargesValue = otherChargesInput.value;
              selectedOtherCharges = otherChargesValue ? parseFloat(otherChargesValue) : null;
              if (selectedOtherCharges !== null && selectedOtherCharges < 0) {
                Swal.showValidationMessage('Other charges cannot be negative');
                return false;
              }
            }

            // Get images
            if (imagesInput && imagesInput.files) {
              selectedImages = Array.from(imagesInput.files);
            }

            // Payment method selection will be handled in a separate module
            // No validation needed here

            // Check if otherCharges can be added (only before WAITING_FOR_PAYMENT)
            if (selectedOtherCharges !== null && selectedOtherCharges > 0) {
              if (orderStages && orderStages.length > 0) {
                const waitingForPaymentIndex = orderStages.indexOf('waiting_for_payment');
                const currentStatusIndex = orderStages.indexOf(selectedStatus);
                if (waitingForPaymentIndex !== -1 && currentStatusIndex >= waitingForPaymentIndex) {
                  Swal.showValidationMessage('Other charges can only be added before WAITING_FOR_PAYMENT stage');
                  return false;
                }
              }
            }

            console.log('Selected Status:', selectedStatus);
            console.log('Current Status:', currentStatus);
            // Payment method removed - will be handled in separate module
            console.log('Message:', message);
            console.log('Other Charges:', selectedOtherCharges);
            console.log('Images:', selectedImages.length);

            // Cart items editing allowed only for VERIFY status
            // Validate MOQ when editing quantities
            if (selectedStatus === "verify" && quantityInputs && quantityInputs.length > 0) {
              editedCartItems = order.cartItems.map((item, index) => {
                const inputValue = quantityInputs[index]?.value;
                const newQuantity = inputValue ? parseInt(inputValue, 10) : item.quantity;
                // Get MOQ from data attribute (set from productId.moq or item.moq)
                const moq = parseInt(quantityInputs[index]?.getAttribute('data-moq') || '1', 10);
                
                if (isNaN(newQuantity) || newQuantity < moq) {
                  const productName = item.skuFamilyId?.name || 
                    (item.productId && typeof item.productId === 'object' ? item.productId.name : 'Product');
                  throw new Error(`Quantity for "${productName}" must be at least ${moq} (MOQ)`);
                }
                
                return {
                  ...item,
                  quantity: newQuantity,
                };
              });
            } else {
              // For other statuses, use original cart items (no editing allowed)
              editedCartItems = order.cartItems;
            }

            return true;
          } catch (error: any) {
            console.error('Error in preConfirm:', error);
            const errorMessage = error?.message || error?.toString() || 'An error occurred while processing the form';
            Swal.showValidationMessage(errorMessage);
            return false;
          }
        },
        didOpen: () => {
          try {
            const statusSelect = document.getElementById("statusSelect") as HTMLSelectElement;
            const cartItemsContainer = document.getElementById("cartItemsContainer") as HTMLElement;

            if (statusSelect && cartItemsContainer) {
              // Payment method selection removed - will be handled in separate module
              
              // Set initial visibility based on current status
              if (cartItemsContainer) {
                cartItemsContainer.style.display = currentStatus === "verify" ? "block" : "none";
              }
              
              statusSelect.addEventListener("change", () => {
                const newStatus = statusSelect.value;
                // Payment method selection removed - will be handled in separate module
                // Show cart items editing only for VERIFY status (where EDIT_ORDER is allowed)
                if (cartItemsContainer) {
                  // Show cart items editing for VERIFY status only
                  cartItemsContainer.style.display = newStatus === "verify" ? "block" : "none";
                }
                // Show/hide otherCharges based on stage
                const otherChargesContainer = document.getElementById("otherChargesContainer") as HTMLElement;
                if (otherChargesContainer) {
                  const waitingForPaymentIndex = orderStages.indexOf('waiting_for_payment');
                  const newStatusIndex = orderStages.indexOf(newStatus);
                  if (waitingForPaymentIndex !== -1 && newStatusIndex >= waitingForPaymentIndex) {
                    otherChargesContainer.style.display = "none";
                  } else {
                    otherChargesContainer.style.display = "block";
                  }
                }
              });
              
              // Payment method selection removed - will be handled in separate module

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
          // Don't send cart items for cancelled status
          // Allow editing when approving from requested or verify status
          // Cart items editing allowed only for VERIFY status
          // Send edited cart items only when status is VERIFY
          const cartItemsToSend = selectedStatus === "verify" && editedCartItems ? editedCartItems : undefined;

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
            message || undefined,
            undefined, // Payment method removed - will be handled in separate module
            selectedOtherCharges !== null ? selectedOtherCharges : undefined,
            selectedImages.length > 0 ? selectedImages : undefined
          );

          console.log('Update response:', response);

          if (response !== false) {
            // Success message is already shown in the service
            fetchOrders();
            Swal.close(); // Close the modal on success
          } else {
            // Error message is already shown in the service
            throw new Error('Failed to update order status');
          }
        } catch (error: any) {
          console.error("Failed to update order status:", error);
          const errorMessage = error?.response?.data?.message || error?.message || "Failed to update order status";
          toastHelper.showTost(errorMessage, "error");
          // Don't close the modal on error so user can retry
        }
      }
    } catch (error) {
      console.error("Error in handleUpdateStatus:", error);
      toastHelper.showTost("Failed to open status update modal", "error");
    }
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
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

      const baseUrl = import.meta.env.VITE_BASE_URL || '';
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
                <th style="padding: 8px; border: 1px solid #ddd;">Images</th>
              </tr>
            </thead>
            <tbody>
              ${trackingItems
                .map(
                  (item) => `
                    <tr>
                      <td style="padding: 8px; border: 1px solid #ddd;">
                        ${item.status.charAt(0).toUpperCase() + item.status.slice(1).replace(/_/g, ' ')}
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
                      <td style="padding: 8px; border: 1px solid #ddd;">
                        ${item.images && item.images.length > 0 
                          ? item.images.map((img: string, idx: number) => {
                              const imageUrl = img.startsWith('http') ? img : `${baseUrl}/${img.replace(/^\/+/, '')}`;
                              return `<a href="${imageUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-right: 8px;">
                                <img src="${imageUrl}" alt="Image ${idx + 1}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;" />
                              </a>`;
                            }).join('')
                          : "-"}
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

  // Combined status function that merges status and verification into one message
  const getCombinedStatusBadge = (order: Order) => {
    const status = order.status?.toLowerCase() || 'request';
    const orderTrackingStatus = order.orderTrackingStatus?.toLowerCase();

    // Handle cancellation flow
    if (orderTrackingStatus === "cancel" && status === "cancel") {
      return {
        message: "cancel",
        style: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-700",
      };
    }
    if (orderTrackingStatus === "verified" && status === "cancel") {
      return {
        message: "Request is cancelled",
        style: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-700",
      };
    }

    // Handle different status combinations
    let statusMessage = "";
    let statusStyle = "";

    // Status flow: requested → approved → accepted → ready_to_pickup → out_for_delivery → delivered
    
    switch (status) {
      case "requested":
        statusMessage = "Requested";
        statusStyle = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700";
        break;

      case "rejected":
        statusMessage = "Rejected";
        statusStyle = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-700";
        break;

      case "verify":
        statusMessage = "Verify";
        statusStyle = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700";
        break;

      case "approved":
        statusMessage = "Approved";
        statusStyle = "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700";
        break;

      case "confirm":
        statusMessage = "Confirm";
        statusStyle = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700";
        break;

      case "waiting_for_payment":
        statusMessage = "Waiting for Payment";
        statusStyle = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-700";
        break;

      case "payment_received":
        statusMessage = "Payment Received";
        statusStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700";
        break;

      case "packing":
        statusMessage = "Packing";
        statusStyle = "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-700";
        break;

      case "ready_to_ship":
        statusMessage = "Ready to Ship";
        statusStyle = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700";
        break;

      case "on_the_way":
        statusMessage = "On the Way";
        statusStyle = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-700";
        break;

      case "ready_to_pick":
        statusMessage = "Ready to Pick";
        statusStyle = "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700";
        break;

      case "delivered":
        statusMessage = "Delivered";
        statusStyle = "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-700";
        break;

      case "cancelled":
        statusMessage = "Cancelled";
        statusStyle = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-700";
        break;

      default:
        // Fallback for any other status
        const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
        statusMessage = `Request is ${capitalizedStatus}`;
        statusStyle = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-700";
    }

    return {
      message: statusMessage,
      style: statusStyle,
    };
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
                placeholder="Search by Customer Name or other..."
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
                  {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
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
                  Shipping Country
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Date
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto mb-4"></div>
                      Loading Orders...
                    </div>
                  </td>
                </tr>
              ) : ordersData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
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
                      {order.shippingAddress?.country ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {order.shippingAddress.country.charAt(0).toUpperCase() + order.shippingAddress.country.slice(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {(() => {
                        const statusInfo = getCombinedStatusBadge(order);
                        return (
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider ${statusInfo.style}`}
                          >
                            {statusInfo.message}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="inline-flex items-center gap-3">
                        {canVerifyApprove && (
                          <button
                            onClick={() => handleUpdateStatus(order)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            title="Update Status"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        )}
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          title="View Order Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => handleViewTracking(order._id)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                          title="View Tracking"
                        >
                          <i className="fas fa-route"></i>
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

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </div>
  );
};

export default OrdersTable;

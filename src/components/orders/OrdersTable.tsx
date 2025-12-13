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
    
    // IMPORTANT: Hide "verify" option if order was modified but customer hasn't confirmed yet
    // Admin can only verify AFTER customer confirms (isConfirmedByCustomer must be true)
    // Check if order was modified (has token) and customer hasn't confirmed
    if (order.modificationConfirmationToken !== null && order.modificationConfirmationToken !== undefined) {
      if (!order.isConfirmedByCustomer) {
        const verifyIndex = availableStatuses.indexOf("verify");
        if (verifyIndex >= 0) {
          availableStatuses.splice(verifyIndex, 1);
          console.log('✅ Removed "verify" option - Customer has not confirmed order modifications yet (isConfirmedByCustomer is false)', {
            hasToken: !!order.modificationConfirmationToken,
            isConfirmed: order.isConfirmedByCustomer
          });
        }
      }
    }
    // Also check if quantities were modified but no token sent yet (quantitiesModified flag)
    if (order.quantitiesModified && !order.modificationConfirmationToken) {
      const verifyIndex = availableStatuses.indexOf("verify");
      if (verifyIndex >= 0) {
        availableStatuses.splice(verifyIndex, 1);
        console.log('✅ Removed "verify" option - Quantities were modified but confirmation email not sent yet');
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
          <div id="deliveredWarningContainer" style="display: none; margin-top: 20px; padding: 12px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px;">
            <p style="margin: 0; font-size: 13px; color: #92400E; font-weight: 500;">
              <strong>⚠️ Important:</strong> To change status to DELIVERED, you must:
            </p>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 12px; color: #92400E;">
              <li>Ensure customer has added receiver details (name & mobile)</li>
              <li>Send OTP to receiver mobile number</li>
              <li>Verify the OTP successfully</li>
            </ul>
            ${order.receiverDetails?.mobile ? `
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #92400E;">
                <strong>Receiver Mobile:</strong> ${order.receiverDetails.mobile}
              </p>
            ` : ''}
            ${order.deliveryOTPVerified ? `
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #059669; font-weight: 600;">
                ✅ OTP Verified - Ready to mark as delivered
              </p>
            ` : order.deliveryOTP ? `
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #DC2626; font-weight: 600;">
                ❌ OTP Not Verified - Please verify OTP first
              </p>
            ` : `
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #DC2626; font-weight: 600;">
                ❌ OTP Not Sent - Please send OTP first
              </p>
            `}
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
                // Show/hide delivered warning
                const deliveredWarningContainer = document.getElementById("deliveredWarningContainer") as HTMLElement;
                if (deliveredWarningContainer) {
                  deliveredWarningContainer.style.display = newStatus === "delivered" ? "block" : "none";
                }
              });
              
              // Set initial visibility for delivered warning
              const deliveredWarningContainer = document.getElementById("deliveredWarningContainer") as HTMLElement;
              if (deliveredWarningContainer) {
                deliveredWarningContainer.style.display = currentStatus === "delivered" ? "block" : "none";
              }
              
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

  const handleSendConfirmation = async (order: Order) => {
    try {
      const isResend = order.modificationConfirmationToken !== null && order.modificationConfirmationToken !== undefined;
      const result = await Swal.fire({
        title: isResend ? 'Resend Confirmation Email' : 'Send Confirmation Email',
        text: `Are you sure you want to ${isResend ? 'resend' : 'send'} the order modification confirmation email to ${order.customerId?.email || 'the customer'}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: isResend ? 'Yes, Resend' : 'Yes, Send',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#0071E0',
      });

      if (result.isConfirmed) {
        await AdminOrderService.resendModificationConfirmation(order._id);
        toastHelper.showTost(
          isResend 
            ? 'Confirmation email resent successfully!' 
            : 'Confirmation email sent successfully!',
          'success'
        );
        fetchOrders(); // Refresh orders list
      }
    } catch (error: any) {
      console.error('Error sending confirmation email:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send confirmation email';
      toastHelper.showTost(errorMessage, 'error');
    }
  };

  const handleSendDeliveryOTP = async (order: Order) => {
    try {
      if (!order.receiverDetails?.mobile) {
        toastHelper.showTost('Receiver mobile number is required. Customer must add receiver details first.', 'error');
        return;
      }

      const result = await Swal.fire({
        title: 'Send Delivery OTP',
        text: `Send OTP to ${order.receiverDetails.mobile} for order delivery verification?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Send OTP',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#0071E0',
      });

      if (result.isConfirmed) {
        await AdminOrderService.sendDeliveryOTP(order._id);
        fetchOrders(); // Refresh orders list
      }
    } catch (error: any) {
      console.error('Error sending delivery OTP:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send OTP';
      toastHelper.showTost(errorMessage, 'error');
    }
  };

  const handleVerifyDeliveryOTP = async (order: Order) => {
    try {
      const { value: otp } = await Swal.fire({
        title: 'Verify Delivery OTP',
        text: `Enter the OTP sent to ${order.receiverDetails?.mobile || 'receiver'}`,
        input: 'text',
        inputPlaceholder: 'Enter 6-digit OTP',
        inputAttributes: {
          maxlength: 6,
          pattern: '[0-9]{6}',
        },
        showCancelButton: true,
        confirmButtonText: 'Verify OTP',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#0071E0',
        inputValidator: (value) => {
          if (!value) {
            return 'Please enter the OTP';
          }
          if (!/^\d{6}$/.test(value)) {
            return 'OTP must be 6 digits';
          }
        },
      });

      if (otp) {
        await AdminOrderService.verifyDeliveryOTP(order._id, otp);
        fetchOrders(); // Refresh orders list
      }
    } catch (error: any) {
      console.error('Error verifying delivery OTP:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to verify OTP';
      toastHelper.showTost(errorMessage, 'error');
    }
  };

  const handleViewTracking = async (orderId: string, initialPage: number = 1) => {
    try {
      const limit = 10; // Items per page
      let currentPage = initialPage;
      
      const loadTrackingPage = async (page: number): Promise<{ html: string; pagination: any } | null> => {
        const response = await AdminOrderService.getOrderTracking(orderId, page, limit);
        const trackingData = response.data;
        const trackingItems: TrackingItem[] = trackingData.docs || [];

        if (trackingItems.length === 0 && page === 1) {
          await Swal.fire({
            title: "No Tracking Information",
            text: "No tracking details are available for this order.",
            icon: "info",
            confirmButtonText: "OK",
          });
          return null;
        }

        const baseUrl = import.meta.env.VITE_BASE_URL || '';
        
        // Build pagination controls HTML
        const paginationHtml = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding: 12px; background-color: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb;">
            <div style="font-size: 14px; color: #6b7280; font-weight: 500;">
              Showing ${((trackingData.page - 1) * trackingData.limit) + 1} to ${Math.min(trackingData.page * trackingData.limit, trackingData.totalDocs)} of ${trackingData.totalDocs} entries
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button id="prevPageBtn" 
                      style="padding: 6px 12px; background-color: ${!trackingData.hasPrevPage ? '#d1d5db' : '#3b82f6'}; color: white; border: none; border-radius: 4px; cursor: ${!trackingData.hasPrevPage ? 'not-allowed' : 'pointer'}; font-size: 14px;"
                      ${!trackingData.hasPrevPage ? 'disabled' : ''}>
                Previous
              </button>
              <span style="font-size: 14px; color: #374151; padding: 0 12px; font-weight: 500;">
                Page ${trackingData.page} of ${trackingData.totalPages}
              </span>
              <button id="nextPageBtn"
                      style="padding: 6px 12px; background-color: ${!trackingData.hasNextPage ? '#d1d5db' : '#3b82f6'}; color: white; border: none; border-radius: 4px; cursor: ${!trackingData.hasNextPage ? 'not-allowed' : 'pointer'}; font-size: 14px;"
                      ${!trackingData.hasNextPage ? 'disabled' : ''}>
                Next
              </button>
            </div>
          </div>
        `;

        const trackingHtml = `
          <div style="text-align: left;">
            <h3 style="margin-bottom: 16px; color: #1f2937;">Tracking Details for Order ${orderId}</h3>
            <div style="max-height: 500px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead style="position: sticky; top: 0; background-color: #f4f4f4; z-index: 10;">
                  <tr>
                    <th style="padding: 10px; border: 1px solid #ddd; background-color: #f9fafb; font-weight: 600;">Status</th>
                    <th style="padding: 10px; border: 1px solid #ddd; background-color: #f9fafb; font-weight: 600;">Changed By</th>
                    <th style="padding: 10px; border: 1px solid #ddd; background-color: #f9fafb; font-weight: 600;">User Type</th>
                    <th style="padding: 10px; border: 1px solid #ddd; background-color: #f9fafb; font-weight: 600;">Changed At</th>
                    <th style="padding: 10px; border: 1px solid #ddd; background-color: #f9fafb; font-weight: 600;">Message</th>
                    <th style="padding: 10px; border: 1px solid #ddd; background-color: #f9fafb; font-weight: 600;">Images</th>
                  </tr>
                </thead>
                <tbody>
                  ${trackingItems
                    .map(
                      (item) => {
                        // Ensure images is an array
                        const images = Array.isArray(item.images) ? item.images : (item.images ? [item.images] : []);
                        
                        return `
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
                            ${images.length > 0 
                              ? images.map((img: string, idx: number) => {
                                  // Ensure image path is correct - handle both relative and absolute paths
                                  let imageUrl = img;
                                  if (!img || typeof img !== 'string') {
                                    console.warn('Invalid image path:', img);
                                    return '';
                                  }
                                  
                                  // Normalize the path
                                  if (!img.startsWith('http')) {
                                    // If path starts with uploads/, prepend /
                                    if (img.startsWith('uploads/')) {
                                      imageUrl = `/${img}`;
                                    } else if (!img.startsWith('/')) {
                                      // If path doesn't start with /, prepend /uploads/
                                      imageUrl = `/uploads/${img}`;
                                    } else {
                                      imageUrl = img;
                                    }
                                  }
                                  
                                  // Construct full URL
                                  const fullImageUrl = imageUrl.startsWith('http') 
                                    ? imageUrl 
                                    : `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
                                  
                                  return `<a href="${fullImageUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-right: 8px; margin-bottom: 4px;">
                                    <img src="${fullImageUrl}" alt="Image ${idx + 1}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; cursor: pointer;" 
                                         onerror="this.onerror=null; this.src='https://via.placeholder.com/50?text=Error'; console.error('Image failed to load:', '${fullImageUrl}');" />
                                  </a>`;
                                }).filter(img => img !== '').join('')
                              : "-"}
                          </td>
                        </tr>
                      `;
                      }
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            ${paginationHtml}
          </div>
        `;

        return { html: trackingHtml, pagination: trackingData };
      };

      // Load initial page
      const initialData = await loadTrackingPage(currentPage);
      if (!initialData) return;

      // Show modal with pagination
      let currentPagination = initialData.pagination;

      const showTrackingModal = async (page: number) => {
        const pageData = await loadTrackingPage(page);
        if (!pageData) return;

        currentPagination = pageData.pagination;

        const result = await Swal.fire({
          title: "Order Tracking",
          html: pageData.html,
          width: 950,
          showConfirmButton: true,
          confirmButtonText: "Close",
          didOpen: () => {
            // Add event listeners for pagination buttons
            const prevBtn = document.getElementById('prevPageBtn');
            const nextBtn = document.getElementById('nextPageBtn');

            if (prevBtn && currentPagination.hasPrevPage) {
              prevBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (currentPagination.hasPrevPage) {
                  Swal.close();
                  await showTrackingModal(currentPagination.prevPage || 1);
                }
              };
            }

            if (nextBtn && currentPagination.hasNextPage) {
              nextBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (currentPagination.hasNextPage) {
                  Swal.close();
                  await showTrackingModal(currentPagination.nextPage || 1);
                }
              };
            }
          }
        });
      };

      await showTrackingModal(currentPage);

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
                        {/* Show send/resend confirmation button ONLY when quantities were modified */}
                        {canVerifyApprove && 
                         (order.status === 'requested' || order.status === 'verify') &&
                         order.quantitiesModified &&
                         (!order.isConfirmedByCustomer) && (
                          <button
                            onClick={() => handleSendConfirmation(order)}
                            className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                            title={
                              order.modificationConfirmationToken 
                                ? (order.modificationConfirmationExpiry && new Date(order.modificationConfirmationExpiry) < new Date()
                                    ? "Resend Confirmation Email (Expired)" 
                                    : "Resend Confirmation Email")
                                : "Send Confirmation Email"
                            }
                          >
                            <i className="fas fa-envelope"></i>
                          </button>
                        )}
                        {/* Show OTP send/verify buttons when status is ready_to_pick, ready_to_ship, on_the_way, or delivered */}
                        {canVerifyApprove && 
                         (order.status === 'ready_to_pick' || order.status === 'ready_to_ship' || order.status === 'on_the_way' || order.status === 'delivered') &&
                         order.receiverDetails?.mobile && (
                          <>
                            {!order.deliveryOTPVerified && (
                              <>
                                {!order.deliveryOTP && (
                                  <button
                                    onClick={() => handleSendDeliveryOTP(order)}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                    title="Send Delivery OTP"
                                  >
                                    <i className="fas fa-sms"></i>
                                  </button>
                                )}
                                {order.deliveryOTP && (
                                  <button
                                    onClick={() => handleVerifyDeliveryOTP(order)}
                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                    title={
                                      order.deliveryOTPExpiry && new Date(order.deliveryOTPExpiry) < new Date()
                                        ? "Verify OTP (Expired - Resend Required)"
                                        : "Verify Delivery OTP"
                                    }
                                  >
                                    <i className="fas fa-check-circle"></i>
                                  </button>
                                )}
                              </>
                            )}
                            {order.deliveryOTPVerified && (
                              <span className="text-green-600 dark:text-green-400" title="OTP Verified">
                                <i className="fas fa-check-circle"></i>
                              </span>
                            )}
                          </>
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

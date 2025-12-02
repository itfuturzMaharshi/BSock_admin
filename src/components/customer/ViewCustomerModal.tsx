import React from "react";
import { Customer } from "../../services/customer/customerService";
import { format } from "date-fns";

interface ViewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const ViewCustomerModal: React.FC<ViewCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  if (!isOpen || !customer) return null;

  const imageBaseUrl = import.meta.env.VITE_BASE_URL;

  const getImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return null;
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Otherwise, prepend the base URL
    return `${imageBaseUrl}/${imagePath}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: boolean | undefined, trueLabel: string, falseLabel: string) => {
    if (status) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          {trueLabel}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        {falseLabel}
      </span>
    );
  };

  const getApprovalStatusBadge = (status: string | undefined) => {
    if (!status) return "N/A";
    const statusLower = status.toLowerCase();
    if (statusLower === "approved") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Approved
        </span>
      );
    } else if (statusLower === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Pending
        </span>
      );
    } else if (statusLower === "rejected") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Rejected
        </span>
      );
    }
    return status;
  };

  // Get customer avatar or placeholder
  const getCustomerAvatar = () => {
    if (customer.businessProfile?.logo) {
      return getImageUrl(customer.businessProfile.logo);
    }
    // Return a placeholder or user icon
    return "https://ui-avatars.com/api/?name=" + encodeURIComponent(customer.name || "Customer") + "&background=0071E0&color=fff&size=64";
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <img
              src={getCustomerAvatar() || "https://ui-avatars.com/api/?name=Customer&background=0071E0&color=fff&size=64"}
              alt={customer.name}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 flex-shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(customer.name || "Customer") + "&background=0071E0&color=fff&size=64";
              }}
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                {customer.name || "Customer"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customer Details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 flex-shrink-0"
            title="Close"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Status Badge */}
          <div className="mb-6">
            {getStatusBadge(customer.isActive, "Active", "Inactive")}
          </div>

          {/* Vertical Layout */}
          <div className="space-y-6">
            {/* Customer Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Customer Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md capitalize">
                    {customer.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    {customer.email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Number
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    {customer.mobileCountryCode && customer.mobileNumber
                      ? `${customer.mobileCountryCode} ${customer.mobileNumber}`
                      : customer.mobileNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp Number
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    {customer.whatsappCountryCode && customer.whatsappNumber
                      ? `${customer.whatsappCountryCode} ${customer.whatsappNumber}`
                      : customer.whatsappNumber || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Verified
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    {getStatusBadge(customer.isEmailVerified, "Verified", "Not Verified")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Verified
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    {getStatusBadge(customer.isMobileVerified, "Verified", "Not Verified")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Approved Status
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    {getStatusBadge(customer.isApproved, "Approved", "Pending")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Allow Bidding
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    {getStatusBadge(customer.isAllowBidding, "Allowed", "Not Allowed")}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Category
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  {typeof customer.customerCategory === 'object' && customer.customerCategory !== null
                    ? customer.customerCategory.title
                    : customer.customerCategory || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Created At
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  {formatDate((customer as any).createdAt)}
                </p>
              </div>
            </div>

            {/* Horizontal Separator */}
            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Business Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Business Information
              </h3>

              {customer.businessProfile ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business Name
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md font-medium">
                        {customer.businessProfile.businessName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business Status
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        {getApprovalStatusBadge(customer.businessProfile.status)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Country
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        {customer.businessProfile.country || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Currency Code
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        {customer.businessProfile.currencyCode || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {customer.businessProfile.address || "N/A"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <i className="fas fa-briefcase text-4xl mb-2"></i>
                  <p>No business profile information available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCustomerModal;

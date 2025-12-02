import React, { useState } from "react";
import { BidProductService } from "../../services/bidProducts/bidProduct.services";
import { BidProduct } from "../../services/bidProducts/bidProduct.services";
import toastHelper from "../../utils/toastHelper";

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: BidProduct | null;
  onSuccess?: () => void;
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (!isOpen) {
      setMessage("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!product?._id) {
      toastHelper.error("Product information is missing");
      return;
    }

    if (!message.trim()) {
      toastHelper.warning("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    try {
      await BidProductService.sendMessageToHighestBidder(product._id, message.trim());
      toastHelper.success("Message sent successfully to highest bidder!");
      setMessage("");
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toastHelper.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Send Message to Highest Bidder
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isSubmitting}
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-4">
          {product && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Product:</strong> {product.description || product.model || "N/A"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Lot Number:</strong> {product.lotNumber || "N/A"}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message to the highest bidder..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={6}
              maxLength={5000}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {message.length}/5000 characters
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0071E0] hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <i className="fas fa-spinner fa-spin"></i>
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <i className="fas fa-paper-plane"></i>
                Send Message
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendMessageModal;


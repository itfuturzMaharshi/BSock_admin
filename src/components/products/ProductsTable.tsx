import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { format } from "date-fns";
import toastHelper from "../../utils/toastHelper";
import ProductModal from "./ProductModal";
import UploadExcelModal from "./UploadExcelModal";
import { ProductService, Product } from "../../services/product/product.services";

const ProductsTable: React.FC = () => {
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  // Fetch products on component mount and when page/search changes
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getProductList(
        currentPage,
        itemsPerPage,
        searchTerm
      );
      setProductsData(response.data.docs);
      setTotalDocs(response.data.totalDocs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (productData: any) => {
    try {
      // Convert string values to numbers where needed
      const processedData = {
        ...productData,
        price:
          typeof productData.price === "string"
            ? parseFloat(productData.price)
            : productData.price,
        stock:
          typeof productData.stock === "string"
            ? parseInt(productData.stock)
            : productData.stock,
        moq:
          typeof productData.moq === "string"
            ? parseInt(productData.moq)
            : productData.moq,
      };

      if (editProduct && editProduct._id) {
        // Update existing product
        await ProductService.updateProduct(editProduct._id, processedData);
        toastHelper.showTost("Product updated successfully!", "success");
      } else {
        // Create new product
        await ProductService.createProduct(processedData);
        toastHelper.showTost("Product added successfully!", "success");
      }
      setIsModalOpen(false);
      setEditProduct(null);
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (!product._id) return;

    const confirmed = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
    });

    if (confirmed.isConfirmed) {
      try {
        await ProductService.deleteProduct(product._id);
        toastHelper.showTost("Product deleted successfully!", "success");
        fetchProducts(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  const handleVerify = async (product: Product) => {
    if (!product._id) return;

    const confirmed = await Swal.fire({
      title: "Verify Product",
      text: "Are you sure you want to verify this product?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, verify it!",
      cancelButtonText: "No, cancel!",
    });

    if (confirmed.isConfirmed) {
      try {
        const result = await ProductService.verifyProduct(product._id);
        if (result !== false) {
          fetchProducts(); // Refresh the list only if successful
        }
      } catch (error) {
        console.error("Failed to verify product:", error);
      }
    }
  };

  const handleApprove = async (product: Product) => {
    if (!product._id) return;

    const confirmed = await Swal.fire({
      title: "Approve Product",
      text: "Are you sure you want to approve this product?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, approve it!",
      cancelButtonText: "No, cancel!",
    });

    if (confirmed.isConfirmed) {
      try {
        const result = await ProductService.approveProduct(product._id);
        if (result !== false) {
          fetchProducts(); // Refresh the list only if successful
        }
      } catch (error) {
        console.error("Failed to approve product:", error);
      }
    }
  };

  // Safely derive a displayable SKU Family text from possibly-populated object
  const getSkuFamilyText = (skuFamilyId: any): string => {
    if (skuFamilyId == null) return "";
    if (typeof skuFamilyId === "string") return skuFamilyId;
    if (typeof skuFamilyId === "object") {
      return skuFamilyId.name || skuFamilyId.code || skuFamilyId._id || "";
    }
    return String(skuFamilyId);
  };

  // Build an absolute image URL similar to SkuFamily table
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

  // Prefer the first image from populated skuFamily when available
  const getProductImageSrc = (product: Product): string => {
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

  // Helper function to safely format price
  const formatPrice = (price: number | string): string => {
    if (typeof price === "string") {
      const num = parseFloat(price);
      return isNaN(num) ? "0.00" : num.toFixed(2);
    }
    return price.toFixed(2);
  };

  // Format expiryTime for display
  const formatExpiryTime = (expiryTime: string): string => {
    if (!expiryTime) return "-";
    try {
      const date = new Date(expiryTime);
      return format(date, "yyyy-MM-dd HH:mm");
    } catch {
      return "-";
    }
  };

  // Get status badge for product
  const getStatusBadge = (product: Product) => {
    if (product.isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <i className="fas fa-check-circle mr-1"></i>
          Approved
        </span>
      );
    } else if (product.isVerified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <i className="fas fa-clock mr-1"></i>
          Under Approval
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <i className="fas fa-exclamation-circle mr-1"></i>
          Under Verification
        </span>
      );
    }
  };

  return (
    <div className="p-4 max-w-[calc(100vw-360px)] mx-auto">
      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        {/* Table Header with Controls */}
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by SKU Family ID or other..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-[#0071E0] text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <i className="fas fa-upload text-xs"></i>
              Upload File
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-[#0071E0] text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              onClick={() => {
                setEditProduct(null);
                setIsModalOpen(true);
              }}
            >
              <i className="fas fa-plus text-xs"></i>
              Add Product
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th
                  rowSpan={2}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle"
                >
                  Image
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle"
                >
                  SKU Family ID
                </th>
                <th
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700"
                >
                  Specification
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle"
                >
                  Condition
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle"
                >
                  Price
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle"
                >
                  Stock
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle"
                >
                  Country
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle"
                >
                  MOQ
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle"
                >
                  Is Negotiable
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle"
                >
                  Is Flash Deal
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle"
                >
                  Expiry Time
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle"
                >
                  Status
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle"
                >
                  Actions
                </th>
              </tr>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  SIM Type
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  RAM
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Storage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={16} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto mb-4"></div>
                      Loading Products...
                    </div>
                  </td>
                </tr>
              ) : productsData.length === 0 ? (
                <tr>
                  <td colSpan={16} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      No products found
                    </div>
                  </td>
                </tr>
              ) : (
                productsData.map((item: Product, index: number) => (
                  <tr
                    key={item._id || index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <img
                        src={getProductImageSrc(item)}
                        alt={getSkuFamilyText(item.skuFamilyId) || "Product"}
                        className="w-12 h-12 object-contain rounded-md border border-gray-200 dark:border-gray-600"
                  
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {getSkuFamilyText(item.skuFamilyId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.simType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.color}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.ram}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.storage}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.condition}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      ${formatPrice(item.price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {typeof item.stock === "string"
                        ? parseInt(item.stock) || 0
                        : item.stock}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.country}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {typeof item.moq === "string"
                        ? parseInt(item.moq) || 0
                        : item.moq}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.isNegotiable ? "Yes" : "No"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.isFlashDeal === "true" ? "Yes" : "No"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatExpiryTime(item.expiryTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {getStatusBadge(item)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!item.isVerified && (
                          <button
                            onClick={() => handleVerify(item)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                            title="Verify Product"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        {item.isVerified && !item.isApproved && (
                          <button
                            onClick={() => handleApprove(item)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="Approve Product"
                          >
                            <i className="fas fa-thumbs-up"></i>
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors"
                          title="Edit Product"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Delete Product"
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
            Showing {productsData.length} of {totalDocs} items
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

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditProduct(null);
        }}
        onSave={handleSave}
        editItem={editProduct || undefined}
      />
      <UploadExcelModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};

export default ProductsTable;
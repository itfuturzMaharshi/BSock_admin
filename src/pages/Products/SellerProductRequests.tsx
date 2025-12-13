import React, { useState, useEffect } from 'react';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { ProductService, Product } from '../../services/product/product.services';
import SellerProductReviewModal from '../../components/products/SellerProductReviewModal';
import SubmitAdminDetailsModal from '../../components/products/SubmitAdminDetailsModal';
import placeholderImage from '../../../public/images/product/noimage.jpg';
import { useDebounce } from '../../hooks/useDebounce';
import toastHelper from '../../utils/toastHelper';

const SellerProductRequests: React.FC = () => {
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isAdminDetailsModalOpen, setIsAdminDetailsModalOpen] = useState<boolean>(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getSellerProductRequests(
        currentPage,
        itemsPerPage,
        debouncedSearchTerm
      );
      setProductsData(response.data.docs || []);
      setTotalDocs(response.data.totalDocs || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch seller product requests:', error);
      setProductsData([]);
      setTotalPages(1);
      setTotalDocs(0);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (product: Product) => {
    setSelectedProduct(product);
    setIsReviewModalOpen(true);
  };

  const handleReject = async (product: Product) => {
    if (!product._id) return;
    
    const reason = window.prompt('Enter rejection reason (optional):');
    try {
      await ProductService.rejectSellerProductRequest(product._id, reason || undefined);
      fetchProducts();
    } catch (error) {
      console.error('Failed to reject product request:', error);
    }
  };

  const handleAddDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsAdminDetailsModalOpen(true);
  };

  const handleVerify = async (product: Product) => {
    if (!product._id) return;
    try {
      await ProductService.verifyProduct(product._id);
      toastHelper.showTost('Product verified successfully!', 'success');
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to verify product:', error);
      toastHelper.showTost(error.message || 'Failed to verify product', 'error');
    }
  };

  const handleApprove = async (product: Product) => {
    if (!product._id) return;
    try {
      await ProductService.approveProduct(product._id);
      toastHelper.showTost('Product approved successfully!', 'success');
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to approve product:', error);
      toastHelper.showTost(error.message || 'Failed to approve product', 'error');
    }
  };

  const getSkuFamilyText = (skuFamilyId: any): string => {
    if (!skuFamilyId) return 'N/A';
    if (typeof skuFamilyId === 'object' && skuFamilyId.name) {
      return skuFamilyId.name;
    }
    return String(skuFamilyId);
  };

  const getProductImageSrc = (product: Product): string => {
    if (product.skuFamilyId && typeof product.skuFamilyId === 'object' && product.skuFamilyId.images && product.skuFamilyId.images.length > 0) {
      return product.skuFamilyId.images[0];
    }
    return placeholderImage;
  };

  const getStatusBadge = (product: Product) => {
    if (product.isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Approved
        </span>
      );
    }
    if (product.isVerified && !product.isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Pending Approval
        </span>
      );
    }
    // Check if product needs admin details
    if ((product as any).needsAdminDetails || (product.status === 'pending_admin_details' && !(product as any).adminDetailsSubmitted)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          Pending Admin Details
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        Pending Review
      </span>
    );
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Seller Product Requests" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Seller Product Requests
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Review and approve products submitted by sellers
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : productsData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No seller product requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                      Image
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                      Price
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {productsData.map((product) => (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <img
                          src={getProductImageSrc(product)}
                          alt={getSkuFamilyText(product.skuFamilyId)}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = placeholderImage;
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {getSkuFamilyText(product.skuFamilyId)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {product.color} • {product.storage} • {product.ram}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(product)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {product.stock || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {product.countryDeliverables && product.countryDeliverables.length > 0
                          ? `$${product.countryDeliverables[0].usd || 0}`
                          : '$0'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {/* Show "Add Details" button if product needs admin details */}
                          {((product as any).needsAdminDetails || (product.status === 'pending_admin_details' && !(product as any).adminDetailsSubmitted)) ? (
                            <button
                              onClick={() => handleAddDetails(product)}
                              className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                            >
                              Add Details
                            </button>
                          ) : (
                            <>
                              {/* Show Verify button if admin details submitted but not verified */}
                              {!(product as any).adminDetailsSubmitted || !product.isVerified ? (
                                <button
                                  onClick={() => handleVerify(product)}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Verify
                                </button>
                              ) : null}
                              {/* Show Approve button if verified but not approved */}
                              {product.isVerified && !product.isApproved && (
                                <button
                                  onClick={() => handleApprove(product)}
                                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Approve
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => handleReview(product)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleReject(product)}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalDocs)} of {totalDocs} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Details Modal */}
      {selectedProduct && (
        <SubmitAdminDetailsModal
          isOpen={isAdminDetailsModalOpen}
          onClose={() => {
            setIsAdminDetailsModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onSuccess={fetchProducts}
        />
      )}

      {/* Review Modal */}
      {selectedProduct && (
        <SellerProductReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onUpdate={fetchProducts}
        />
      )}
    </>
  );
};

export default SellerProductRequests;

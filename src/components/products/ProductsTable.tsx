import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { format } from "date-fns";
import toastHelper from "../../utils/toastHelper";
import ProductModal from "./ProductsModal";
import UploadExcelModal from "./UploadExcelModal";
import ProductHistoryModal from "./ProductHistoryModal";
import {
  ProductService,
  Product,
} from "../../services/product/product.services";
import placeholderImage from "../../../public/images/product/noimage.jpg";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermissions } from "../../context/PermissionsContext";

interface ProductsTableProps {
  loggedInAdminId?: string; 
}

const ProductsTable: React.FC<ProductsTableProps> = ({ loggedInAdminId }) => {
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission('/products', 'write');
  const canVerifyApprove = hasPermission('/products', 'verifyApprove');
  
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all"); // "all" | "moveToTop" | "expiredOnly" | "soldOut" | "showTimer"
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [historyProductId, setHistoryProductId] = useState<string | undefined>(undefined);
  const [historyProductName, setHistoryProductName] = useState<string | undefined>(undefined);
  const itemsPerPage = 10;
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [bulkActionDropdownOpen, setBulkActionDropdownOpen] = useState<boolean>(false);

  const handleExport = async () => {
    try {
      const blob = await ProductService.exportProductsExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toastHelper.showTost('Export started', 'success');
    } catch (error) {}
  };

  // Fetch products on component mount and when page/search/filter changes
  useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedSearchTerm, statusFilter, productFilter]);

  // Reset to first page when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
      if (!(event.target as HTMLElement).closest(".dropdown-container")) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    const handleResize = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, [openDropdownId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('fetchProducts - productFilter:', productFilter);
      const moveToTop = productFilter === "moveToTop";
      const expiredOnly = productFilter === "expiredOnly";
      const soldOut = productFilter === "soldOut";
      const showTimer = productFilter === "showTimer";
      const response = await ProductService.getProductList(
        currentPage,
        itemsPerPage,
        debouncedSearchTerm,
        moveToTop,
        expiredOnly,
        soldOut,
        showTimer
      );
      console.log('fetchProducts - response data count:', response.data.docs.length);

      let filteredData = response.data.docs;

      // Apply status filter
      if (statusFilter !== "all") {
        filteredData = response.data.docs.filter((product: Product) => {
          if (statusFilter === "approved") {
            return product.isApproved;
          } else if (statusFilter === "pending") {
            return product.isVerified && !product.isApproved;
          } else if (statusFilter === "verification") {
            return !product.isVerified;
          }
          return true;
        });
      }

      setProductsData(filteredData);
      
      // Use API's totalDocs and totalPages for pagination
      // But if filtering client-side, we need to recalculate based on filtered results
      if (statusFilter !== "all") {
        // When filtering client-side, we can't use server pagination properly
        // For now, use the filtered count but this is not ideal
        // TODO: Move status filtering to server-side
        setTotalDocs(filteredData.length);
        setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
      } else {
        // Use server pagination when no filter is applied
        const totalDocsFromAPI = response.data.totalDocs || 0;
        const totalPagesFromAPI = response.data.totalPages;
        
        setTotalDocs(totalDocsFromAPI);
        
        // If API provides totalPages, use it; otherwise calculate from totalDocs
        if (totalPagesFromAPI !== undefined && totalPagesFromAPI !== null) {
          setTotalPages(totalPagesFromAPI);
        } else {
          // Fallback: calculate from totalDocs if available
          setTotalPages(Math.ceil(totalDocsFromAPI / itemsPerPage));
        }
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProductsData([]);
      setTotalPages(1);
      setTotalDocs(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (productData: any) => {
    try {
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
        await ProductService.updateProduct(editProduct._id, processedData);
        toastHelper.showTost("Product updated successfully!", "success");
      } else {
        await ProductService.createProduct(processedData);
        toastHelper.showTost("Product added successfully!", "success");
      }
      setIsModalOpen(false);
      setEditProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setIsModalOpen(true);
    setOpenDropdownId(null);
    setDropdownPosition(null);
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
        fetchProducts();
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
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
          fetchProducts();
        }
      } catch (error) {
        console.error("Failed to verify product:", error);
      }
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
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
          fetchProducts();
        }
      } catch (error) {
        console.error("Failed to approve product:", error);
      }
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleHistory = (product: Product) => {
    setHistoryProductId(product._id);
    setHistoryProductName(getSkuFamilyText(product.skuFamilyId));
    setIsHistoryModalOpen(true);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleToggleSelect = (productId: string | undefined) => {
    if (!productId) return;
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProductIds.size === productsData.length) {
      setSelectedProductIds(new Set());
    } else {
      const allIds = productsData
        .map((p) => p._id)
        .filter((id): id is string => Boolean(id));
      setSelectedProductIds(new Set(allIds));
    }
  };

  const handleToggleSequence = async () => {
    if (selectedProductIds.size === 0) {
      toastHelper.showTost('Please select at least one product', 'warning');
      return;
    }

    const confirmed = await Swal.fire({
      title: 'Toggle Sequence',
      text: `Are you sure you want to toggle sequence for ${selectedProductIds.size} product(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, toggle it!',
      cancelButtonText: 'No, cancel!',
    });

    if (confirmed.isConfirmed) {
      try {
        const productIdsArray = Array.from(selectedProductIds);
        await ProductService.toggleSequence(productIdsArray);
        setSelectedProductIds(new Set());
        fetchProducts();
      } catch (error) {
        console.error('Failed to toggle sequence:', error);
      }
    }
  };

  const handleExpire = async (product: Product) => {
    if (!product._id) return;

    const confirmed = await Swal.fire({
      title: 'Expire Product',
      text: 'Are you sure you want to expire this product? It will be hidden from the frontend.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, expire it!',
      cancelButtonText: 'No, cancel!',
    });

    if (confirmed.isConfirmed) {
      try {
        await ProductService.expireProducts(product._id);
        setSelectedProductIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(product._id!);
          return newSet;
        });
        fetchProducts();
      } catch (error) {
        console.error('Failed to expire product:', error);
      }
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleBulkExpire = async () => {
    if (selectedProductIds.size === 0) {
      toastHelper.showTost('Please select at least one product', 'warning');
      return;
    }

    const confirmed = await Swal.fire({
      title: 'Expire Products',
      text: `Are you sure you want to expire ${selectedProductIds.size} product(s)? They will be hidden from the frontend.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, expire them!',
      cancelButtonText: 'No, cancel!',
    });

    if (confirmed.isConfirmed) {
      try {
        const productIdsArray = Array.from(selectedProductIds);
        await ProductService.expireProducts(productIdsArray);
        setSelectedProductIds(new Set());
        fetchProducts();
      } catch (error) {
        console.error('Failed to expire products:', error);
      }
    }
  };

  const handleBulkToggleTimer = async () => {
    if (selectedProductIds.size === 0) {
      toastHelper.showTost('Please select at least one product', 'warning');
      return;
    }

    // Check current timer state of selected products
    const selectedProducts = productsData.filter(p => p._id && selectedProductIds.has(p._id));
    const allHaveTimer = selectedProducts.every(p => p.isShowTimer === true);
    
    // Determine new state: if all have timer, disable; otherwise enable
    const newTimerState = !allHaveTimer;
    const actionText = newTimerState ? 'enable' : 'disable';

    const confirmed = await Swal.fire({
      title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Timer`,
      text: `Are you sure you want to ${actionText} timer for ${selectedProductIds.size} product(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText} it!`,
      cancelButtonText: 'No, cancel!',
    });

    if (confirmed.isConfirmed) {
      try {
        const productIdsArray = Array.from(selectedProductIds);
        await ProductService.toggleTimer(productIdsArray, newTimerState);
        setSelectedProductIds(new Set());
        fetchProducts();
      } catch (error) {
        console.error('Failed to toggle timer:', error);
      }
    }
  };

  const handleMarkSoldOut = async () => {
    if (selectedProductIds.size === 0) {
      toastHelper.showTost('Please select at least one product', 'warning');
      return;
    }

    const confirmed = await Swal.fire({
      title: 'Mark as Sold Out',
      text: `Are you sure you want to mark ${selectedProductIds.size} product(s) as sold out? This will set their stock to 0.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, mark as sold out!',
      cancelButtonText: 'No, cancel!',
    });

    if (confirmed.isConfirmed) {
      try {
        const productIdsArray = Array.from(selectedProductIds);
        await ProductService.markSoldOut(productIdsArray);
        setSelectedProductIds(new Set());
        fetchProducts();
      } catch (error) {
        console.error('Failed to mark products as sold out:', error);
      }
    }
  };

  const handleBulkVerify = async () => {
    if (selectedProductIds.size === 0) {
      toastHelper.showTost('Please select at least one product', 'warning');
      return;
    }

    const confirmed = await Swal.fire({
      title: 'Verify Products',
      text: `Are you sure you want to verify ${selectedProductIds.size} product(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, verify them!',
      cancelButtonText: 'No, cancel!',
    });

    if (confirmed.isConfirmed) {
      try {
        const productIdsArray = Array.from(selectedProductIds);
        await ProductService.bulkVerify(productIdsArray);
        setSelectedProductIds(new Set());
        fetchProducts();
      } catch (error) {
        console.error('Failed to verify products:', error);
      }
    }
  };

  const handleBulkApprove = async () => {
    if (selectedProductIds.size === 0) {
      toastHelper.showTost('Please select at least one product', 'warning');
      return;
    }

    const confirmed = await Swal.fire({
      title: 'Approve Products',
      text: `Are you sure you want to approve ${selectedProductIds.size} product(s)? Products must be verified first.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve them!',
      cancelButtonText: 'No, cancel!',
    });

    if (confirmed.isConfirmed) {
      try {
        const productIdsArray = Array.from(selectedProductIds);
        await ProductService.bulkApprove(productIdsArray);
        setSelectedProductIds(new Set());
        fetchProducts();
      } catch (error) {
        console.error('Failed to approve products:', error);
      }
    }
  };

  const handleMoveToTop = async (product: Product) => {
    if (!product._id) return;

    const confirmed = await Swal.fire({
      title: 'Move to Top',
      text: 'Are you sure you want to move this product to the top?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, move it!',
      cancelButtonText: 'No, cancel!',
    });

    if (confirmed.isConfirmed) {
      try {
        await ProductService.moveToTop(product._id);
        fetchProducts();
      } catch (error) {
        console.error('Failed to move product to top:', error);
      }
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const getSkuFamilyText = (skuFamilyId: any): string => {
    if (skuFamilyId == null) return "";
    if (typeof skuFamilyId === "string") return skuFamilyId;
    if (typeof skuFamilyId === "object") {
      return skuFamilyId.name || skuFamilyId.code || skuFamilyId._id || "";
    }
    return String(skuFamilyId);
  };

  const getSubSkuFamilyText = (subSkuFamilyId: any): string => {
    if (subSkuFamilyId == null) return "";
    if (typeof subSkuFamilyId === "string") return subSkuFamilyId;
    if (typeof subSkuFamilyId === "object") {
      return subSkuFamilyId.name || subSkuFamilyId.code || subSkuFamilyId._id || "";
    }
    return String(subSkuFamilyId);
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

  const getProductImageSrc = (product: Product): string => {
    try {
      // First, try to get image from subSkuFamilyId
      const subSku = product?.subSkuFamilyId as any;
      const subSkuFirst =
        Array.isArray(subSku?.images) && subSku.images.length > 0
          ? subSku.images[0]
          : "";
      if (subSkuFirst) return buildImageUrl(subSkuFirst);
      
      // If no subSkuFamilyId image, try skuFamilyId
      const sku = product?.skuFamilyId as any;
      const first =
        Array.isArray(sku?.images) && sku.images.length > 0
          ? sku.images[0]
          : "";
      if (first) return buildImageUrl(first);
    } catch (_) {}
    return placeholderImage;
  };

  const renderProductBadges = (product: Product) => {
    const badges = [];
    
    if (product.simType) {
      badges.push({ label: product.simType, tooltip: `SIM Type: ${product.simType}` });
    }
    if (product.color) {
      badges.push({ label: product.color, tooltip: `Color: ${product.color}` });
    }
    if (product.ram) {
      badges.push({ label: product.ram, tooltip: `RAM: ${product.ram}` });
    }
    if (product.storage) {
      badges.push({ label: product.storage, tooltip: `Storage: ${product.storage}` });
    }

    if (badges.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-1 mt-2">
        {badges.map((badge, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-gray-400 dark:text-gray-500 mx-0.5">•</span>
            )}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700 cursor-pointer transition-colors hover:bg-blue-200 dark:hover:bg-blue-900/50"
              title={badge.tooltip}
            >
              {badge.label}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const formatPrice = (price: number | string): string => {
    if (price === null || price === undefined) return "-";
    if (typeof price === "string") {
      const num = parseFloat(price);
      return isNaN(num) ? "0.00" : num.toFixed(2);
    }
    return price.toFixed(2);
  };

  const getCountryPrice = (product: Product, country: "Hongkong" | "Dubai"): string => {
    // Prefer structured countryDeliverables if present
    if (Array.isArray(product.countryDeliverables) && product.countryDeliverables.length > 0) {
      const entry = product.countryDeliverables.find((cd) => cd.country === country);
      if (entry) {
        const usd = entry.usd ?? entry.price;
        if (usd !== undefined && usd !== null) {
          return `$${formatPrice(usd)}`;
        }
      }
    }

    // Fallback to legacy fields for backward compatibility
    if (country === "Hongkong" && product.country === "Hongkong") {
      return `$${formatPrice(product.price)}`;
    }
    if (country === "Dubai" && product.country === "Dubai") {
      return `$${formatPrice(product.price)}`;
    }

    return "-";
  };

  const formatExpiryTime = (expiryTime: string): string => {
    if (!expiryTime) return "-";
    try {
      const date = new Date(expiryTime);
      return format(date, "MMM dd, yyyy");
    } catch {
      return "-";
    }
  };

  // Updated getStatusBadge function to match reference code styling and icons
  const getStatusBadge = (product: Product) => {
    let statusText: string;
    let statusStyles: string;
    let statusIcon: string;

    if (product.isApproved) {
      statusText = "Approved";
      statusStyles =
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700";
      statusIcon = "fa-check-circle";
    } else if (product.isVerified) {
      statusText = "Pending Approval";
      statusStyles =
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700";
      statusIcon = "fa-clock";
    } else {
      statusText = "Under Verification";
      statusStyles =
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-700";
      statusIcon = "fa-times";
    }

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider ${statusStyles}`}
      >
        <i className={`fas ${statusIcon} text-xs`}></i>
        {statusText}
      </span>
    );
  };

  return (
    <div className="p-4">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by SKU Family Name or other..."
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
                value={productFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setProductFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer min-w-[180px]"
              >
                <option value="all">All Products</option>
                <option value="moveToTop">Moved to Top</option>
                <option value="expiredOnly">Expired Only</option>
                <option value="soldOut">Sold Out</option>
                <option value="showTimer">Timer Enabled</option>
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Approval</option>
                <option value="verification">Under Verification</option>
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
            </div>
            <div className="flex items-center gap-1">
              {selectedProductIds.size > 0 && (
                <div className="relative">
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                    onClick={() => setBulkActionDropdownOpen(!bulkActionDropdownOpen)}
                  >
                    <i className="fas fa-cog text-xs"></i>
                    Actions ({selectedProductIds.size})
                    <i className={`fas fa-chevron-${bulkActionDropdownOpen ? 'up' : 'down'} text-xs`}></i>
                  </button>
                  {bulkActionDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setBulkActionDropdownOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
                        <div className="py-1" role="menu">
                          {canWrite && (
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              onClick={() => {
                                setBulkActionDropdownOpen(false);
                                handleToggleSequence();
                              }}
                            >
                              <i className="fas fa-sort-numeric-down text-xs text-yellow-600"></i>
                              Toggle Sequence
                            </button>
                          )}
                          {canVerifyApprove && (
                            <>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                onClick={() => {
                                  setBulkActionDropdownOpen(false);
                                  handleBulkExpire();
                                }}
                              >
                                <i className="fas fa-clock text-xs text-red-600"></i>
                                Expire
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                onClick={() => {
                                  setBulkActionDropdownOpen(false);
                                  handleBulkToggleTimer();
                                }}
                              >
                                <i className="fas fa-stopwatch text-xs text-purple-600"></i>
                                Toggle Timer
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                onClick={() => {
                                  setBulkActionDropdownOpen(false);
                                  handleMarkSoldOut();
                                }}
                              >
                                <i className="fas fa-box text-xs text-orange-600"></i>
                                Mark as Sold Out
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                onClick={() => {
                                  setBulkActionDropdownOpen(false);
                                  handleBulkVerify();
                                }}
                              >
                                <i className="fas fa-check-circle text-xs text-green-600"></i>
                                Verify
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                onClick={() => {
                                  setBulkActionDropdownOpen(false);
                                  handleBulkApprove();
                                }}
                              >
                                <i className="fas fa-check-double text-xs text-blue-600"></i>
                                Approve
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {canWrite && (
                <>
                  <button
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0071E0] text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    <i className="fas fa-upload text-xs"></i>
                    Import
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0071E0] text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                    onClick={() => {
                      setEditProduct(null);
                      setIsModalOpen(true);
                    }}
                  >
                    <i className="fas fa-plus text-xs"></i>
                    Add Product
                  </button>
                </>
              )}
              <button
                className="inline-flex items-center gap-1 rounded-lg bg-[#0071E0] text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                onClick={handleExport}
              >
                <i className="fas fa-download text-xs"></i>
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  <input
                    type="checkbox"
                    checked={productsData.length > 0 && selectedProductIds.size === productsData.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Sub Sku Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  HK Price (USD)
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Dubai Price (USD)
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
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
                      Loading Products...
                    </div>
                  </td>
                </tr>
              ) : productsData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      No products found
                    </div>
                  </td>
                </tr>
              ) : (
                productsData.map((item: Product, index: number) => (
                  <tr
                    key={item._id || index}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      item.sequence !== null && item.sequence !== undefined
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={item._id ? selectedProductIds.has(item._id) : false}
                        onChange={() => handleToggleSelect(item._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={getProductImageSrc(item) || placeholderImage}
                        alt={getSkuFamilyText(item?.skuFamilyId) || "Product"}
                        className="w-12 h-12 object-cover rounded-md border border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            placeholderImage;
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {getSkuFamilyText(item.skuFamilyId)}
                      </div>
                      {renderProductBadges(item)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {getSubSkuFamilyText(item.subSkuFamilyId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {getCountryPrice(item, "Hongkong")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {getCountryPrice(item, "Dubai")}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {getStatusBadge(item)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center relative">
                      <div className="dropdown-container relative">
                        <button
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openDropdownId === item._id) {
                              setOpenDropdownId(null);
                              setDropdownPosition(null);
                            } else {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              const dropdownWidth = 192;
                              const dropdownHeight = 200; // Adjusted for more options
                              let top = rect.bottom + 8;
                              let left = rect.right - dropdownWidth;

                              if (top + dropdownHeight > window.innerHeight) {
                                top = rect.top - dropdownHeight - 8;
                              }
                              if (left < 8) {
                                left = 8;
                              }
                              if (
                                left + dropdownWidth >
                                window.innerWidth - 8
                              ) {
                                left = window.innerWidth - dropdownWidth - 8;
                              }

                              setDropdownPosition({ top, left });
                              setOpenDropdownId(item._id || null);
                            }
                          }}
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                        {openDropdownId === item._id && dropdownPosition && (
                          <div
                            className="fixed w-48 bg-white border rounded-md shadow-lg"
                            style={{
                              top: `${dropdownPosition.top}px`,
                              left: `${dropdownPosition.left}px`,
                              zIndex: 9999,
                            }}
                          >
                            {canVerifyApprove && item.canVerify &&
                              item.verifiedBy !== loggedInAdminId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVerify(item);
                                  }}
                                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-green-600"
                                >
                                  <i className="fas fa-check"></i>
                                  Verify
                                </button>
                              )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(item);
                              }}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600"
                            >
                              <i className="fas fa-eye"></i>
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHistory(item);
                              }}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-purple-600"
                            >
                              <i className="fas fa-history"></i>
                              History
                            </button>
                            {canVerifyApprove && item.canApprove &&
                              item.verifiedBy !== loggedInAdminId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(item);
                                  }}
                                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600"
                                >
                                  <i className="fas fa-thumbs-up"></i>
                                  Approve
                                </button>
                              )}
                            {canWrite && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToTop(item);
                                  }}
                                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-orange-600"
                                >
                                  <i className="fas fa-arrow-up"></i>
                                  Move to Top
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(item);
                                  }}
                                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-green-600"
                                >
                                  <i className="fas fa-edit"></i>
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item);
                                  }}
                                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                                >
                                  <i className="fas fa-trash"></i>
                                  Delete
                                </button>
                              </>
                            )}
                            {canVerifyApprove && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExpire(item);
                                }}
                                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                              >
                                <i className="fas fa-clock"></i>
                                Expire
                              </button>
                            )}
                          </div>
                        )}
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
          onImportComplete={fetchProducts}
        />

      <ProductHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryProductId(undefined);
          setHistoryProductName(undefined);
        }}
        productId={historyProductId}
        productName={historyProductName}
      />

      {selectedProduct && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center space-x-4">
                <img
                  src={getProductImageSrc(selectedProduct)}
                  alt={getSkuFamilyText(selectedProduct?.skuFamilyId)}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 flex-shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      placeholderImage;
                  }}
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {getSkuFamilyText(selectedProduct.skuFamilyId)}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Product Details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 flex-shrink-0"
                title="Close"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <div className="mb-6">{getStatusBadge(selectedProduct)}</div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Basic Information
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {getSkuFamilyText(selectedProduct.skuFamilyId)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sub SKU Family
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {getSubSkuFamilyText(selectedProduct.subSkuFamilyId)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SIM Type
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {selectedProduct.simType}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {selectedProduct.color}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        RAM
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        {selectedProduct.ram}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Storage
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        {selectedProduct.storage}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Condition
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {selectedProduct.condition}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Flash Deal
                      </label>
                      <p
                        className={`text-sm font-medium bg-gray-50 dark:bg-gray-800 p-3 rounded-md ${
                          selectedProduct.isFlashDeal
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedProduct.isFlashDeal ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Negotiable
                      </label>
                      <p
                        className={`text-sm font-medium bg-gray-50 dark:bg-gray-800 p-3 rounded-md ${
                          selectedProduct.isNegotiable
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedProduct.isNegotiable ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Pricing & Inventory
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price
                    </label>
                    <p className="text-lg text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md font-semibold">
                      ${formatPrice(selectedProduct.price)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Stock
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        {selectedProduct.stock} units
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        MOQ
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        {selectedProduct.moq} units
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {selectedProduct.country}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {formatExpiryTime(selectedProduct.expiryTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;

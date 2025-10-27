import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { BusinessRequestsService } from "../../services/businessRequests/businessRequests.services";
import { CustomerService } from "../../services/customer/customerService";
import { LOCAL_STORAGE_KEYS } from "../../constants/localStorage";
import Switch from "../form/switch/Switch";
import toastHelper from "../../utils/toastHelper";

interface BusinessRequest {
  _id?: string;
  logo?: string;
  certificate?: string;
  businessName: string;
  country: string;
  address?: string;
  status: "Approved" | "Pending" | "Rejected";                                                                                            
  name?: string;
  email?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  isAllowBidding?: boolean;
}

const BusinessRequestsTable: React.FC = () => {
  const [businessRequests, setBusinessRequests] = useState<BusinessRequest[]>(
    []
  );
  const [filteredRequests, setFilteredRequests] = useState<BusinessRequest[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<BusinessRequest | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, "Approved" | "Pending" | "Rejected">
  >({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.BR_STATUS_OVERRIDES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setStatusOverrides(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.BR_STATUS_OVERRIDES,
        JSON.stringify(statusOverrides)
      );
    } catch {}
  }, [statusOverrides]);

  const itemsPerPage = 10;

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { docs, totalDocs } =
        await BusinessRequestsService.getBusinessRequests(1, 1000, undefined);

      const baseUrl = import.meta.env.VITE_BASE_URL as string | undefined;
      const makeAbsoluteUrl = (path?: string | null): string | undefined => {
        if (!path) return undefined;
        if (path.startsWith("http://") || path.startsWith("https://"))
          return path;
        if (!baseUrl) return undefined;
        const trimmed = path.startsWith("/") ? path : `/${path}`;
        return `${baseUrl}${trimmed}`;
      };

      const mapped: BusinessRequest[] = (docs || []).map((d: any) => {
        const bp = d?.businessProfile || {};
        const statusStr: string | undefined = (bp?.status || "")
          .toString()
          .toLowerCase();
        let status: "Approved" | "Pending" | "Rejected" = "Pending";
        if (statusStr === "approved") status = "Approved";
        else if (statusStr === "rejected") status = "Rejected";
        else status = "Pending";

        return {
          _id: d?._id ?? d?.id,
          logo: makeAbsoluteUrl(bp?.logo),
          certificate: makeAbsoluteUrl(bp?.certificate),
          businessName: bp?.businessName ?? "-",
          country: bp?.country ?? "-",
          address: bp?.address ?? undefined,
          status,
          name: d?.name ?? "-",
          email: d?.email ?? "-",
          mobileNumber: d?.mobileNumber ?? "-",
          whatsappNumber: d?.whatsappNumber ?? "-",
          isAllowBidding: d?.isAllowBidding ?? true,
        } as BusinessRequest;
      });

      const withOverrides = mapped.map((item) => {
        if (item._id && statusOverrides[item._id]) {
          return { ...item, status: statusOverrides[item._id] };
        }
        return item;
      });

      try {
        const nextOverrides = { ...statusOverrides };
        for (const item of mapped) {
          if (
            item._id &&
            nextOverrides[item._id] === "Approved" &&
            item.status === "Approved"
          ) {
            delete nextOverrides[item._id];
          }
        }
        if (JSON.stringify(nextOverrides) !== JSON.stringify(statusOverrides)) {
          setStatusOverrides(nextOverrides);
        }
      } catch {}

      setBusinessRequests(withOverrides);
      setTotalDocs(Number(totalDocs) || 0);
    } catch (err) {
      console.error("Error fetching business requests:", err);
      setBusinessRequests([]);
      setTotalDocs(0);
    } finally {
      setLoading(false);
    }
  }, [statusOverrides]);

  useEffect(() => {
    let filtered = businessRequests;

    if (searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        item.businessName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [businessRequests, searchTerm, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (
    id: string,
    newStatus: "Approved" | "Pending" | "Rejected"
  ) => {
    const confirmed = await Swal.fire({
      title: "Are you sure?",
      text: `Change status to ${newStatus}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, change it!",
      cancelButtonText: "No, cancel!",
    });

    if (confirmed.isConfirmed) {
      setStatusOverrides((prev) => ({ ...prev, [id]: newStatus }));
      setBusinessRequests((prev: BusinessRequest[]) =>
        prev.map((item: BusinessRequest) =>
          item._id === id ? { ...item, status: newStatus } : item
        )
      );

      try {
        const payloadStatus: "approved" | "pending" | "rejected" =
          newStatus === "Approved"
            ? "approved"
            : newStatus === "Rejected"
            ? "rejected"
            : "pending";
        await BusinessRequestsService.updateCustomerStatus(id, payloadStatus);
        await fetchData();
      } catch (err) {
        console.error("Error updating status:", err);
        await fetchData();
      } finally {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    }
  };

  const handleView = (item: BusinessRequest) => {
    setSelectedProduct(item);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleToggleAllowBidding = async (item: BusinessRequest, newValue: boolean) => {
    if (!item._id) return;

    try {
      await CustomerService.toggleAllowBidding(item._id, newValue);
      
      // Update local state
      setBusinessRequests((prev: BusinessRequest[]) =>
        prev.map((i: BusinessRequest) =>
          i._id === item._id ? { ...i, isAllowBidding: newValue } : i
        )
      );
      
      setFilteredRequests((prev: BusinessRequest[]) =>
        prev.map((i: BusinessRequest) =>
          i._id === item._id ? { ...i, isAllowBidding: newValue } : i
        )
      );

      toastHelper.success(
        newValue 
          ? 'Customer bidding permission enabled'
          : 'Customer bidding permission disabled'
      );
    } catch (err) {
      console.error("Error toggling allow bidding:", err);
      // Revert the UI change on error
      toastHelper.error('Failed to update bidding permission');
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Updated status styling and icon functions
  const getStatusStyles = (status: "Approved" | "Pending" | "Rejected") => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-700";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: "Approved" | "Pending" | "Rejected") => {
    switch (status) {
      case "Approved":
        return "fa-check-circle";
      case "Pending":
        return "fa-clock";
      case "Rejected":
        return "fa-times";
      default:
        return "";
    }
  };

  const placeholderImage =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmyTPv4M5fFPvYLrMzMQcPD_VO34ByNjouQ&s";

  return (
    <div className="p-4">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 w-[85%]">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by business name..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[120px] appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
            </div>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b">
                  Logo
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b">
                  Certificate
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b">
                  Business Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b">
                  Country
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b">
                  Allow Bidding
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b">
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
                      Loading Business Requests...
                    </div>
                  </td>
                </tr>
              ) : !paginatedRequests || paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      No business requests found
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map(
                  (item: BusinessRequest, index: number) => (
                    <tr
                      key={item._id || index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <img
                          src={item.logo || placeholderImage}
                          alt="Logo"
                          className="w-12 h-12 object-contain rounded-md border cursor-pointer"
                          onClick={() =>
                            setSelectedImage(item.logo || placeholderImage)
                          }
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              placeholderImage;
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <img
                          src={item.certificate || placeholderImage}
                          alt="Certificate"
                          className="w-12 h-12 object-contain rounded-md border cursor-pointer"
                          onClick={() =>
                            setSelectedImage(
                              item.certificate || placeholderImage
                            )
                          }
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              placeholderImage;
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {item.businessName || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.country || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm max-w-xs overflow-hidden">
                        {item.address || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          <i className={`fas ${getStatusIcon(item.status)} text-xs`}></i>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Switch
                          label=""
                          defaultChecked={item.isAllowBidding ?? true}
                          onChange={(checked) => handleToggleAllowBidding(item, checked)}
                          color="blue"
                        />
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
                                const dropdownHeight = 120;
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(item);
                                }}
                                className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600"
                              >
                                <i className="fas fa-eye mr-2 text-blue-600"></i>{" "}
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item._id)
                                    handleStatusChange(item._id, "Approved");
                                }}
                                className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-green-600"
                              >
                                <i className="fas fa-check mr-2 text-green-600"></i>{" "}
                                Approved
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item._id)
                                    handleStatusChange(item._id, "Pending");
                                }}
                                className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-yellow-600"
                              >
                                <i className="fas fa-pause mr-2 text-yellow-600"></i>{" "}
                                Pending
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item._id)
                                    handleStatusChange(item._id, "Rejected");
                                }}
                                className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                              >
                                <i className="fas fa-times mr-2 text-red-600"></i>{" "}
                                Rejected
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-sm">
            Showing {paginatedRequests.length} of {filteredRequests.length}{" "}
            items
            {filteredRequests.length !== totalDocs && (
              <span className="text-gray-500">
                {" "}
                (filtered from {totalDocs} total)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                let pageNum;
                if (totalPages <= 10) {
                  pageNum = i + 1;
                } else {
                  const start = Math.max(1, currentPage - 5);
                  pageNum = start + i;
                  if (pageNum > totalPages) return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "border"
                    }`}
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
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header - White Background */}
            <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border-b-2 border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Business Details
              </h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-all duration-200 flex-shrink-0"
                title="Close"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 bg-gray-50 dark:bg-gray-900">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Name
                  </label>
                  <p className="text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 ">
                    {selectedProduct.name || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Email
                  </label>
                  <p className="text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700  break-all">
                    {selectedProduct.email || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Phone Number
                  </label>
                  <p className="text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 ">
                    {selectedProduct.mobileNumber || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    WhatsApp Number
                  </label>
                  <p className="text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 ">
                    {selectedProduct.whatsappNumber || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative">
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white bg-gray-800/70 rounded-full p-2"
              onClick={() => setSelectedImage(null)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessRequestsTable;
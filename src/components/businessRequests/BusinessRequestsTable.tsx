import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { BusinessRequestsService } from "../../services/businessRequests/businessRequests.services";

interface BusinessRequest {
  _id?: string;
  logo?: string;
  certificate?: string;
  businessName: string;
  country: string;
  address?: string;
  status: "Approved" | "Pending" | "Rejected";
}

const BusinessRequestsTable: React.FC = () => {
  const [businessRequests, setBusinessRequests] = useState<BusinessRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, "Approved" | "Pending" | "Rejected">>({});

  // Load overrides from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('br_status_overrides');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setStatusOverrides(parsed);
        }
      }
    } catch {}
  }, []);

  // Persist overrides
  useEffect(() => {
    try {
      localStorage.setItem('br_status_overrides', JSON.stringify(statusOverrides));
    } catch {}
  }, [statusOverrides]);
  const itemsPerPage = 10;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
      if (!(event.target as HTMLElement).closest('.dropdown-container')) {
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

    document.addEventListener('click', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [openDropdownId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { docs, totalDocs } = await BusinessRequestsService.getBusinessRequests(
        currentPage,
        itemsPerPage,
        searchTerm?.trim() || undefined
      );

      const baseUrl = import.meta.env.VITE_BASE_URL as string | undefined;
      const makeAbsoluteUrl = (path?: string | null): string | undefined => {
        if (!path) return undefined;
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (!baseUrl) return path;
        const trimmed = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${trimmed}`;
      };

      const mapped: BusinessRequest[] = (docs || []).map((d: any) => {
        const bp = d?.businessProfile || {};
        const statusStr: string | undefined = (bp?.status || '').toString().toLowerCase();
        let status: "Approved" | "Pending" | "Rejected" = "Pending";
        if (statusStr === 'approved') status = 'Approved';
        else if (statusStr === 'rejected') status = 'Rejected';
        else status = 'Pending';

        return {
          _id: d?._id ?? d?.id,
          logo: makeAbsoluteUrl(bp?.logo),
          certificate: makeAbsoluteUrl(bp?.certificate),
          businessName: bp?.businessName ?? d?.name ?? "-",
          country: bp?.country ?? "-",
          address: bp?.address ?? undefined,
          status,
        } as BusinessRequest;
      });

      // Apply local overrides when present
      const withOverrides = mapped.map((item) => {
        if (item._id && statusOverrides[item._id]) {
          return { ...item, status: statusOverrides[item._id] };
        }
        return item;
      });

      // Auto-clear overrides that the server has now persisted (only for Approved)
      try {
        const nextOverrides = { ...statusOverrides };
        for (const item of mapped) {
          if (item._id && nextOverrides[item._id] === 'Approved' && item.status === 'Approved') {
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
  }, [currentPage, itemsPerPage, searchTerm, statusOverrides]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (id: string, newStatus: "Approved" | "Pending" | "Rejected") => {
    const confirmed = await Swal.fire({
      title: "Are you sure?",
      text: `Change status to ${newStatus}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, change it!",
      cancelButtonText: "No, cancel!",
    });

    if (confirmed.isConfirmed) {
      // Optimistic UI update + record override
      setStatusOverrides((prev) => ({ ...prev, [id]: newStatus }));
      setBusinessRequests((prev: BusinessRequest[]) =>
        prev.map((item: BusinessRequest) =>
          item._id === id ? { ...item, status: newStatus } : item
        )
      );

      try {
        const payloadStatus: 'approved' | 'pending' | 'rejected' =
          newStatus === 'Approved' ? 'approved' : newStatus === 'Rejected' ? 'rejected' : 'pending';
        await BusinessRequestsService.updateCustomerStatus(id, payloadStatus);
        // Clear override if server now reflects our chosen status
        await fetchData();
      } catch (err) {
        console.error("Error updating status:", err);
        // Revert on error
        await fetchData();
      } finally {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    }
  };

  const totalPages = Math.ceil(totalDocs / itemsPerPage);

  const getStatusStyles = (status: "Approved" | "Pending" | "Rejected") => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "";
    }
  };

  return (
    <div className="p-4">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search by business name..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Logo
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Certificate
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Business Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Country
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
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
                  <td colSpan={7} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto mb-4"></div>
                      Loading Business Requests...
                    </div>
                  </td>
                </tr>
              ) : !businessRequests || businessRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      No business requests found
                    </div>
                  </td>
                </tr>
              ) : (
                businessRequests.map((item: BusinessRequest, index: number) => (
                  <tr
                    key={item._id || index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {item.logo ? (
                        <img
                          src={item.logo}
                          alt="Logo"
                          className="w-12 h-12 object-contain rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer"
                          onClick={() => setSelectedImage(item.logo || null)}
                        />
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.certificate ? (
                        <img
                          src={item.certificate}
                          alt="Certificate"
                          className="w-12 h-12 object-contain rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer"
                          onClick={() => setSelectedImage(item.certificate || null)}
                        />
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {item.businessName || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.country || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs overflow-hidden">
                      {item.address || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center relative">
                      <div className="dropdown-container relative">
                        <button
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openDropdownId === item._id) {
                              setOpenDropdownId(null);
                              setDropdownPosition(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const dropdownWidth = 192; // w-48 = 192px
                              const dropdownHeight = 120; // approximate height of 3 buttons
                              
                              let top = rect.bottom + 8; // 8px margin below button
                              let left = rect.right - dropdownWidth; // align to right edge of button
                              
                              // Check if dropdown would go below viewport
                              if (top + dropdownHeight > window.innerHeight) {
                                top = rect.top - dropdownHeight - 8; // position above button
                              }
                              
                              // Check if dropdown would go beyond left edge
                              if (left < 8) {
                                left = 8; // 8px margin from left edge
                              }
                              
                              // Check if dropdown would go beyond right edge
                              if (left + dropdownWidth > window.innerWidth - 8) {
                                left = window.innerWidth - dropdownWidth - 8; // 8px margin from right edge
                              }
                              
                              setDropdownPosition({ top, left });
                              setOpenDropdownId(item._id || null);
                            }
                          }}
                          aria-label="Toggle actions"
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                        {openDropdownId === item._id && dropdownPosition && (
                          <div 
                            className="fixed w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg origin-top-right"
                            style={{ 
                              top: `${dropdownPosition.top}px`, 
                              left: `${dropdownPosition.left}px`,
                              zIndex: 9999
                            }}
                          >
                            <button
                              onClick={() => item._id && handleStatusChange(item._id, "Approved")}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              Approved
                            </button>
                            <button
                              onClick={() => item._id && handleStatusChange(item._id, "Pending")}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              Pending
                            </button>
                            <button
                              onClick={() => item._id && handleStatusChange(item._id, "Rejected")}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              Rejected
                            </button>
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
            Showing {businessRequests.length} of {totalDocs} items
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
              {Array.from({ length: totalPages }, (_, i) => {
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
              className="absolute top-4 right-4 text-white bg-gray-800/70 rounded-full p-2 hover:bg-gray-800 transition-colors"
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
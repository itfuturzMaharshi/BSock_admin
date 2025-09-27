import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { SkuFamilyService } from "../../services/skuFamily/skuFamily.services";
import toastHelper from "../../utils/toastHelper";
import SkuFamilyModal from "./SkuFamilModal";

interface SkuFamily {
  _id?: string;
  name: string;
  code: string;
  brand: string;
  description: string;
  images: string[];
  colorVariant: string;
  country: string;
  simType: string;
  networkBands: string;
  countryVariant?: string;
  isApproved?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  approvedBy?: string | null;
  __v?: string;
}

const SkuFamilyTable: React.FC = () => {
  const [skuFamilyData, setSkuFamilyData] = useState<SkuFamily[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await SkuFamilyService.getSkuFamilyList(
        currentPage,
        itemsPerPage,
        searchTerm.trim()
      );
      if (response.data?.docs) {
        setSkuFamilyData(response.data.docs);
        setTotalDocs(response.data.totalDocs || 0);
      } else {
        setSkuFamilyData([]);
        setTotalDocs(0);
      }
    } catch (err: any) {
      console.error("Error fetching SKU families:", err);
      toastHelper.showTost("Failed to fetch SKU families", "error");
      setSkuFamilyData([]);
      setTotalDocs(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: FormData) => {
    try {
      if (editId) {
        await SkuFamilyService.updateSkuFamily(editId, formData);
      } else {
        await SkuFamilyService.createSkuFamily(formData);
      }
      fetchData();
      setIsModalOpen(false);
      setEditId(null);
    } catch (err: any) {
      console.error("Error saving SKU family:", err);
      toastHelper.showTost("Failed to save SKU family", "error");
    }
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the SKU Family!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
    });

    if (confirmed.isConfirmed) {
      try {
        await SkuFamilyService.deleteSkuFamily(id);
        fetchData();
      } catch (err: any) {
        console.error("Error deleting SKU family:", err);
        toastHelper.showTost("Failed to delete SKU family", "error");
      }
    }
  };

  const totalPages = Math.ceil(totalDocs / itemsPerPage);

  const placeholderImage =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmyTPv4M5fFPvYLrMzMQcPD_VO34ByNjouQ&s";

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
                placeholder="Search by name or code..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <button
            className="inline-flex items-center gap-1 rounded-lg bg-[#0071E0] text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            onClick={() => {
              setEditId(null);
              setIsModalOpen(true);
            }}
          >
            <i className="fas fa-plus text-xs"></i>
            Add SKU Family
          </button>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Brand
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Color Variant
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Country
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  SIM Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Network Bands
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto mb-4"></div>
                      Loading SKU Families...
                    </div>
                  </td>
                </tr>
              ) : !skuFamilyData || skuFamilyData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      No products found
                    </div>
                  </td>
                </tr>
              ) : (
                skuFamilyData.map((item: SkuFamily, index: number) => (
                  <tr
                    key={item._id || index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <img
                        src={(function () {
                          const base =
                            (import.meta as any).env?.VITE_BASE_URL || "";
                          const first =
                            Array.isArray(item.images) && item.images.length > 0
                              ? item.images[0]
                              : "";
                          if (!first) return placeholderImage; // 👈 fallback if no image url
                          const isAbsolute = /^https?:\/\//i.test(first);
                          return isAbsolute
                            ? first
                            : `${base}${
                                first.startsWith("/") ? "" : "/"
                              }${first}`;
                        })()}
                        alt={item.name || "Product"}
                        className="w-12 h-12 object-contain rounded-md border border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            placeholderImage; // 👈 fallback if load fails
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {item.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.code || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.brand || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs overflow-hidden">
                      {item.description || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.colorVariant || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.country || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.simType || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.networkBands || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => item._id && handleEdit(item._id)}
                          disabled={!item._id}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => item._id && handleDelete(item._id)}
                          disabled={!item._id}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
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
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
            Showing {skuFamilyData.length} of {totalDocs} items
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
      <SkuFamilyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditId(null);
        }}
        onSave={handleSave}
        editItem={
          editId ? skuFamilyData.find((item) => item._id === editId) : undefined
        }
      />
    </div>
  );
};

export default SkuFamilyTable;

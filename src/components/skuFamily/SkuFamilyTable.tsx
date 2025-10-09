// SkuFamilyTable.tsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { SkuFamilyService } from "../../services/skuFamily/skuFamily.services";
import toastHelper from "../../utils/toastHelper";
import SkuFamilyModal from "./SkuFamilModal";
import SubRowModal from "./SubRowModal";
import placeholderImage from "../../../public/images/product/noimage.jpg";


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
  const [isSubRowModalOpen, setIsSubRowModalOpen] = useState<boolean>(false);
  const [parentRowId, setParentRowId] = useState<string | null>(null);
  const [subRows, setSubRows] = useState<{[key: string]: SkuFamily[]}>({});
  const [expandedRows, setExpandedRows] = useState<{[key: string]: boolean}>({});
  const [isSubRowEditModalOpen, setIsSubRowEditModalOpen] = useState<boolean>(false);
  const [editingSubRow, setEditingSubRow] = useState<{parentId: string, subRow: SkuFamily} | null>(null);
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
        console.log("Fetched SKU Family data:", response.data.docs); // Debug log
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
    console.log("HandleEdit called with ID:", id);
    const selectedItem = skuFamilyData.find((item) => item._id === id);
    console.log("Selected item for edit:", selectedItem); // Debug log
    
    // Close modal first to reset state
    setIsModalOpen(false);
    setEditId(null);
    
    // Use setTimeout to ensure state is reset before opening again
    setTimeout(() => {
      setEditId(id);
      setIsModalOpen(true);
    }, 50);
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

  const handleAddSubRow = (id: string) => {
    setParentRowId(id);
    setIsSubRowModalOpen(true);
  };

  const handleSubRowSave = async (formData: FormData) => {
    try {
      // Create a new sub-row entry
      const newSubRow: SkuFamily = {
        _id: `sub-${Date.now()}`, // Temporary ID for local state
        name: formData.get('name') as string,
        code: formData.get('code') as string,
        brand: formData.get('brand') as string,
        description: formData.get('description') as string,
        colorVariant: formData.get('colorVariant') as string,
        country: formData.get('country') as string,
        simType: formData.get('simType') as string,
        networkBands: formData.get('networkBands') as string,
        images: [], // Handle images if needed
      };

      // Add to subRows state
      if (parentRowId) {
        setSubRows(prev => ({
          ...prev,
          [parentRowId]: [...(prev[parentRowId] || []), newSubRow]
        }));
      }

      setIsSubRowModalOpen(false);
      setParentRowId(null);
      toastHelper.showTost("Sub-row added successfully", "success");
    } catch (err: any) {
      console.error("Error saving sub-row:", err);
      toastHelper.showTost("Failed to save sub-row", "error");
    }
  };

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const handleSubRowEdit = (parentId: string, subRowId: string) => {
    // Find the sub-row to edit
    const subRow = subRows[parentId]?.find(row => row._id === subRowId);
    if (subRow) {
      setEditingSubRow({ parentId, subRow });
      setIsSubRowEditModalOpen(true);
    }
  };

  const handleSubRowDelete = async (parentId: string, subRowId: string) => {
    const confirmed = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the sub-row!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
    });

    if (confirmed.isConfirmed) {
      try {
        setSubRows(prev => ({
          ...prev,
          [parentId]: prev[parentId]?.filter(row => row._id !== subRowId) || []
        }));
        toastHelper.showTost("Sub-row deleted successfully", "success");
      } catch (err: any) {
        console.error("Error deleting sub-row:", err);
        toastHelper.showTost("Failed to delete sub-row", "error");
      }
    }
  };

  const handleSubRowEditSave = async (formData: FormData) => {
    try {
      if (!editingSubRow) return;

      // Create updated sub-row entry
      const updatedSubRow: SkuFamily = {
        _id: editingSubRow.subRow._id, // Keep the same ID
        name: formData.get('name') as string,
        code: formData.get('code') as string,
        brand: formData.get('brand') as string,
        description: formData.get('description') as string,
        colorVariant: formData.get('colorVariant') as string,
        country: formData.get('country') as string,
        simType: formData.get('simType') as string,
        networkBands: formData.get('networkBands') as string,
        images: editingSubRow.subRow.images, // Keep existing images
      };

      // Update the sub-row in state
      setSubRows(prev => ({
        ...prev,
        [editingSubRow.parentId]: prev[editingSubRow.parentId]?.map(row => 
          row._id === editingSubRow.subRow._id ? updatedSubRow : row
        ) || []
      }));

      setIsSubRowEditModalOpen(false);
      setEditingSubRow(null);
      toastHelper.showTost("Sub-row updated successfully", "success");
    } catch (err: any) {
      console.error("Error updating sub-row:", err);
      toastHelper.showTost("Failed to update sub-row", "error");
    }
  };


  const totalPages = Math.ceil(totalDocs / itemsPerPage);

  // const placeholderImage =
  //   "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmyTPv4M5fFPvYLrMzMQcPD_VO34ByNjouQ&s";

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
                  <React.Fragment key={item._id || index}>
                    {/* Main Row */}
                    <tr 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => item._id && toggleRowExpansion(item._id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {item._id && (subRows[item._id] && subRows[item._id].length > 0) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                item._id && toggleRowExpansion(item._id);
                              }}
                              className="mr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <i className={`fas fa-chevron-${expandedRows[item._id] ? 'down' : 'right'} text-sm`}></i>
                            </button>
                          )}
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
                        </div>
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
                        <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => item._id && handleAddSubRow(item._id)}
                            disabled={!item._id}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors disabled:opacity-50"
                            title="Add Sub-Row"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
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
                    {/* Sub-rows */}
                    {item._id && expandedRows[item._id] && subRows[item._id] && subRows[item._id].map((subRow, subIndex) => (
                      <tr key={`sub-${item._id}-${subIndex}`} className="bg-gray-50 dark:bg-gray-800/50">
                        <td className="px-6 py-4 pl-12">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                            <img
                              src={placeholderImage}
                              alt={subRow.name || "Sub-Product"}
                              className="w-10 h-10 object-contain rounded-md border border-gray-200 dark:border-gray-600"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {subRow.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {subRow.code || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {subRow.brand || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs overflow-hidden">
                          {subRow.description || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {subRow.colorVariant || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {subRow.country || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {subRow.simType || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {subRow.networkBands || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleSubRowEdit(item._id!, subRow._id!)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                              title="Edit Sub-Row"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleSubRowDelete(item._id!, subRow._id!)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              title="Delete Sub-Row"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
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
      <SubRowModal
        isOpen={isSubRowModalOpen}
        onClose={() => {
          setIsSubRowModalOpen(false);
          setParentRowId(null);
        }}
        onSave={handleSubRowSave}
      />
      <SubRowModal
        isOpen={isSubRowEditModalOpen}
        onClose={() => {
          setIsSubRowEditModalOpen(false);
          setEditingSubRow(null);
        }}
        onSave={handleSubRowEditSave}
        editItem={editingSubRow?.subRow}
      />
    </div>
  );
};

export default SkuFamilyTable;
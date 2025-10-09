// SkuFamilyTable.tsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { SkuFamilyService } from "../../services/skuFamily/skuFamily.services";
import { SubSkuFamilyService } from "../../services/skuFamily/subSkuFamily.services";
import toastHelper from "../../utils/toastHelper";
import SkuFamilyModal from "./SkuFamilyModal";
import SubRowModal from "./SubRowModal";
import placeholderImage from "../../../public/images/product/noimage.jpg";
import { SkuFamily } from "./types";

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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [selectedSkuFamily, setSelectedSkuFamily] = useState<SkuFamily | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm]);

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

  const fetchSubRows = async (parentId: string) => {
    try {
      const response = await SubSkuFamilyService.getSubSkuFamilyList(1, 100, parentId);
      if (response.data?.docs) {
        setSubRows(prev => ({
          ...prev,
          [parentId]: response.data.docs
        }));
      }
    } catch (err: any) {
      console.error("Error fetching sub-rows:", err);
      toastHelper.showTost("Failed to fetch sub-rows", "error");
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
    setOpenDropdownId(null);
    setDropdownPosition(null);
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
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleView = (skuFamily: SkuFamily) => {
    setSelectedSkuFamily(skuFamily);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleAddSubRow = (id: string) => {
    setParentRowId(id);
    setIsSubRowModalOpen(true);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleSubRowSave = async (formData: FormData) => {
    try {
      // Add skuFamilyId to formData
      if (parentRowId) {
        formData.append('skuFamilyId', parentRowId);
      }

      // Use SubSkuFamilyService to create the sub-row
      await SubSkuFamilyService.createSubSkuFamily(formData);
      
      // Refresh the sub-rows for this parent
      if (parentRowId) {
        await fetchSubRows(parentRowId);
      }

      setIsSubRowModalOpen(false);
      setParentRowId(null);
    } catch (err: any) {
      console.error("Error saving sub-row:", err);
      toastHelper.showTost("Failed to save sub-row", "error");
    }
  };

  const toggleRowExpansion = (rowId: string) => {
    const isExpanding = !expandedRows[rowId];
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
    
    // Fetch sub-rows when expanding
    if (isExpanding) {
      fetchSubRows(rowId);
    }
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
        // Use SubSkuFamilyService to delete the sub-row
        await SubSkuFamilyService.deleteSubSkuFamily(subRowId);
        
        // Refresh the sub-rows for this parent
        await fetchSubRows(parentId);
      } catch (err: any) {
        console.error("Error deleting sub-row:", err);
        toastHelper.showTost("Failed to delete sub-row", "error");
      }
    }
  };

  const handleSubRowEditSave = async (formData: FormData) => {
    try {
      if (!editingSubRow) return;

      // Add skuFamilyId to formData
      formData.append('skuFamilyId', editingSubRow.parentId);

      // Use SubSkuFamilyService to update the sub-row
      await SubSkuFamilyService.updateSubSkuFamily(editingSubRow.subRow._id!, formData);
      
      // Refresh the sub-rows for this parent
      await fetchSubRows(editingSubRow.parentId);

      setIsSubRowEditModalOpen(false);
      setEditingSubRow(null);
    } catch (err: any) {
      console.error("Error updating sub-row:", err);
      toastHelper.showTost("Failed to update sub-row", "error");
    }
  };


  const totalPages = Math.ceil(totalDocs / itemsPerPage);

  // Helper function to display array data properly
  const displayArrayData = (data: any): string => {
    if (!data) return "N/A";
    if (Array.isArray(data)) {
      return data.length > 0 ? data.join(", ") : "N/A";
    }
    return data;
  };

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
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="w-12 px-2 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  <i className="fas fa-expand-arrows-alt text-gray-500"></i>
                </th>
                <th className="w-20 px-2 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Image
                </th>
                <th className="w-32 px-2 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Name
                </th>
                <th className="w-24 px-2 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Color Variant
                </th>
                <th className="w-20 px-2 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Country
                </th>
                <th className="w-20 px-2 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto mb-4"></div>
                      Loading SKU Families...
                    </div>
                  </td>
                </tr>
              ) : !skuFamilyData || skuFamilyData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
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
                      <td className="w-12 px-2 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            item._id && toggleRowExpansion(item._id);
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <i className={`fas fa-chevron-${item._id && expandedRows[item._id] ? 'down' : 'right'} text-sm`}></i>
                        </button>
                      </td>
                      <td className="w-20 px-2 py-4">
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
                      <td className="w-32 px-2 py-4 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {item.name || "N/A"}
                      </td>
                      <td className="w-24 px-2 py-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                        {displayArrayData(item.colorVariant)}
                      </td>
                      <td className="w-20 px-2 py-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                        {item.country || "N/A"}
                      </td>
                      <td className="w-20 px-2 py-4 text-sm text-center relative">
                        <div className="dropdown-container relative">
                          <button
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openDropdownId === item._id) {
                                setOpenDropdownId(null);
                                setDropdownPosition(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const dropdownWidth = 192;
                                const dropdownHeight = 200;
                                let top = rect.bottom + 8;
                                let left = rect.right - dropdownWidth;

                                if (top + dropdownHeight > window.innerHeight) {
                                  top = rect.top - dropdownHeight - 8;
                                }
                                if (left < 8) {
                                  left = 8;
                                }
                                if (left + dropdownWidth > window.innerWidth - 8) {
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
                                  item._id && handleAddSubRow(item._id);
                                }}
                                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-green-600"
                              >
                                <i className="fas fa-plus"></i>
                                Add
                              </button>
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
                                  item._id && handleEdit(item._id);
                                }}
                                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-yellow-600"
                              >
                                <i className="fas fa-edit"></i>
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  item._id && handleDelete(item._id);
                                }}
                                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                              >
                                <i className="fas fa-trash"></i>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Sub-rows */}
                    {item._id && expandedRows[item._id] && subRows[item._id] && subRows[item._id].map((subRow, subIndex) => (
                      <tr key={`sub-${item._id}-${subIndex}`} className="bg-gray-50 dark:bg-gray-800/50">
                        <td className="w-12 px-2 py-4 text-center">
                          <div className="w-4 h-4 border-l-2 border-b-2 border-gray-300 dark:border-gray-500 ml-2"></div>
                        </td>
                        <td className="w-20 px-2 py-4 pl-4">
                          <img
                            src={placeholderImage}
                            alt={subRow.name || "Sub-Product"}
                            className="w-10 h-10 object-contain rounded-md border border-gray-200 dark:border-gray-600"
                          />
                        </td>
                        <td className="w-32 px-2 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {subRow.name || "N/A"}
                        </td>
                        <td className="w-24 px-2 py-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                          {displayArrayData(subRow.colorVariant)}
                        </td>
                        <td className="w-20 px-2 py-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                          {subRow.country || "N/A"}
                        </td>
                        <td className="w-20 px-2 py-4 text-sm text-center">
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
                    {/* Empty sub-row message when no sub-rows exist */}
                    {item._id && expandedRows[item._id] && (!subRows[item._id] || subRows[item._id].length === 0) && (
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <td className="w-12 px-2 py-4 text-center">
                          <div className="w-4 h-4 border-l-2 border-b-2 border-gray-300 dark:border-gray-500 ml-2"></div>
                        </td>
                        <td className="w-20 px-2 py-4"></td>
                        <td className="w-32 px-2 py-4"></td>
                        <td className="w-24 px-2 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <i className="fas fa-info-circle mr-2"></i>
                            No variants available. Click edit to add variants.
                          </div>
                        </td>
                        <td className="w-20 px-2 py-4"></td>
                        <td className="w-20 px-2 py-4"></td>
                      </tr>
                    )}
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
        skuFamilyId={parentRowId || undefined}
      />
      <SubRowModal
        isOpen={isSubRowEditModalOpen}
        onClose={() => {
          setIsSubRowEditModalOpen(false);
          setEditingSubRow(null);
        }}
        onSave={handleSubRowEditSave}
        editItem={editingSubRow?.subRow}
        skuFamilyId={editingSubRow?.parentId}
      />
      {selectedSkuFamily && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300"
          onClick={() => setSelectedSkuFamily(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center space-x-4">
                <img
                  src={(function () {
                    const base = (import.meta as any).env?.VITE_BASE_URL || "";
                    const first = Array.isArray(selectedSkuFamily.images) && selectedSkuFamily.images.length > 0
                      ? selectedSkuFamily.images[0]
                      : "";
                    if (!first) return placeholderImage;
                    const isAbsolute = /^https?:\/\//i.test(first);
                    return isAbsolute
                      ? first
                      : `${base}${first.startsWith("/") ? "" : "/"}${first}`;
                  })()}
                  alt={selectedSkuFamily.name || "SKU Family"}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 flex-shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = placeholderImage;
                  }}
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedSkuFamily.name || "N/A"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    SKU Family Details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSkuFamily(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 flex-shrink-0"
                title="Close"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
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
                      {selectedSkuFamily.name || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Code
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {selectedSkuFamily.code || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Brand
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {selectedSkuFamily.brand || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {selectedSkuFamily.description || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Technical Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color Variant
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {displayArrayData(selectedSkuFamily.colorVariant)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {selectedSkuFamily.country || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SIM Type
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {displayArrayData(selectedSkuFamily.simType)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Network Bands
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {displayArrayData(selectedSkuFamily.networkBands)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Images
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedSkuFamily.images && selectedSkuFamily.images.length > 0 ? (
                    selectedSkuFamily.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={(function () {
                            const base = (import.meta as any).env?.VITE_BASE_URL || "";
                            const isAbsolute = /^https?:\/\//i.test(image);
                            return isAbsolute
                              ? image
                              : `${base}${image.startsWith("/") ? "" : "/"}${image}`;
                          })()}
                          alt={`${selectedSkuFamily.name} - Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = placeholderImage;
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                      <i className="fas fa-image text-4xl mb-2"></i>
                      <p>No images available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkuFamilyTable;
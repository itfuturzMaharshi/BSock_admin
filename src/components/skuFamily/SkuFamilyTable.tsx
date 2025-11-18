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
import { useDebounce } from "../../hooks/useDebounce";

const SkuFamilyTable: React.FC = () => {
  const [skuFamilyData, setSkuFamilyData] = useState<SkuFamily[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [isSubRowModalOpen, setIsSubRowModalOpen] = useState<boolean>(false);
  const [parentRowId, setParentRowId] = useState<string | null>(null);
  const [subRows, setSubRows] = useState<{ [key: string]: SkuFamily[] }>({});
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [isSubRowEditModalOpen, setIsSubRowEditModalOpen] =
    useState<boolean>(false);
  const [editingSubRow, setEditingSubRow] = useState<{
    parentId: string;
    subRow: SkuFamily;
  } | null>(null);
  const [selectedSubRow, setSelectedSubRow] = useState<SkuFamily | null>(null);
  // Removed dropdown state since inline actions are used
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedSkuFamily, setSelectedSkuFamily] = useState<SkuFamily | null>(
    null
  );
  const [openSubRowDropdownId, setOpenSubRowDropdownId] = useState<
    string | null
  >(null);
  const [subRowDropdownPosition, setSubRowDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [editingSequenceId, setEditingSequenceId] = useState<string | null>(null);
  const [editingSequenceValue, setEditingSequenceValue] = useState<string>("");
  const [editingSubRowSequenceId, setEditingSubRowSequenceId] = useState<string | null>(null);
  const [editingSubRowSequenceValue, setEditingSubRowSequenceValue] = useState<string>("");
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [currentPage, debouncedSearchTerm]);

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
      }
      if (
        !(event.target as HTMLElement).closest(".subrow-dropdown-container")
      ) {
        setOpenSubRowDropdownId(null);
        setSubRowDropdownPosition(null);
      }
    };

    const handleResize = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
      }
      if (openSubRowDropdownId) {
        setOpenSubRowDropdownId(null);
        setSubRowDropdownPosition(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, [openDropdownId, openSubRowDropdownId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await SkuFamilyService.getSkuFamilyList(
        currentPage,
        itemsPerPage,
        debouncedSearchTerm.trim()
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
      const response = await SubSkuFamilyService.getSubSkuFamilyList(
        1,
        100,
        parentId
      );
      if (response.data?.docs) {
        setSubRows((prev) => ({
          ...prev,
          [parentId]: response.data.docs,
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
  };

  const handleSequenceSave = async (item: SkuFamily) => {
    if (!item._id) return;
    const sequence = parseInt(editingSequenceValue);
    if (isNaN(sequence) || sequence < 0) {
      toastHelper.showTost("Sequence must be a valid number (0 or higher)", "error");
      setEditingSequenceId(null);
      setEditingSequenceValue("");
      return;
    }
    try {
      await SkuFamilyService.updateSequence(item._id, sequence);
      setEditingSequenceId(null);
      setEditingSequenceValue("");
      fetchData();
    } catch (err: any) {
      console.error("Error updating sequence:", err);
      setEditingSequenceId(null);
      setEditingSequenceValue("");
    }
  };

  const handleSubRowSequenceSave = async (subRow: any, parentId?: string) => {
    if (!subRow._id) return;
    const sequence = parseInt(editingSubRowSequenceValue);
    if (isNaN(sequence) || sequence < 0) {
      toastHelper.showTost("Sequence must be a valid number (0 or higher)", "error");
      setEditingSubRowSequenceId(null);
      setEditingSubRowSequenceValue("");
      return;
    }
    try {
      await SubSkuFamilyService.updateSequence(subRow._id, sequence);
      setEditingSubRowSequenceId(null);
      setEditingSubRowSequenceValue("");
      // Refresh the sub-rows for this parent
      if (parentId) {
        await fetchSubRows(parentId);
      } else if (subRow.skuFamilyId) {
        await fetchSubRows(subRow.skuFamilyId);
      }
    } catch (err: any) {
      console.error("Error updating sub-row sequence:", err);
      setEditingSubRowSequenceId(null);
      setEditingSubRowSequenceValue("");
    }
  };

  const handleView = (skuFamily: SkuFamily) => {
    setSelectedSkuFamily(skuFamily);
    setOpenDropdownId(null);
  };

  const handleSubRowView = (subRow: SkuFamily) => {
    setSelectedSubRow(subRow);
    setOpenSubRowDropdownId(null);
    setSubRowDropdownPosition(null);
  };

  const handleAddSubRow = (id: string) => {
    setParentRowId(id);
    setIsSubRowModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleSubRowSave = async (formData: FormData) => {
    try {
      // If skuFamilyCode is not provided, use parentRowId as fallback
      if (!formData.has("skuFamilyCode") && parentRowId) {
        // Get the SKU Family code from the parent
        const parentSkuFamily = skuFamilyData.find(item => item._id === parentRowId);
        if (parentSkuFamily && parentSkuFamily.code) {
          formData.append("skuFamilyCode", parentSkuFamily.code);
        } else {
          // Fallback to ID if code not available
          formData.append("skuFamilyId", parentRowId);
        }
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
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));

    // Fetch sub-rows when expanding
    if (isExpanding) {
      fetchSubRows(rowId);
    }
  };

  const handleSubRowEdit = (parentId: string, subRowId: string) => {
    // Find the sub-row to edit
    const subRow = subRows[parentId]?.find((row) => row._id === subRowId);
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

      // If skuFamilyCode is not provided, get it from the parent SKU Family
      if (!formData.has("skuFamilyCode")) {
        const parentSkuFamily = skuFamilyData.find(item => item._id === editingSubRow.parentId);
        if (parentSkuFamily && parentSkuFamily.code) {
          formData.append("skuFamilyCode", parentSkuFamily.code);
        } else {
          // Fallback to ID if code not available
          formData.append("skuFamilyId", editingSubRow.parentId);
        }
      }

      // Use SubSkuFamilyService to update the sub-row
      await SubSkuFamilyService.updateSubSkuFamily(
        editingSubRow.subRow._id!,
        formData
      );

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

    // Handle deeply nested arrays by flattening them
    const flattenArray = (arr: any): any[] => {
      if (!Array.isArray(arr)) return [arr];
      return arr.reduce((flat: any[], item: any) => {
        if (Array.isArray(item)) {
          return flat.concat(flattenArray(item));
        }
        // Handle stringified arrays
        if (
          typeof item === "string" &&
          item.startsWith("[") &&
          item.endsWith("]")
        ) {
          try {
            const parsed = JSON.parse(item);
            return flat.concat(flattenArray(parsed));
          } catch {
            return flat.concat(item);
          }
        }
        return flat.concat(item);
      }, []);
    };

    if (Array.isArray(data)) {
      const flattened = flattenArray(data);
      const cleanData = flattened.filter(
        (item) => item && item !== "N/A" && item.trim() !== ""
      );
      return cleanData.length > 0 ? cleanData.join(", ") : "N/A";
    }

    // Handle string that might be a JSON array
    if (
      typeof data === "string" &&
      data.startsWith("[") &&
      data.endsWith("]")
    ) {
      try {
        const parsed = JSON.parse(data);
        const flattened = flattenArray(parsed);
        const cleanData = flattened.filter(
          (item) => item && item !== "N/A" && item.trim() !== ""
        );
        return cleanData.length > 0 ? cleanData.join(", ") : "N/A";
      } catch {
        return data;
      }
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
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-1 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors"
              onClick={async () => {
                try {
                  await SkuFamilyService.downloadSample();
                } catch (error) {
                  console.error('Failed to download sample:', error);
                }
              }}
              title="Download Sample Excel"
            >
              <i className="fas fa-download text-xs"></i>
              Sample
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 transition-colors"
              onClick={async () => {
                try {
                  await SkuFamilyService.exportToExcel();
                  fetchData();
                } catch (error) {
                  console.error('Failed to export:', error);
                }
              }}
              title="Export to Excel"
            >
              <i className="fas fa-file-export text-xs"></i>
              Export
            </button>
            <label className="inline-flex items-center gap-1 rounded-lg bg-orange-600 text-white px-4 py-2 text-sm font-medium hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 transition-colors cursor-pointer">
              <i className="fas fa-file-import text-xs"></i>
              Import
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      await SkuFamilyService.importFromExcel(file);
                      fetchData();
                    } catch (error) {
                      console.error('Failed to import:', error);
                    }
                  }
                  e.target.value = '';
                }}
              />
            </label>
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
        </div>
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="w-12 px-2 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  <i className="fas fa-expand-arrows-alt text-gray-500"></i>
                </th>
                <th className="w-20 px-2 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  ID
                </th>
                <th className="w-24 px-2 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Code
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
                <th className="w-24 px-2 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Sequence
                </th>
                <th className="w-20 px-2 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
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
                      Loading SKU Families...
                    </div>
                  </td>
                </tr>
              ) : !skuFamilyData || skuFamilyData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <i className="fas fa-box-open text-4xl text-gray-400 dark:text-gray-500"></i>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          No SKU Families Found
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                          {searchTerm.trim() 
                            ? `No SKU families match your search "${searchTerm}". Try adjusting your search terms.`
                            : "There are no SKU families available at the moment. Click the 'Add SKU Family' button to create your first SKU family."}
                        </p>
                      </div>
                      {!searchTerm.trim() && (
                        <button
                          onClick={() => {
                            setEditId(null);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#0071E0] text-white px-6 py-2.5 text-sm font-medium hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors mt-4"
                        >
                          <i className="fas fa-plus text-xs"></i>
                          Add SKU Family
                        </button>
                      )}
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
                          <i
                            className={`fas fa-chevron-${
                              item._id && expandedRows[item._id]
                                ? "down"
                                : "right"
                            } text-sm`}
                          ></i>
                        </button>
                      </td>
                      <td className="w-20 px-2 py-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                        {item.id || "-"}
                      </td>
                      <td className="w-24 px-2 py-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                        {item.code || "-"}
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
                      <td className="w-24 px-2 py-4 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={editingSequenceId === item._id ? editingSequenceValue : (item.sequence ?? 0)}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (editingSequenceId !== item._id) {
                                setEditingSequenceId(item._id || null);
                              }
                              if (value === "" || /^\d+$/.test(value)) {
                                setEditingSequenceValue(value);
                              }
                            }}
                            onBlur={() => {
                              if (editingSequenceId === item._id && editingSequenceValue !== "") {
                                handleSequenceSave(item);
                              } else if (editingSequenceId === item._id) {
                                setEditingSequenceId(null);
                                setEditingSequenceValue("");
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && editingSequenceId === item._id) {
                                handleSequenceSave(item);
                              } else if (e.key === "Escape" && editingSequenceId === item._id) {
                                setEditingSequenceId(null);
                                setEditingSequenceValue("");
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="w-20 px-2 py-4 text-sm text-center relative">
                        <div className="inline-flex items-center justify-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(item);
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="View"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              item._id && handleAddSubRow(item._id);
                            }}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                            title="Add Variant"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              item._id && handleEdit(item._id);
                            }}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              item._id && handleDelete(item._id);
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Sub-rows */}
                    {item._id &&
                      expandedRows[item._id] &&
                      subRows[item._id] &&
                      subRows[item._id].map((subRow, subIndex) => (
                        <tr
                          key={`sub-${item._id}-${subIndex}`}
                          className="bg-gray-50 dark:bg-gray-800/50"
                        >
                          <td className="w-12 px-2 py-4 text-center">
                            <div className="w-4 h-4 border-l-2 border-b-2 border-gray-300 dark:border-gray-500 ml-2"></div>
                          </td>
                          <td className="w-20 px-2 py-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                            {/* ID for sub-row */}
                          </td>
                          <td className="w-24 px-2 py-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                            {/* Code for sub-row */}
                          </td>
                          <td className="w-32 px-2 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            <div className="flex items-center gap-3">
                              <img
                                src={(function () {
                                  const base = (import.meta as any).env?.VITE_BASE_URL || "";
                                  const first =
                                    Array.isArray(subRow.images) &&
                                    subRow.images.length > 0
                                      ? subRow.images[0]
                                      : "";
                                  if (!first) return placeholderImage;
                                  const isAbsolute = /^https?:\/\//i.test(first);
                                  return isAbsolute
                                    ? first
                                    : `${base}${first.startsWith("/") ? "" : "/"}${first}`;
                                })()}
                                alt={subRow.name || "Sub-Product"}
                                className="w-10 h-10 object-contain rounded-md border border-gray-200 dark:border-gray-600 flex-shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    placeholderImage;
                                }}
                              />
                              <span className="truncate">{subRow.name || "N/A"}</span>
                            </div>
                          </td>
                          <td className="w-24 px-2 py-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                            {displayArrayData(subRow.colorVariant)}
                          </td>
                          <td className="w-20 px-2 py-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                            {subRow.country || "N/A"}
                          </td>
                          <td className="w-24 px-2 py-4 text-sm text-center">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={editingSubRowSequenceId === subRow._id ? editingSubRowSequenceValue : ((subRow as any).sequence ?? 0)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (editingSubRowSequenceId !== subRow._id) {
                                    setEditingSubRowSequenceId(subRow._id || null);
                                  }
                                  if (value === "" || /^\d+$/.test(value)) {
                                    setEditingSubRowSequenceValue(value);
                                  }
                                }}
                                onBlur={() => {
                                  if (editingSubRowSequenceId === subRow._id && editingSubRowSequenceValue !== "") {
                                    handleSubRowSequenceSave(subRow, item._id || undefined);
                                  } else if (editingSubRowSequenceId === subRow._id) {
                                    setEditingSubRowSequenceId(null);
                                    setEditingSubRowSequenceValue("");
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && editingSubRowSequenceId === subRow._id) {
                                    handleSubRowSequenceSave(subRow, item._id || undefined);
                                  } else if (e.key === "Escape" && editingSubRowSequenceId === subRow._id) {
                                    setEditingSubRowSequenceId(null);
                                    setEditingSubRowSequenceValue("");
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="w-20 px-2 py-4 text-sm text-center">
                            <div className="subrow-dropdown-container relative">
                              <button
                                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const subRowId = `${item._id}-${subRow._id}`;
                                  if (openSubRowDropdownId === subRowId) {
                                    setOpenSubRowDropdownId(null);
                                    setSubRowDropdownPosition(null);
                                  } else {
                                    const rect =
                                      e.currentTarget.getBoundingClientRect();
                                    const dropdownWidth = 192;
                                    const dropdownHeight = 200;
                                    let top = rect.bottom + 8;
                                    let left = rect.right - dropdownWidth;

                                    if (
                                      top + dropdownHeight >
                                      window.innerHeight
                                    ) {
                                      top = rect.top - dropdownHeight - 8;
                                    }
                                    if (left < 8) {
                                      left = 8;
                                    }
                                    if (
                                      left + dropdownWidth >
                                      window.innerWidth - 8
                                    ) {
                                      left =
                                        window.innerWidth - dropdownWidth - 8;
                                    }

                                    setSubRowDropdownPosition({ top, left });
                                    setOpenSubRowDropdownId(subRowId);
                                  }
                                }}
                              >
                                <i className="fas fa-ellipsis-v"></i>
                              </button>
                              {openSubRowDropdownId ===
                                `${item._id}-${subRow._id}` &&
                                subRowDropdownPosition && (
                                  <div
                                    className="fixed w-48 bg-white border rounded-md shadow-lg"
                                    style={{
                                      top: `${subRowDropdownPosition.top}px`,
                                      left: `${subRowDropdownPosition.left}px`,
                                      zIndex: 9999,
                                    }}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubRowView(subRow);
                                      }}
                                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600"
                                    >
                                      <i className="fas fa-eye"></i>
                                      View
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubRowEdit(
                                          item._id!,
                                          subRow._id!
                                        );
                                      }}
                                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-green-600"
                                    >
                                      <i className="fas fa-edit"></i>
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubRowDelete(
                                          item._id!,
                                          subRow._id!
                                        );
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
                      ))}
                    {/* Empty sub-row message when no sub-rows exist */}
                    {item._id &&
                      expandedRows[item._id] &&
                      (!subRows[item._id] ||
                        subRows[item._id].length === 0) && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td className="w-12 px-2 py-4 text-center">
                            <div className="w-4 h-4 border-l-2 border-b-2 border-gray-300 dark:border-gray-500 ml-2"></div>
                          </td>
                          <td className="px-2 py-4 text-sm text-gray-500 dark:text-gray-400" colSpan={7}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <i className="fas fa-box-open text-gray-400 dark:text-gray-500"></i>
                                <span>No variants available for this SKU Family.</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalDocs > 0 && (
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
        )}
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
                    const first =
                      Array.isArray(selectedSkuFamily.images) &&
                      selectedSkuFamily.images.length > 0
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
                    (e.currentTarget as HTMLImageElement).src =
                      placeholderImage;
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
                  {selectedSkuFamily.images &&
                  selectedSkuFamily.images.length > 0 ? (
                    selectedSkuFamily.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={(function () {
                            const base =
                              (import.meta as any).env?.VITE_BASE_URL || "";
                            const isAbsolute = /^https?:\/\//i.test(image);
                            return isAbsolute
                              ? image
                              : `${base}${
                                  image.startsWith("/") ? "" : "/"
                                }${image}`;
                          })()}
                          alt={`${selectedSkuFamily.name} - Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              placeholderImage;
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
      {selectedSubRow && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300"
          onClick={() => setSelectedSubRow(null)}
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
                    const first =
                      Array.isArray(selectedSubRow.images) &&
                      selectedSubRow.images.length > 0
                        ? selectedSubRow.images[0]
                        : "";
                    if (!first) return placeholderImage;
                    const isAbsolute = /^https?:\/\//i.test(first);
                    return isAbsolute
                      ? first
                      : `${base}${first.startsWith("/") ? "" : "/"}${first}`;
                  })()}
                  alt={selectedSubRow.name || "Sub SKU Family"}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 flex-shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      placeholderImage;
                  }}
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedSubRow.name || "N/A"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sub SKU Family Details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubRow(null)}
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
                      {selectedSubRow.name || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Code
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {selectedSubRow.code || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Brand
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {selectedSubRow.brand || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {selectedSubRow.description || "N/A"}
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
                      {displayArrayData(selectedSubRow.colorVariant)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {selectedSubRow.country || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SIM Type
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {displayArrayData(selectedSubRow.simType)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Network Bands
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {displayArrayData(selectedSubRow.networkBands)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Images
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedSubRow.images && selectedSubRow.images.length > 0 ? (
                    selectedSubRow.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={(function () {
                            const base =
                              (import.meta as any).env?.VITE_BASE_URL || "";
                            const isAbsolute = /^https?:\/\//i.test(image);
                            return isAbsolute
                              ? image
                              : `${base}${
                                  image.startsWith("/") ? "" : "/"
                                }${image}`;
                          })()}
                          alt={`${selectedSubRow.name} - Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              placeholderImage;
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

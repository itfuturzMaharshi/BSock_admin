import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import toastHelper from "../../utils/toastHelper";
import StorageModal from "./StorageModal";
import { StorageService, Storage } from "../../services/storage/storage.services";
import { BrandService } from "../../services/brand/brand.services";
import { useDebounce } from "../../hooks/useDebounce";

const StorageTable: React.FC = () => {
  const [storagesData, setStoragesData] = useState<Storage[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editStorage, setEditStorage] = useState<Storage | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingSequenceId, setEditingSequenceId] = useState<string | null>(null);
  const [editingSequenceValue, setEditingSequenceValue] = useState<string>("");

  useEffect(() => {
    fetchStorages();
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  const fetchStorages = async () => {
    try {
      setLoading(true);
      const response = await StorageService.getStorageList(
        currentPage,
        itemsPerPage,
        debouncedSearchTerm
      );

      setStoragesData(response.data.docs);
      setTotalDocs(response.data.totalDocs || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch storages:", error);
      setStoragesData([]);
      setTotalPages(1);
      setTotalDocs(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (storageData: any) => {
    try {
      if (editStorage && editStorage._id) {
        await StorageService.updateStorage(editStorage._id, storageData);
        toastHelper.showTost("Storage updated successfully!", "success");
      } else {
        await StorageService.createStorage(storageData);
        toastHelper.showTost("Storage added successfully!", "success");
      }
      setIsModalOpen(false);
      setEditStorage(null);
      fetchStorages();
    } catch (error) {
      console.error("Failed to save storage:", error);
    }
  };

  const handleEdit = (storage: Storage) => {
    setEditStorage(storage);
    setIsModalOpen(true);
  };

  const handleDelete = async (storage: Storage) => {
    if (!storage._id) return;

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
        await StorageService.deleteStorage(storage._id);
        toastHelper.showTost("Storage deleted successfully!", "success");
        fetchStorages();
      } catch (error) {
        console.error("Failed to delete storage:", error);
      }
    }
  };

  const handleSequenceClick = (item: Storage) => {
    if (!item._id) return;
    setEditingSequenceId(item._id);
    setEditingSequenceValue((item.sequence ?? 1).toString());
  };

  const handleSequenceCancel = () => {
    setEditingSequenceId(null);
    setEditingSequenceValue("");
  };

  const handleSequenceSave = async (item: Storage) => {
    if (!item._id) return;
    
    if (editingSequenceValue === "" || editingSequenceValue === null) {
      handleSequenceCancel();
      return;
    }
    
    const newSequence = parseInt(editingSequenceValue, 10);
    if (isNaN(newSequence) || newSequence < 1) {
      toastHelper.showTost("Please enter a valid sequence number (1 or higher)", "error");
      return;
    }

    const currentSequence = item.sequence ?? 1;
    
    if (newSequence === currentSequence) {
      handleSequenceCancel();
      return;
    }

    try {
      await StorageService.updateSequence(item._id, newSequence);
      setEditingSequenceId(null);
      setEditingSequenceValue("");
      await fetchStorages();
    } catch (error: any) {
      console.error("Failed to update sequence:", error);
      const errorMessage = error?.message || "Failed to update sequence";
      toastHelper.showTost(errorMessage, "error");
    }
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
                placeholder="Search storages..."
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
                  await BrandService.downloadSample();
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
                  await BrandService.exportToExcel();
                  fetchStorages();
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
                      await BrandService.importFromExcel(file);
                      fetchStorages();
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
                setEditStorage(null);
                setIsModalOpen(true);
              }}
            >
              <i className="fas fa-plus text-xs"></i>
              Add Storage
            </button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Description
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Sequence
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
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
                      Loading Storages...
                    </div>
                  </td>
                </tr>
              ) : storagesData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      No storages found
                    </div>
                  </td>
                </tr>
              ) : (
                storagesData.map((item: Storage, index: number) => (
                  <tr
                    key={item._id || index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.id || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.code || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {item.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={editingSequenceId === item._id ? editingSequenceValue : (item.sequence ?? 1)}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (editingSequenceId !== item._id) {
                              handleSequenceClick(item);
                            }
                            if (value === "" || /^\d+$/.test(value)) {
                              setEditingSequenceValue(value);
                            }
                          }}
                          onBlur={() => {
                            if (editingSequenceId === item._id && editingSequenceValue !== "") {
                              handleSequenceSave(item);
                            } else if (editingSequenceId === item._id) {
                              handleSequenceCancel();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (editingSequenceId === item._id) {
                                handleSequenceSave(item);
                              } else {
                                handleSequenceClick(item);
                              }
                            } else if (e.key === "Escape" && editingSequenceId === item._id) {
                              handleSequenceCancel();
                            }
                          }}
                          onFocus={() => {
                            if (editingSequenceId !== item._id) {
                              handleSequenceClick(item);
                            }
                          }}
                          className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="1"
                        />
                        {editingSequenceId === item._id && (
                          <button
                            onClick={() => handleSequenceSave(item)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            title="Save Sequence"
                          >
                            <i className="fas fa-check text-xs"></i>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                          title="Edit Storage"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title="Delete Storage"
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
            Showing {storagesData.length} of {totalDocs} items
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

      <StorageModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditStorage(null);
        }}
        onSave={handleSave}
        editItem={editStorage || undefined}
      />
    </div>
  );
};

export default StorageTable;


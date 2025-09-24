import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import CostModuleModal from "./CostModuleModal";
import { CostModuleService } from "../../services/costModule/costModule.services";

// Define the interface for CostModule data
interface CostModule {
  _id?: string;
  type: "Product" | "Categories" | "Country" | "ExtraDelivery";
  products: Product[];
  categories: string[];
  countries: string[];
  remark: string;
  costType: "Percentage" | "Fixed";
  value: number;
  minValue?: number;
  maxValue?: number;
  isDeleted: boolean;
}

interface Product {
  _id: string;
  specification: string;
}

const CostModuleTable: React.FC = () => {
  const [costModules, setCostModules] = useState<CostModule[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<CostModule | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  // Fetch cost modules on component mount and when searchTerm or currentPage changes
  const fetchCostModules = async () => {
    setLoading(true);
    try {
      const response = await CostModuleService.listCostModules({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });
      if (response.status === 200 && response.data) {
        setCostModules(response.data.docs);
        setTotalDocs(response.data.totalDocs);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching cost modules:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostModules();
  }, [currentPage, searchTerm]);

  const handleSave = async (newItem: CostModule) => {
    try {
      if (editItem && editItem._id) {
        // Update existing cost module
        const updates = {
          type: newItem.type,
          products: newItem.products,
          categories: newItem.categories,
          countries: newItem.countries,
          remark: newItem.remark,
          costType: newItem.costType,
          value: newItem.value,
          minValue: newItem.minValue,
          maxValue: newItem.maxValue,
        };
        await CostModuleService.updateCostModule(editItem._id, updates);
      } else {
        // Create new cost module
        await CostModuleService.createCostModule(newItem);
      }
      // Refresh the list after save
      await fetchCostModules();
      setIsModalOpen(false);
      setEditItem(undefined);
    } catch (error) {
      console.error("Error saving cost module:", error);
    }
  };

  const handleEdit = (item: CostModule) => {
    setEditItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the cost module!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "No, cancel!",
    });

    if (confirmed.isConfirmed) {
      try {
        await CostModuleService.deleteCostModule(id);
        // Refresh the list after delete
        await fetchCostModules();
      } catch (error) {
        console.error("Error deleting cost module:", error);
      }
    }
  };

  // Paginated data (server-side pagination)
  const paginatedData = costModules;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-lg">
        {/* Table Header with Controls */}
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by remark..."
                className="pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-72 shadow-sm"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0071E0] to-blue-600 text-white px-6 py-3 text-sm font-semibold hover:from-blue-600 hover:to-blue-700 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            onClick={() => {
              setEditItem(undefined);
              setIsModalOpen(true);
            }}
          >
            <i className="fas fa-plus text-xs"></i>
            Add Cost Module
          </button>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
              <tr>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-100 border-b-2 border-gray-300 dark:border-gray-600 align-middle uppercase tracking-wider">
                  <div className="flex items-center gap-2">Type</div>
                </th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-100 border-b-2 border-gray-300 dark:border-gray-600 align-middle uppercase tracking-wider">
                  <div className="flex items-center gap-2">Products</div>
                </th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-100 border-b-2 border-gray-300 dark:border-gray-600 align-middle uppercase tracking-wider">
                  <div className="flex items-center gap-2">Categories</div>
                </th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-100 border-b-2 border-gray-300 dark:border-gray-600 align-middle uppercase tracking-wider">
                  <div className="flex items-center gap-2">Countries</div>
                </th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-100 border-b-2 border-gray-300 dark:border-gray-600 align-middle uppercase tracking-wider">
                  <div className="flex items-center gap-2">Remark</div>
                </th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-100 border-b-2 border-gray-300 dark:border-gray-600 align-middle uppercase tracking-wider">
                  <div className="flex items-center gap-2">Cost Type</div>
                </th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-100 border-b-2 border-gray-300 dark:border-gray-600 align-middle uppercase tracking-wider">
                  <div className="flex items-center gap-2">Value</div>
                </th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-100 border-b-2 border-gray-300 dark:border-gray-600 align-middle uppercase tracking-wider">
                  <div className="flex items-center gap-2">Min Value</div>
                </th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 dark:text-gray-100 border-b-2 border-gray-300 dark:border-gray-600 align-middle uppercase tracking-wider">
                  <div className="flex items-center gap-2">Max Value</div>
                </th>
                <th className="px-6 py-5 text-center text-sm font-bold text-gray-800 dark:text-gray-100 border-b-2 border-gray-300 dark:border-gray-600 align-middle uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-2">Actions</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-16 text-center bg-gray-50 dark:bg-gray-800">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-3 border-blue-600 mx-auto mb-6"></div>
                      <p className="font-medium">Loading Cost Modules...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-16 text-center bg-gray-50 dark:bg-gray-800">
                    <div className="text-gray-500 dark:text-gray-400">
                      <i className="fas fa-inbox text-4xl mb-4 text-gray-300 dark:text-gray-600"></i>
                      <p className="text-lg font-medium mb-2">No cost modules found</p>
                      <p className="text-sm">Try adjusting your search criteria or add a new cost module.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: CostModule) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 group"
                  >
                    <td className="px-6 py-5 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center">
                          <i className="fas fa-box text-xs text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                        {item.products.map(p => p.specification).join(", ") || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                        {item.categories?.join(", ") || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                        {item.countries.join(", ") || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                        {item.remark}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          item.costType === "Percentage"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700"
                        }`}
                      >
                        {item.costType}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                        {item.value}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                        {item.minValue !== undefined ? item.minValue : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                        {item.maxValue !== undefined ? item.maxValue : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-center">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 dark:text-blue-400 dark:hover:text-white dark:hover:bg-blue-500 transition-all duration-200 rounded-lg hover:shadow-md transform hover:-translate-y-0.5"
                          title="Edit Cost Module"
                        >
                          <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(item._id!)}
                          className="p-2 text-red-600 hover:text-white hover:bg-red-600 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-500 transition-all duration-200 rounded-lg hover:shadow-md transform hover:-translate-y-0.5"
                          title="Delete Cost Module"
                        >
                          <i className="fas fa-trash text-sm"></i>
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
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0 font-medium">
            Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{paginatedData.length}</span> of{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{totalDocs}</span> items
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 text-sm transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              <i className="fas fa-chevron-left text-xs mr-2"></i>
              Previous
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-[#0071E0] to-blue-600 text-white border border-blue-600 dark:from-blue-500 dark:to-blue-600 dark:border-blue-500 transform scale-105"
                        : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 text-sm transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              Next
              <i className="fas fa-chevron-right text-xs ml-2"></i>
            </button>
          </div>
        </div>
      </div>

      <CostModuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditItem(undefined);
        }}
        onSave={handleSave}
        editItem={editItem}
      />
    </div>
  );
};

export default CostModuleTable;
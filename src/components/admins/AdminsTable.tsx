import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import toastHelper from "../../utils/toastHelper";
import AdminsModal from "./AdminsModal";
import { AdminService, Admin } from "../../services/admin/admin.services";

const AdminsTable: React.FC = () => {
  const [adminsData, setAdminsData] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const itemsPerPage = 10;

  // Fetch admins data
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await AdminService.listAdmins({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });
      
      if (response.status === 200 && response.data) {
        // Filter out admins that have already logged in
        const currentUserId = localStorage.getItem('userId');
        const filteredAdmins = response.data.docs.filter(admin => admin._id !== currentUserId);
        
        setAdminsData(filteredAdmins);
        setTotalPages(response.data.totalPages);
        setTotalDocs(filteredAdmins.length); // Update total count to reflect filtered results
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toastHelper.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [currentPage, searchTerm]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchAdmins();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSave = () => {
    // Refresh the data after save
    fetchAdmins();
    setIsModalOpen(false);
  };

  const handleDelete = async (admin: Admin) => {
    const confirmed = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the admin! This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete permanently!",
      cancelButtonText: "No, cancel!",
      confirmButtonColor: "#dc2626",
    });

    if (confirmed.isConfirmed) {
      try {
        await AdminService.deleteAdmin({ id: admin._id });
        fetchAdmins(); // Refresh the data
      } catch (error) {
        console.error('Error deleting admin:', error);
      }
    }
  };

  // No need for client-side filtering since we're using server-side search

  return (
    <div className="p-4">
      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        {/* Table Header with Controls */}
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3 w-[85%]">
            {/* Search */}
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by name or email..."
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
            className="inline-flex items-center gap-3 rounded-lg bg-[#0071E0] text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            onClick={() => {
              setIsModalOpen(true);
            }}
          >
            <i className="fas fa-plus text-xs"></i>
            Add Admin
          </button>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Created At
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto mb-4"></div>
                      Loading Admins...
                    </div>
                  </td>
                </tr>
              ) : adminsData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      No admins found
                    </div>
                  </td>
                </tr>
              ) : (
                adminsData.map((item: Admin) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Delete Admin"
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

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
            Showing {adminsData.length} of {totalDocs} items
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm transition-colors"
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentPage === pageNum
                        ? "bg-[#0071E0] text-white dark:bg-blue-500 dark:text-white border border-blue-600 dark:border-blue-500"
                        : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
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
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AdminsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onSave={handleSave}
      />
    </div>
  );
};

export default AdminsTable;

import React, { useState, useEffect } from 'react';
import { CustomerService, Customer } from '../../services/customer/customerService';

const CustomerTable: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await CustomerService.getCustomerList({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });
      
      console.log("Fetched Customer data:", response.docs);
      setCustomers(response.docs);
      setTotalDocs(response.totalDocs || 0);
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
      setTotalDocs(0);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalDocs / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleToggleBidding = async (customerId: string, currentStatus: boolean | undefined) => {
    try {
      await CustomerService.toggleBiddingStatus(customerId);
      // Update the local state
      setCustomers(prevCustomers =>
        prevCustomers.map(customer =>
          customer._id === customerId
            ? { ...customer, isAllowBidding: !currentStatus }
            : customer
        )
      );
    } catch (err) {
      console.error("Error toggling bidding status:", err);
    }
  };


  return (
    <div className="p-4">
      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        {/* Table Header with Controls */}
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3 w-full">
            {/* Search */}
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
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
                  Mobile Number
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Active Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Email Verified
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Approve Status
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Allow Bidding
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto mb-4"></div>
                      Loading Customers...
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      No customers found
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer, index) => (
                  <tr
                    key={customer._id || index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {customer.mobileNumber || customer.whatsappNumber || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {customer.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {customer.isEmailVerified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          Not Verified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {customer.isApproved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {customer.isAllowBidding ? (
                        <span onClick={() => handleToggleBidding(customer._id, customer.isAllowBidding)}
                        className="cursor-pointer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Allowed
                        </span>
                      ) : (
                        <span onClick={() => handleToggleBidding(customer._id, customer.isAllowBidding)} 
                        className="cursor-pointer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Not Allowed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalDocs > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 w-full">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalDocs)} of {totalDocs} entries
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
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
                      onClick={() => handlePageChange(pageNum)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerTable;


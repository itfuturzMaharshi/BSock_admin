import React, { useState } from 'react';
import Swal from 'sweetalert2';
import toastHelper from '../../utils/toastHelper'; // Adjust the path to your toastHelper file
import SkuFamilyModal from './SkuFamilModal';

// Define the interface for country variant
interface CountryVariant {
  country: string;
  simType: string;
  networkBands: string;
}

// Define the interface for SKU family data
interface SkuFamily {
  name: string;
  code: string;
  brand: string;
  description: string;
  images: string;
  colorVariant: string;
  countryVariant: CountryVariant;
}

const SkyFamilyTable: React.FC = () => {
  const [skyFamilyData, setSkyFamilyData] = useState<SkuFamily[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Add loading state
  const itemsPerPage = 10;

  React.useEffect(() => {
    // Simulate data loading (since no API fetch, set to false immediately)
    // If you add API fetch later, move setLoading(false) after fetch
    setLoading(false);
  }, []);

  const handleSave = (newItem: SkuFamily) => {
    if (editIndex !== null) {
      const updatedData = [...skyFamilyData];
      updatedData[editIndex] = newItem;
      setSkyFamilyData(updatedData);
      setEditIndex(null);
      toastHelper.showTost('SKU Family updated successfully!', 'success');
    } else {
      setSkyFamilyData((prev) => [...prev, newItem]);
      toastHelper.showTost('SKU Family added successfully!', 'success');
    }
    setIsModalOpen(false);
  };

  const handleEdit = (index: number) => {
    setEditIndex(index);
    setIsModalOpen(true);
  };

  const handleDelete = async (index: number) => {
    const confirmed = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
    });

    if (confirmed.isConfirmed) {
      const updatedData = skyFamilyData.filter((_, i) => i !== index);
      setSkyFamilyData(updatedData);
      toastHelper.showTost('SKU Family deleted successfully!', 'success');
    }
  };

  // Filter data
  const filteredData = skyFamilyData.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDocs = filteredData.length;
  const totalPages = Math.ceil(totalDocs / itemsPerPage);

  // Paginate data
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-0">
      {/* Font Awesome CDN */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Table Header with Controls */}
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by name or code..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            onClick={() => {
              setEditIndex(null);
              setIsModalOpen(true);
            }}
          >
            <i className="fas fa-plus text-xs"></i>
            Add SKU Family
          </button>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th
                  className="px-4 py-3 text-left text-base font-medium text-gray-500 dark:text-gray-400"
                >
                  Image
                </th>
                <th
                  className="px-4 py-3 text-left text-base font-medium text-gray-500 dark:text-gray-400"
                >
                  Name
                </th>
                <th
                  className="px-4 py-3 text-left text-base font-medium text-gray-500 dark:text-gray-400"
                >
                  Code
                </th>
                <th
                  className="px-4 py-3 text-left text-base font-medium text-gray-500 dark:text-gray-400"
                >
                  Brand
                </th>
                <th
                  className="px-4 py-3 text-left text-base font-medium text-gray-500 dark:text-gray-400"
                >
                  Description
                </th>
                <th
                  className="px-4 py-3 text-left text-base font-medium text-gray-500 dark:text-gray-400"
                >
                  Color Variant
                </th>
                <th
                  className="px-4 py-3 text-left text-base font-medium text-gray-500 dark:text-gray-400"
                >
                </th>
                <th
                  className="px-4 py-3 text-left text-base font-medium text-gray-500 dark:text-gray-400"
                >
                </th>
                <th
                  className="px-4 py-3 text-center text-base font-medium text-gray-500 dark:text-gray-400"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="text-gray-400 text-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      Loading SKU Families...
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="text-gray-400 text-lg">No products found</div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: SkuFamily, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.images ? (
                        <img
                          src={item.images.split(', ')[0]}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/64';
                          }}
                        />
                      ) : (
                        <img
                          src="https://via.placeholder.com/64"
                          alt="No image"
                          className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      {item.name}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.countryVariant.country}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.brand}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs overflow-hidden">
                      {item.description}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        SIM Type: {item.countryVariant.simType}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Network Bands: {item.countryVariant.networkBands}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.colorVariant}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <button
                        onClick={() => handleEdit(index)}
                        className="text-blue-500 hover:text-blue-700 mr-3"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">
            Showing {paginatedData.length} of {totalDocs} items
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-sm"
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
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentPage === pageNum
                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20"
                        : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
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
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-sm"
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
          setEditIndex(null);
        }}
        onSave={handleSave}
        editItem={editIndex !== null ? skyFamilyData[editIndex] : undefined}
      />
    </div>
  );
};

export default SkyFamilyTable;
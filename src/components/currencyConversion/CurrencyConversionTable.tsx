// import React, { useState, useEffect } from 'react';
// import Swal from 'sweetalert2';
// import { CurrencyConversionService, CurrencyConversion } from '../../services/currencyConversion/currencyConversion.services';
// import toastHelper from '../../utils/toastHelper';
// import CurrencyConversionModal from './CurrencyConversionModal.tsx';

// const CurrencyConversionTable: React.FC = () => {
//   const [currencyConversions, setCurrencyConversions] = useState<CurrencyConversion[]>([]);
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
//   const [editId, setEditId] = useState<string | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [totalDocs, setTotalDocs] = useState<number>(0);
//   const itemsPerPage = 10;

//   useEffect(() => {
//     fetchData();
//   }, [currentPage, searchTerm]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const response = await CurrencyConversionService.listCurrencyConversions({
//         page: currentPage,
//         limit: itemsPerPage,
//       });
      
//       if (response.data?.docs) {
//         console.log("Fetched Currency Conversion data:", response.data.docs);
//         setCurrencyConversions(response.data.docs);
//         setTotalDocs(response.data.totalDocs || 0);
//       } else {
//         console.log("No currency conversion data received");
//         setCurrencyConversions([]);
//         setTotalDocs(0);
//       }
//     } catch (err: any) {
//       console.error("Error fetching currency conversions:", err);
      
//       if (err.message?.includes('Authentication required')) {
//         toastHelper.showTost("Please login to access currency conversions", "error");
//       } else if (err.message?.includes('API endpoint not found')) {
//         toastHelper.showTost("Currency conversion feature is not available. Please contact administrator.", "error");
//       } else {
//         toastHelper.showTost("Failed to fetch currency conversions", "error");
//       }
      
//       setCurrencyConversions([]);
//       setTotalDocs(0);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSave = async (formData: any) => {
//     try {
//       if (editId) {
//         await CurrencyConversionService.updateCurrencyConversion(editId, formData);
//       } else {
//         await CurrencyConversionService.createCurrencyConversion(formData);
//       }
//       fetchData();
//       setIsModalOpen(false);
//       setEditId(null);
//     } catch (err: any) {
//       console.error("Error saving currency conversion:", err);
      
//       if (err.message?.includes('Authentication required')) {
//         toastHelper.showTost("Please login to save currency conversions", "error");
//       } else if (err.message?.includes('API endpoint not found')) {
//         toastHelper.showTost("Currency conversion feature is not available. Please contact administrator.", "error");
//       } else {
//         toastHelper.showTost("Failed to save currency conversion", "error");
//       }
//     }
//   };

//   const handleEdit = (id: string) => {
//     console.log("HandleEdit called with ID:", id);
//     const selectedItem = currencyConversions.find((item) => item._id === id);
//     console.log("Selected item for edit:", selectedItem);
    
//     setIsModalOpen(false);
//     setEditId(null);
    
//     setTimeout(() => {
//       setEditId(id);
//       setIsModalOpen(true);
//     }, 50);
//   };

//   const handleDelete = async (id: string) => {
//     const confirmed = await Swal.fire({
//       title: "Are you sure?",
//       text: "This will delete the Currency Conversion!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, delete!",
//       cancelButtonText: "No, cancel!",
//     });

//     if (confirmed.isConfirmed) {
//       try {
//         await CurrencyConversionService.deleteCurrencyConversion({ id });
//         fetchData();
//       } catch (err: any) {
//         console.error("Error deleting currency conversion:", err);
        
//         if (err.message?.includes('Authentication required')) {
//           toastHelper.showTost("Please login to delete currency conversions", "error");
//         } else if (err.message?.includes('API endpoint not found')) {
//           toastHelper.showTost("Currency conversion feature is not available. Please contact administrator.", "error");
//         } else {
//           toastHelper.showTost("Failed to delete currency conversion", "error");
//         }
//       }
//     }
//   };

//   const totalPages = Math.ceil(totalDocs / itemsPerPage);

//   const handlePageChange = (page: number) => {
//     setCurrentPage(page);
//   };

//   const handleCreateNew = () => {
//     setEditId(null);
//     setIsModalOpen(true);
//   };

//   const getEditItem = () => {
//     if (!editId) return null;
//     return currencyConversions.find((item) => item._id === editId) || null;
//   };

//   return (
//     <div className="p-6">
//       <link
//         rel="stylesheet"
//         href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
//       />
      

//       {/* Table Container */}
//       <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
//         {/* Table Header with Controls */}
//         <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
//           <div className="flex items-center gap-3 flex-1">
//             {/* Search */}
//             <div className="relative flex-1 max-w-md">
//               <i className="fas fa-search absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
//               <input
//                 type="text"
//                 placeholder="Search by currency code..."
//                 className="pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] text-sm w-full transition-all"
//                 value={searchTerm}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   setSearchTerm(e.target.value);
//                   setCurrentPage(1);
//                 }}
//               />
//             </div>
//           </div>

//           <button
//             className="inline-flex items-center gap-2 rounded-lg bg-[#0071E0] hover:bg-[#0061c0] text-white px-5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
//             onClick={handleCreateNew}
//           >
//             <i className="fas fa-plus text-sm"></i>
//             Add Conversion
//           </button>
//         </div>

//         {/* Table */}
//         <div className="max-w-full overflow-x-auto">
//           <table className="w-full table-auto">
//             <thead className="bg-gray-50 dark:bg-gray-900">
//               <tr>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Currency Code
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Rate
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Created At
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center justify-center gap-2">
//                     Actions
//                   </div>
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//               {loading ? (
//                 <tr>
//                   <td colSpan={4} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="relative">
//                         <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200 dark:border-gray-700"></div>
//                         <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#0071E0] border-t-transparent absolute top-0 left-0"></div>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-3">Loading Currency Conversions...</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : currencyConversions.length === 0 ? (
//                 <tr>
//                   <td colSpan={4} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
//                         <i className="fas fa-exchange-alt text-2xl text-gray-400"></i>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No currency conversions found</p>
//                       <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your search criteria</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 currencyConversions.map((conversion, index) => (
//                   <tr
//                     key={conversion._id || index}
//                     className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
//                   >
//                     <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
//                       <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 bg-[#0071E0] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
//                           {conversion.currencyCode?.charAt(0).toUpperCase() || 'C'}
//                         </div>
//                         <span>{conversion.currencyCode}</span>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       <div className="flex items-center gap-2">
//                         <i className="fas fa-dollar-sign text-gray-400 text-xs"></i>
//                         {typeof conversion.rate === 'number' ? conversion.rate.toFixed(4) : parseFloat(conversion.rate || '0').toFixed(4)}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       <div className="flex items-center gap-2">
//                         <i className="fas fa-clock text-gray-400 text-xs"></i>
//                         {conversion.createdAt
//                           ? new Date(conversion.createdAt).toLocaleDateString()
//                           : '-'}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-center">
//                       <div className="flex items-center justify-center gap-2">
//                         <button
//                           onClick={() => handleEdit(conversion._id!)}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-[#0071E0] dark:text-blue-400 transition-colors"
//                           title="Edit Currency Conversion"
//                         >
//                           <i className="fas fa-pen text-xs"></i>
//                         </button>
//                         <button
//                           onClick={() => handleDelete(conversion._id!)}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors"
//                           title="Delete Currency Conversion"
//                         >
//                           <i className="fas fa-trash text-xs"></i>
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         {totalDocs > 0 && (
//           <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
//             <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
//               <i className="fas fa-list text-[#0071E0] text-xs"></i>
//               <span>Showing <span className="text-gray-800 dark:text-gray-200 font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-gray-800 dark:text-gray-200 font-semibold">{Math.min(currentPage * itemsPerPage, totalDocs)}</span> of <span className="text-gray-800 dark:text-gray-200 font-semibold">{totalDocs}</span> entries</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => handlePageChange(currentPage - 1)}
//                 disabled={currentPage === 1}
//                 className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
//               >
//                 <i className="fas fa-chevron-left text-xs"></i>
//                 Previous
//               </button>

//               {/* Page Numbers */}
//               <div className="flex space-x-1.5">
//                 {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                   const pageNum = i + 1;
//                   return (
//                     <button
//                       key={pageNum}
//                       onClick={() => handlePageChange(pageNum)}
//                       className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
//                         currentPage === pageNum
//                           ? "bg-[#0071E0] text-white"
//                           : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
//                       }`}
//                     >
//                       {pageNum}
//                     </button>
//                   );
//                 })}
//               </div>

//               <button
//                 onClick={() => handlePageChange(currentPage + 1)}
//                 disabled={currentPage === totalPages}
//                 className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
//               >
//                 Next
//                 <i className="fas fa-chevron-right text-xs"></i>
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Modal */}
//       <CurrencyConversionModal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setEditId(null);
//         }}
//         onSave={handleSave}
//         editItem={getEditItem()}
//       />
//     </div>
//   );
// };

// export default CurrencyConversionTable;

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { CurrencyConversionService, CurrencyConversion } from '../../services/currencyConversion/currencyConversion.services';
import toastHelper from '../../utils/toastHelper';
import CurrencyConversionModal from './CurrencyConversionModal.tsx';

const CurrencyConversionTable: React.FC = () => {
  const [currencyConversions, setCurrencyConversions] = useState<CurrencyConversion[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const itemsPerPage = 10;

  // Fetch data with debounced search
  useEffect(() => {
    let debounceTimer: number;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await CurrencyConversionService.listCurrencyConversions({
          page: currentPage,
          limit: itemsPerPage,
        });
        
        if (response.data?.docs) {
          console.log("Fetched Currency Conversion data:", response.data.docs);
          // Apply client-side filtering if searchTerm exists
          const filteredData = searchTerm
            ? response.data.docs.filter((conversion) =>
                conversion.currencyCode?.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : response.data.docs;
          setCurrencyConversions(filteredData);
          setTotalDocs(searchTerm ? filteredData.length : response.data.totalDocs || 0);
        } else {
          console.log("No currency conversion data received");
          setCurrencyConversions([]);
          setTotalDocs(0);
        }
      } catch (err: any) {
        console.error("Error fetching currency conversions:", err);
        
        if (err.message?.includes('Authentication required')) {
          toastHelper.showTost("Please login to access currency conversions", "error");
        } else if (err.message?.includes('API endpoint not found')) {
          toastHelper.showTost("Currency conversion feature is not available. Please contact administrator.", "error");
        } else {
          toastHelper.showTost("Failed to fetch currency conversions", "error");
        }
        
        setCurrencyConversions([]);
        setTotalDocs(0);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the fetch
    debounceTimer = setTimeout(() => {
      fetchData();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchTerm]);

  const handleSave = async (formData: any) => {
    try {
      if (editId) {
        await CurrencyConversionService.updateCurrencyConversion(editId, formData);
      } else {
        await CurrencyConversionService.createCurrencyConversion(formData);
      }
      setCurrentPage(1); // Reset to first page after save
      setIsModalOpen(false);
      setEditId(null);
    } catch (err: any) {
      console.error("Error saving currency conversion:", err);
      
      if (err.message?.includes('Authentication required')) {
        toastHelper.showTost("Please login to save currency conversions", "error");
      } else if (err.message?.includes('API endpoint not found')) {
        toastHelper.showTost("Currency conversion feature is not available. Please contact administrator.", "error");
      } else {
        toastHelper.showTost("Failed to save currency conversion", "error");
      }
    }
  };

  const handleEdit = (id: string) => {
    console.log("HandleEdit called with ID:", id);
    const selectedItem = currencyConversions.find((item) => item._id === id);
    console.log("Selected item for edit:", selectedItem);
    
    setIsModalOpen(false);
    setEditId(null);
    
    setTimeout(() => {
      setEditId(id);
      setIsModalOpen(true);
    }, 50);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await Swal.fire({
      title: "Are you sure?",
      html: `
        <div class="text-center">
          <p class="mb-3">This will permanently delete the currency conversion!</p>
          <p class="text-sm text-gray-600">This action cannot be undone.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete permanently!",
      cancelButtonText: "No, cancel!",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      focusCancel: true,
    });

    if (confirmed.isConfirmed) {
      try {
        await CurrencyConversionService.deleteCurrencyConversion({ id });
        setCurrentPage(1); // Reset to first page after delete
      } catch (err: any) {
        console.error("Error deleting currency conversion:", err);
        
        if (err.message?.includes('Authentication required')) {
          toastHelper.showTost("Please login to delete currency conversions", "error");
        } else if (err.message?.includes('API endpoint not found')) {
          toastHelper.showTost("Currency conversion feature is not available. Please contact administrator.", "error");
        } else {
          toastHelper.showTost("Failed to delete currency conversion", "error");
        }
      }
    }
  };

  const totalPages = Math.ceil(totalDocs / itemsPerPage);

  const handleCreateNew = () => {
    setEditId(null);
    setIsModalOpen(true);
  };

  const getEditItem = () => {
    if (!editId) return null;
    return currencyConversions.find((item) => item._id === editId) || null;
  };

  return (
    <div className="p-6 dark:bg-gray-950 min-h-screen font-sans">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
        {/* Table Header with Controls */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <i className="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  type="text"
                  placeholder="Search by currency code..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] transition-all duration-300 text-sm placeholder-gray-400 shadow-sm"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(e.target.value);
                  }}
                />
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#0071E0] hover:bg-[#0061c0] text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={handleCreateNew}
            >
              <i className="fas fa-plus text-xs"></i>
              Add New Conversion
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                {["Currency Code", "Rate", "Created At", "Actions"].map(
                  (header) => (
                    <th
                      key={header}
                      className={`px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                        header === "Actions" ? "text-center" : "text-left"
                      }`}
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 dark:border-gray-700"></div>
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0071E0] border-t-transparent absolute top-0 left-0"></div>
                      </div>
                      <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Loading Currency Conversions...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : currencyConversions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="w-14 h-14 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-exchange-alt text-xl text-gray-400"></i>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                        No currency conversions found
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currencyConversions.map((conversion, index) => (
                  <tr
                    key={conversion._id || index}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#0071E0]/90 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                          {conversion.currencyCode?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {conversion.currencyCode}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <i className="fas fa-dollar-sign text-gray-400 text-sm"></i>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {typeof conversion.rate === 'number' ? conversion.rate.toFixed(4) : parseFloat(conversion.rate || '0').toFixed(4)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <i className="fas fa-calendar text-gray-400 text-sm"></i>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {conversion.createdAt
                            ? new Date(conversion.createdAt).toLocaleDateString()
                            : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2.5">
                        <button
                          onClick={() => handleEdit(conversion._id!)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0071E0]/10 hover:bg-[#0071E0]/20 dark:bg-[#0071E0]/20 dark:hover:bg-[#0071E0]/30 text-[#0071E0] dark:text-[#0071E0] transition-all duration-200 shadow-sm hover:shadow"
                          title="Edit Currency Conversion"
                        >
                          <i className="fas fa-pen text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(conversion._id!)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100/50 hover:bg-red-200/50 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all duration-200 shadow-sm hover:shadow"
                          title="Delete Currency Conversion"
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
        {totalDocs > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-t border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
              <i className="fas fa-list text-[#0071E0] text-sm"></i>
              <span>
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {((currentPage - 1) * itemsPerPage) + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {Math.min(currentPage * itemsPerPage, totalDocs)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {totalDocs}
                </span>{" "}
                entries
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <i className="fas fa-chevron-left text-sm"></i>
                Previous
              </button>
              <div className="flex gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                        currentPage === pageNum
                          ? "bg-[#0071E0] text-white"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                Next
                <i className="fas fa-chevron-right text-sm"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <CurrencyConversionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditId(null);
        }}
        onSave={handleSave}
        editItem={getEditItem()}
      />
    </div>
  );
};

export default CurrencyConversionTable;
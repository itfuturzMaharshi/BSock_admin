// import React, { useState, useEffect } from "react";
// import Swal from "sweetalert2";
// import CostModuleModal from "./CostModuleModal";
// import { CostModuleService } from "../../services/costModule/costModule.services";

// interface CostModule {
//   _id?: string;
//   type: "Product" | "Categories" | "Country" | "ExtraDelivery";
//   products: Product[];
//   categories: string[];
//   countries: string[];
//   remark: string;
//   costType: "Percentage" | "Fixed";
//   value: number;
//   minValue?: number;
//   maxValue?: number;
//   isDeleted: boolean;
// }

// interface Product {
//   _id: string;
//   specification: string;
// }

// const CostModuleTable: React.FC = () => {
//   const [costModules, setCostModules] = useState<CostModule[]>([]);
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
//   const [editItem, setEditItem] = useState<CostModule | undefined>(undefined);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [totalDocs, setTotalDocs] = useState<number>(0);
//   const [totalPages, setTotalPages] = useState<number>(1);
//   const itemsPerPage = 10;

//   const fetchCostModules = async () => {
//     setLoading(true);
//     try {
//       const response = await CostModuleService.listCostModules({
//         page: currentPage,
//         limit: itemsPerPage,
//         search: searchTerm,
//       });
//       if (response.status === 200 && response.data) {
//         setCostModules(response.data.docs);
//         setTotalDocs(response.data.totalDocs);
//         setTotalPages(response.data.totalPages);
//       }
//     } catch (error) {
//       console.error("Error fetching cost modules:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCostModules();
//   }, [currentPage, searchTerm]);

//   const handleSave = async (newItem: CostModule) => {
//     try {
//       if (editItem && editItem._id) {
//         const updates = {
//           type: newItem.type,
//           products: newItem.products.map((p) => p._id),
//           categories: newItem.categories,
//           countries: newItem.countries,
//           remark: newItem.remark,
//           costType: newItem.costType,
//           value: newItem.value,
//           minValue: newItem.minValue,
//           maxValue: newItem.maxValue,
//         };
//         await CostModuleService.updateCostModule(editItem._id, updates);
//       } else {
//         await CostModuleService.createCostModule({
//           type: newItem.type,
//           products: newItem.products.map((p) => p._id),
//           categories: newItem.categories,
//           countries: newItem.countries,
//           remark: newItem.remark,
//           costType: newItem.costType,
//           value: newItem.value,
//           minValue: newItem.minValue,
//           maxValue: newItem.maxValue,
//           isDeleted: newItem.isDeleted,
//         });
//       }
//       await fetchCostModules();
//       setIsModalOpen(false);
//       setEditItem(undefined);
//     } catch (error) {
//       console.error("Error saving cost module:", error);
//     }
//   };

//   const handleEdit = (item: CostModule) => {
//     setEditItem(item);
//     setIsModalOpen(true);
//   };

//   const handleDelete = async (id: string) => {
//     const confirmed = await Swal.fire({
//       title: "Are you sure?",
//       text: "This will permanently delete the cost module!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, delete!",
//       cancelButtonText: "No, cancel!",
//     });

//     if (confirmed.isConfirmed) {
//       try {
//         await CostModuleService.deleteCostModule(id);
//         await fetchCostModules();
//       } catch (error) {
//         console.error("Error deleting cost module:", error);
//       }
//     }
//   };

//   const paginatedData = costModules;

//   return (
//     <div className="p-6">
//       <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

  

//       <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
//         <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
//           <div className="flex items-center gap-3 flex-1">
//             <div className="relative flex-1 max-w-md">
//               <i className="fas fa-search absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
//               <input
//                 type="text"
//                 placeholder="Search by remark..."
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
//             onClick={() => {
//               setEditItem(undefined);
//               setIsModalOpen(true);
//             }}
//           >
//             <i className="fas fa-plus text-sm"></i>
//             Add Cost Module
//           </button>
//         </div>

//         <div className="max-w-full overflow-x-auto">
//           <table className="w-full table-auto">
//             <thead className="bg-gray-50 dark:bg-gray-900">
//               <tr>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Type
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Products
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Categories
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Countries
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Remark
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Cost Type
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Value
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Min
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Max
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
//                   <td colSpan={10} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="relative">
//                         <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200 dark:border-gray-700"></div>
//                         <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#0071E0] border-t-transparent absolute top-0 left-0"></div>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-3">Loading Cost Modules...</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : paginatedData.length === 0 ? (
//                 <tr>
//                   <td colSpan={10} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
//                         <i className="fas fa-calculator text-2xl text-gray-400"></i>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No cost modules found</p>
//                       <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your search criteria</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 paginatedData.map((item: CostModule) => (
//                   <tr
//                     key={item._id}
//                     className={`transition-colors ${
//                       item.isDeleted
//                         ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
//                         : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
//                     }`}
//                   >
//                     <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{item.type}</td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.products.map((p) => p.specification).join(", ") || "-"}</td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.categories?.join(", ") || "-"}</td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.countries.join(", ") || "-"}</td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.remark}</td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
//                         item.costType === "Percentage"
//                           ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700"
//                           : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700"
//                       }`}>
//                         {item.costType}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.value}</td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.minValue !== undefined ? item.minValue : "-"}</td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.maxValue !== undefined ? item.maxValue : "-"}</td>
//                     <td className="px-6 py-4 text-sm text-center">
//                       <div className="flex items-center justify-center gap-2">
//                         <button
//                           onClick={() => handleEdit(item)}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-[#0071E0] dark:text-blue-400 transition-colors"
//                           title="Edit Cost Module"
//                         >
//                           <i className="fas fa-pen text-xs"></i>
//                         </button>
//                         <button
//                           onClick={() => handleDelete(item._id!)}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors"
//                           title="Delete Cost Module"
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

//         <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
//           <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
//             <i className="fas fa-list text-[#0071E0] text-xs"></i>
//             <span>Showing <span className="text-gray-800 dark:text-gray-200 font-semibold">{paginatedData.length}</span> of <span className="text-gray-800 dark:text-gray-200 font-semibold">{totalDocs}</span> items</span>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//               className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
//             >
//               <i className="fas fa-chevron-left text-xs"></i>
//               Previous
//             </button>
//             <div className="flex space-x-1.5">
//               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                 const pageNum = i + 1;
//                 return (
//                   <button
//                     key={pageNum}
//                     onClick={() => setCurrentPage(pageNum)}
//                     className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
//                       currentPage === pageNum
//                         ? "bg-[#0071E0] text-white"
//                         : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
//                     }`}
//                   >
//                     {pageNum}
//                   </button>
//                 );
//               })}
//             </div>
//             <button
//               onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//               disabled={currentPage === totalPages}
//               className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
//             >
//               Next
//               <i className="fas fa-chevron-right text-xs"></i>
//             </button>
//           </div>
//         </div>
//       </div>

//       <CostModuleModal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setEditItem(undefined);
//         }}
//         onSave={handleSave}
//         editItem={editItem}
//       />
//     </div>
//   );
// };

// export default CostModuleTable;

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import CostModuleModal from "./CostModuleModal";
import { CostModuleService } from "../../services/costModule/costModule.services";

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
        const updates = {
          type: newItem.type,
          products: newItem.products.map((p) => p._id),
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
        await CostModuleService.createCostModule({
          type: newItem.type,
          products: newItem.products.map((p) => p._id),
          categories: newItem.categories,
          countries: newItem.countries,
          remark: newItem.remark,
          costType: newItem.costType,
          value: newItem.value,
          minValue: newItem.minValue,
          maxValue: newItem.maxValue,
          isDeleted: newItem.isDeleted,
        });
      }
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
        await fetchCostModules();
      } catch (error) {
        console.error("Error deleting cost module:", error);
      }
    }
  };

  const paginatedData = costModules;

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
                  placeholder="Search by remark..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] transition-all duration-300 text-sm placeholder-gray-400 shadow-sm"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0071E0] hover:bg-[#0061c0] text-white text-sm font-semibold transition-all duration-200 shadow-sm"
              onClick={() => {
                setEditItem(undefined);
                setIsModalOpen(true);
              }}
            >
              <i className="fas fa-plus text-sm"></i>
              Add Cost Module
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                {[
                  "Type",
                  "Products",
                  "Categories",
                  "Countries",
                  "Remark",
                  "Cost Type",
                  "Value",
                  "Min",
                  "Max",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className={`px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      header === "Actions" ? "text-center" : "text-left"
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 dark:border-gray-700"></div>
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0071E0] border-t-transparent absolute top-0 left-0"></div>
                      </div>
                      <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Loading Cost Modules...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="w-14 h-14 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-calculator text-xl text-gray-400"></i>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                        No cost modules found
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: CostModule) => (
                  <tr
                    key={item._id}
                    className={`transition-all duration-200 ${
                      item.isDeleted
                        ? "bg-red-50/50 dark:bg-red-900/20 hover:bg-red-100/50 dark:hover:bg-red-900/30"
                        : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.products.map((p) => p.specification).join(", ") ||
                        "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.categories?.join(", ") || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.countries.join(", ") || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.remark}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
                          item.costType === "Percentage"
                            ? "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200/50 dark:border-green-800/50"
                            : "bg-blue-100/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50"
                        }`}
                      >
                        {item.costType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.value}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.minValue !== undefined ? item.minValue : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.maxValue !== undefined ? item.maxValue : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0071E0]/10 hover:bg-[#0071E0]/20 dark:bg-[#0071E0]/20 dark:hover:bg-[#0071E0]/30 text-[#0071E0] dark:text-[#0071E0] transition-all duration-200 shadow-sm hover:shadow"
                          title="Edit Cost Module"
                        >
                          <i className="fas fa-pen text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(item._id!)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100/50 hover:bg-red-200/50 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all duration-200 shadow-sm hover:shadow"
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
              items
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
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-sm"
            >
              Next
              <i className="fas fa-chevron-right text-sm"></i>
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
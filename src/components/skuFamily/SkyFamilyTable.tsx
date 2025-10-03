// // SkuFamilyTable.tsx
// import React, { useState, useEffect } from "react";
// import Swal from "sweetalert2";
// import { SkuFamilyService } from "../../services/skuFamily/skuFamily.services";
// import toastHelper from "../../utils/toastHelper";
// import SkuFamilyModal from "./SkuFamilModal";
// import placeholderImage from "../../../public/images/product/noimage.jpg";

// interface SkuFamily {
//   _id?: string;
//   name: string;
//   code: string;
//   brand: string;
//   description: string;
//   images: string[];
//   colorVariant: string;
//   country: string;
//   simType: string;
//   networkBands: string;
//   countryVariant?: string;
//   isApproved?: boolean;
//   isDeleted?: boolean;
//   createdAt?: string;
//   updatedAt?: string;
//   updatedBy?: string;
//   approvedBy?: string | null;
//   __v?: string;
// }

// const SkuFamilyTable: React.FC = () => {
//   const [skuFamilyData, setSkuFamilyData] = useState<SkuFamily[]>([]);
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
//       const response = await SkuFamilyService.getSkuFamilyList(
//         currentPage,
//         itemsPerPage,
//         searchTerm.trim()
//       );
//       if (response.data?.docs) {
//         console.log("Fetched SKU Family data:", response.data.docs);
//         setSkuFamilyData(response.data.docs);
//         setTotalDocs(response.data.totalDocs || 0);
//       } else {
//         setSkuFamilyData([]);
//         setTotalDocs(0);
//       }
//     } catch (err: any) {
//       console.error("Error fetching SKU families:", err);
//       toastHelper.showTost("Failed to fetch SKU families", "error");
//       setSkuFamilyData([]);
//       setTotalDocs(0);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSave = async (formData: FormData) => {
//     try {
//       if (editId) {
//         await SkuFamilyService.updateSkuFamily(editId, formData);
//       } else {
//         await SkuFamilyService.createSkuFamily(formData);
//       }
//       fetchData();
//       setIsModalOpen(false);
//       setEditId(null);
//     } catch (err: any) {
//       console.error("Error saving SKU family:", err);
//       toastHelper.showTost("Failed to save SKU family", "error");
//     }
//   };

//   const handleEdit = (id: string) => {
//     console.log("HandleEdit called with ID:", id);
//     const selectedItem = skuFamilyData.find((item) => item._id === id);
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
//       text: "This will delete the SKU Family!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, delete it!",
//       cancelButtonText: "No, cancel!",
//     });

//     if (confirmed.isConfirmed) {
//       try {
//         await SkuFamilyService.deleteSkuFamily(id);
//         fetchData();
//       } catch (err: any) {
//         console.error("Error deleting SKU family:", err);
//         toastHelper.showTost("Failed to delete SKU family", "error");
//       }
//     }
//   };

//   const totalPages = Math.ceil(totalDocs / itemsPerPage);

//   return (
//     <div className="p-6">
//       <link
//         rel="stylesheet"
//         href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
//       />

//       <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
//         <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
//           <div className="flex items-center gap-3 flex-1">
//             <div className="relative flex-1 max-w-md">
//               <i className="fas fa-search absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
//               <input
//                 type="text"
//                 placeholder="Search by name or code..."
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
//             className="inline-flex items-center gap-2 rounded-lg bg-[#0071E0] hover:bg-[#0061c0] text-white px-5 py-2.5 text-sm font-semibold transition-colors"
//             onClick={() => {
//               setEditId(null);
//               setIsModalOpen(true);
//             }}
//           >
//             <i className="fas fa-plus text-sm"></i>
//             Add SKU Family
//           </button>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full table-auto">
//             <thead className="bg-gray-50 dark:bg-gray-900">
//               <tr>
//                 <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle whitespace-nowrap">
//                   Image
//                 </th>
//                 <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle whitespace-nowrap">
//                   Name
//                 </th>
//                 <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle whitespace-nowrap">
//                   Code
//                 </th>
//                 <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle whitespace-nowrap">
//                   Brand
//                 </th>
//                 <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle whitespace-nowrap">
//                   Description
//                 </th>
//                 <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle whitespace-nowrap">
//                   Color
//                 </th>
//                 <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle whitespace-nowrap">
//                   Country
//                 </th>
//                 <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle whitespace-nowrap">
//                   SIM
//                 </th>
//                 <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle whitespace-nowrap">
//                   Network
//                 </th>
//                 <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle whitespace-nowrap">
//                   Actions
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
//                       <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-3">
//                         Loading SKU Families...
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : !skuFamilyData || skuFamilyData.length === 0 ? (
//                 <tr>
//                   <td colSpan={10} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
//                         <i className="fas fa-box-open text-2xl text-gray-400"></i>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
//                         No products found
//                       </p>
//                       <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
//                         Try adjusting your search criteria
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 skuFamilyData.map((item: SkuFamily, index: number) => (
//                   <tr
//                     key={item._id || index}
//                     className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
//                   >
//                     <td className="px-4 py-4">
//                       <img
//                         src={(function () {
//                           const base =
//                             (import.meta as any).env?.VITE_BASE_URL || "";
//                           const first =
//                             Array.isArray(item.images) && item.images.length > 0
//                               ? item.images[0]
//                               : "";
//                           if (!first) return placeholderImage;
//                           const isAbsolute = /^https?:\/\//i.test(first);
//                           return isAbsolute
//                             ? first
//                             : `${base}${
//                                 first.startsWith("/") ? "" : "/"
//                               }${first}`;
//                         })()}
//                         alt={item.name || "Product"}
//                         className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
//                         onError={(e) => {
//                           (e.currentTarget as HTMLImageElement).src =
//                             placeholderImage;
//                         }}
//                       />
//                     </td>
//                     <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
//                       {item.name || "N/A"}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       {item.code || "N/A"}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       {item.brand || "N/A"}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
//                       {item.description || "N/A"}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       {item.colorVariant || "N/A"}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       {item.country || "N/A"}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       {item.simType || "N/A"}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       {item.networkBands || "N/A"}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-center">
//                       <div className="flex items-center justify-center gap-2">
//                         <button
//                           onClick={() => item._id && handleEdit(item._id)}
//                           disabled={!item._id}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-[#0071E0] dark:text-blue-400 transition-colors disabled:opacity-50"
//                           title="Edit SKU Family"
//                         >
//                           <i className="fas fa-pen text-xs"></i>
//                         </button>
//                         <button
//                           onClick={() => item._id && handleDelete(item._id)}
//                           disabled={!item._id}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
//                           title="Delete SKU Family"
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
//             <span>
//               Showing{" "}
//               <span className="text-gray-800 dark:text-gray-200 font-semibold">
//                 {skuFamilyData.length}
//               </span>{" "}
//               of{" "}
//               <span className="text-gray-800 dark:text-gray-200 font-semibold">
//                 {totalDocs}
//               </span>{" "}
//               items
//             </span>
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
//               onClick={() =>
//                 setCurrentPage((prev) => Math.min(prev + 1, totalPages))
//               }
//               disabled={currentPage === totalPages}
//               className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
//             >
//               Next
//               <i className="fas fa-chevron-right text-xs"></i>
//             </button>
//           </div>
//         </div>
//       </div>

//       <SkuFamilyModal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setEditId(null);
//         }}
//         onSave={handleSave}
//         editItem={
//           editId ? skuFamilyData.find((item) => item._id === editId) : undefined
//         }
//       />
//     </div>
//   );
// };

// export default SkuFamilyTable;


import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { SkuFamilyService } from "../../services/skuFamily/skuFamily.services";
import toastHelper from "../../utils/toastHelper";
import SkuFamilyModal from "./SkuFamilModal";
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
  const [loading, setLoading] = useState<boolean>(false);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const itemsPerPage = 10;

  useEffect(() => {
    let debounceTimer: number;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await SkuFamilyService.getSkuFamilyList(
          currentPage,
          itemsPerPage,
          searchTerm.trim()
        );
        if (response.data?.docs) {
          console.log("Fetched SKU Family data:", response.data.docs);
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

    debounceTimer = setTimeout(() => {
      fetchData();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchTerm]);

  const handleSave = async (formData: FormData) => {
    try {
      if (editId) {
        await SkuFamilyService.updateSkuFamily(editId, formData);
      } else {
        await SkuFamilyService.createSkuFamily(formData);
      }
      setCurrentPage(1); // Reset to first page after save
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
          <p class="mb-3">This will permanently delete the SKU Family!</p>
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
        await SkuFamilyService.deleteSkuFamily(id);
        setCurrentPage(1); // Reset to first page after delete
      } catch (err: any) {
        console.error("Error deleting SKU family:", err);
        toastHelper.showTost("Failed to delete SKU family", "error");
      }
    }
  };

  const totalPages = Math.ceil(totalDocs / itemsPerPage);

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
                  placeholder="Search by name or code..."
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
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#0071E0] hover:bg-[#0061c0] text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
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

        {/* Table */}
        <div className="overflow-hidden rounded-2xl">
          <table className="w-full table-fixed border-collapse">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                {[
                  { header: "Image", width: "w-16" },
                  { header: "Name", width: "w-28" },
                  { header: "Code", width: "w-24" },
                  { header: "Brand", width: "w-24" },
                  { header: "Description", width: "w-36" },
                  { header: "Color", width: "w-20" },
                  { header: "Country", width: "w-20" },
                  { header: "SIM", width: "w-20" },
                  { header: "Network", width: "w-24" },
                  { header: "Actions", width: "w-28" },
                ].map(({ header, width }) => (
                  <th
                    key={header}
                    className={`px-4 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${width} ${
                      header === "Actions" ? "text-center" : "text-left"
                    } truncate ${header === "Image" ? "rounded-tl-2xl" : ""} ${
                      header === "Actions" ? "rounded-tr-2xl" : ""
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
                        Loading SKU Families...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : !skuFamilyData || skuFamilyData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="w-14 h-14 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-box-open text-xl text-gray-400"></i>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                        No products found
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                skuFamilyData.map((item: SkuFamily, index: number) => (
                  <tr
                    key={item._id || index}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-200"
                  >
                    <td className="px-4 py-4 w-16">
                      <img
                        src={(function () {
                          const base = (import.meta as any).env?.VITE_BASE_URL || "";
                          const first =
                            Array.isArray(item.images) && item.images.length > 0
                              ? item.images[0]
                              : "";
                          if (!first) return placeholderImage;
                          const isAbsolute = /^https?:\/\//i.test(first);
                          return isAbsolute
                            ? first
                            : `${base}${first.startsWith("/") ? "" : "/"}${first}`;
                        })()}
                        alt={item.name || "Product"}
                        className="w-10 h-10 object-cover rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = placeholderImage;
                        }}
                      />
                    </td>
                    <td className="px-4 py-4 w-28 truncate">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-24 truncate">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.code || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-24 truncate">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.brand || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-36 truncate">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.description || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-20 truncate">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.colorVariant || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-20 truncate">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.country || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-20 truncate">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.simType || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-24 truncate">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.networkBands || "N/A"}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-4 w-28 ${
                        index === skuFamilyData.length - 1 ? "rounded-br-2xl" : ""
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2.5">
                        <button
                          onClick={() => item._id && handleEdit(item._id)}
                          disabled={!item._id}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0071E0]/10 hover:bg-[#0071E0]/20 dark:bg-[#0071E0]/20 dark:hover:bg-[#0071E0]/30 text-[#0071E0] dark:text-[#0071E0] transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit SKU Family"
                        >
                          <i className="fas fa-pen text-sm"></i>
                        </button>
                        <button
                          onClick={() => item._id && handleDelete(item._id)}
                          disabled={!item._id}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100/50 hover:bg-red-200/50 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete SKU Family"
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
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-t border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-2xl">
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
    </div>
  );
};

export default SkuFamilyTable;
// import React, { useState, useEffect, useCallback } from "react";
// import Swal from "sweetalert2";
// import { BusinessRequestsService } from "../../services/businessRequests/businessRequests.services";

// interface BusinessRequest {
//   _id?: string;
//   logo?: string;
//   certificate?: string;
//   businessName: string;
//   country: string;
//   address?: string;
//   status: "Approved" | "Pending" | "Rejected";
//   name?: string;
//   email?: string;
//   mobileNumber?: string;
//   whatsappNumber?: string;
// }

// const BusinessRequestsTable: React.FC = () => {
//   const [businessRequests, setBusinessRequests] = useState<BusinessRequest[]>(
//     []
//   );
//   const [filteredRequests, setFilteredRequests] = useState<BusinessRequest[]>(
//     []
//   );
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [statusFilter, setStatusFilter] = useState<string>("Pending");
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [totalDocs, setTotalDocs] = useState<number>(0);
//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [selectedProduct, setSelectedProduct] =
//     useState<BusinessRequest | null>(null);
//   const [dropdownPosition, setDropdownPosition] = useState<{
//     top: number;
//     left: number;
//   } | null>(null);
//   const [statusOverrides, setStatusOverrides] = useState<
//     Record<string, "Approved" | "Pending" | "Rejected">
//   >({});

//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem("br_status_overrides");
//       if (raw) {
//         const parsed = JSON.parse(raw);
//         if (parsed && typeof parsed === "object") {
//           setStatusOverrides(parsed);
//         }
//       }
//     } catch {}
//   }, []);

//   useEffect(() => {
//     try {
//       localStorage.setItem(
//         "br_status_overrides",
//         JSON.stringify(statusOverrides)
//       );
//     } catch {}
//   }, [statusOverrides]);

//   const itemsPerPage = 10;

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (!event.target) return;
//       if (!(event.target as HTMLElement).closest(".dropdown-container")) {
//         setOpenDropdownId(null);
//         setDropdownPosition(null);
//       }
//     };

//     const handleResize = () => {
//       if (openDropdownId) {
//         setOpenDropdownId(null);
//         setDropdownPosition(null);
//       }
//     };

//     document.addEventListener("click", handleClickOutside);
//     window.addEventListener("resize", handleResize);
//     return () => {
//       document.removeEventListener("click", handleClickOutside);
//       window.removeEventListener("resize", handleResize);
//     };
//   }, [openDropdownId]);

//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { docs, totalDocs } =
//         await BusinessRequestsService.getBusinessRequests(1, 1000, undefined);

//       const baseUrl = import.meta.env.VITE_BASE_URL as string | undefined;
//       const makeAbsoluteUrl = (path?: string | null): string | undefined => {
//         if (!path) return undefined;
//         if (path.startsWith("http://") || path.startsWith("https://"))
//           return path;
//         if (!baseUrl) return undefined;
//         const trimmed = path.startsWith("/") ? path : `/${path}`;
//         return `${baseUrl}${trimmed}`;
//       };

//       const mapped: BusinessRequest[] = (docs || []).map((d: any) => {
//         const bp = d?.businessProfile || {};
//         const statusStr: string | undefined = (bp?.status || "")
//           .toString()
//           .toLowerCase();
//         let status: "Approved" | "Pending" | "Rejected" = "Pending";
//         if (statusStr === "approved") status = "Approved";
//         else if (statusStr === "rejected") status = "Rejected";
//         else status = "Pending";

//         return {
//           _id: d?._id ?? d?.id,
//           logo: makeAbsoluteUrl(bp?.logo),
//           certificate: makeAbsoluteUrl(bp?.certificate),
//           businessName: bp?.businessName ?? "-",
//           country: bp?.country ?? "-",
//           address: bp?.address ?? undefined,
//           status,
//           name: d?.name ?? "-",
//           email: d?.email ?? "-",
//           mobileNumber: d?.mobileNumber ?? "-",
//           whatsappNumber: d?.whatsappNumber ?? "-",
//         } as BusinessRequest;
//       });

//       const withOverrides = mapped.map((item) => {
//         if (item._id && statusOverrides[item._id]) {
//           return { ...item, status: statusOverrides[item._id] };
//         }
//         return item;
//       });

//       try {
//         const nextOverrides = { ...statusOverrides };
//         for (const item of mapped) {
//           if (
//             item._id &&
//             nextOverrides[item._id] === "Approved" &&
//             item.status === "Approved"
//           ) {
//             delete nextOverrides[item._id];
//           }
//         }
//         if (JSON.stringify(nextOverrides) !== JSON.stringify(statusOverrides)) {
//           setStatusOverrides(nextOverrides);
//         }
//       } catch {}

//       setBusinessRequests(withOverrides);
//       setTotalDocs(Number(totalDocs) || 0);
//     } catch (err) {
//       console.error("Error fetching business requests:", err);
//       setBusinessRequests([]);
//       setTotalDocs(0);
//     } finally {
//       setLoading(false);
//     }
//   }, [statusOverrides]);

//   useEffect(() => {
//     let filtered = businessRequests;

//     if (searchTerm.trim()) {
//       filtered = filtered.filter((item) =>
//         item.businessName.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     if (statusFilter !== "All") {
//       filtered = filtered.filter((item) => item.status === statusFilter);
//     }

//     setFilteredRequests(filtered);
//     setCurrentPage(1);
//   }, [businessRequests, searchTerm, statusFilter]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const handleStatusChange = async (
//     id: string,
//     newStatus: "Approved" | "Pending" | "Rejected"
//   ) => {
//     const confirmed = await Swal.fire({
//       title: "Are you sure?",
//       text: `Change status to ${newStatus}?`,
//       icon: "question",
//       showCancelButton: true,
//       confirmButtonText: "Yes, change it!",
//       cancelButtonText: "No, cancel!",
//     });

//     if (confirmed.isConfirmed) {
//       setStatusOverrides((prev) => ({ ...prev, [id]: newStatus }));
//       setBusinessRequests((prev: BusinessRequest[]) =>
//         prev.map((item: BusinessRequest) =>
//           item._id === id ? { ...item, status: newStatus } : item
//         )
//       );

//       try {
//         const payloadStatus: "approved" | "pending" | "rejected" =
//           newStatus === "Approved"
//             ? "approved"
//             : newStatus === "Rejected"
//             ? "rejected"
//             : "pending";
//         await BusinessRequestsService.updateCustomerStatus(id, payloadStatus);
//         await fetchData();
//       } catch (err) {
//         console.error("Error updating status:", err);
//         await fetchData();
//       } finally {
//         setOpenDropdownId(null);
//         setDropdownPosition(null);
//       }
//     }
//   };

//   const handleView = (item: BusinessRequest) => {
//     setSelectedProduct(item);
//     setOpenDropdownId(null);
//     setDropdownPosition(null);
//   };

//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;
//   const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
//   const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

//   const getStatusStyles = (status: "Approved" | "Pending" | "Rejected") => {
//     switch (status) {
//       case "Approved":
//         return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700";
//       case "Pending":
//         return "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700";
//       case "Rejected":
//         return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700";
//       default:
//         return "";
//     }
//   };

//   const getStatusIcon = (status: "Approved" | "Pending" | "Rejected") => {
//     switch (status) {
//       case "Approved":
//         return "fa-check-circle";
//       case "Pending":
//         return "fa-clock";
//       case "Rejected":
//         return "fa-times-circle";
//       default:
//         return "";
//     }
//   };

//   const placeholderImage =
//     "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmyTPv4M5fFPvYLrMzMQcPD_VO34ByNjouQ&s";

//   return (
//     <div className="p-6">
//       <link
//         rel="stylesheet"
//         href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
//       />



//       <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
//         <div className="flex flex-col gap-4 p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
//           <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
//             <div className="relative flex-1 max-w-md">
//               <i className="fas fa-search absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
//               <input
//                 type="text"
//                 placeholder="Search by business name..."
//                 className="pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] text-sm w-full transition-all"
//                 value={searchTerm}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   setSearchTerm(e.target.value)
//                 }
//               />
//             </div>
//             <div className="relative">
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="pl-3 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] text-sm min-w-[140px] appearance-none cursor-pointer transition-all"
//               >
//                 <option value="All">All Status</option>
//                 <option value="Approved">Approved</option>
//                 <option value="Pending">Pending</option>
//                 <option value="Rejected">Rejected</option>
//               </select>
//               <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
//             </div>
//           </div>
//         </div>

//         <div className="max-w-full overflow-x-auto">
//           <table className="w-full table-auto">
//             <thead className="bg-gray-50 dark:bg-gray-900">
//               <tr>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Logo
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Certificate
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Business Name
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Country
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Address
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Status
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
//                   <td colSpan={7} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="relative">
//                         <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200 dark:border-gray-700"></div>
//                         <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#0071E0] border-t-transparent absolute top-0 left-0"></div>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-3">
//                         Loading Business Requests...
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : !paginatedRequests || paginatedRequests.length === 0 ? (
//                 <tr>
//                   <td colSpan={7} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
//                         <i className="fas fa-briefcase text-2xl text-gray-400"></i>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
//                         No business requests found
//                       </p>
//                       <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
//                         Try adjusting your search or filters
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 paginatedRequests.map(
//                   (item: BusinessRequest, index: number) => (
//                     <tr
//                       key={item._id || index}
//                       className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
//                     >
//                       <td className="px-6 py-4">
//                         <img
//                           src={item.logo || placeholderImage}
//                           alt="Logo"
//                           className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:scale-105 transition-transform"
//                           onClick={() =>
//                             setSelectedImage(item.logo || placeholderImage)
//                           }
//                           onError={(e) => {
//                             (e.currentTarget as HTMLImageElement).src =
//                               placeholderImage;
//                           }}
//                         />
//                       </td>
//                       <td className="px-6 py-4">
//                         <img
//                           src={item.certificate || placeholderImage}
//                           alt="Certificate"
//                           className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:scale-105 transition-transform"
//                           onClick={() =>
//                             setSelectedImage(
//                               item.certificate || placeholderImage
//                             )
//                           }
//                           onError={(e) => {
//                             (e.currentTarget as HTMLImageElement).src =
//                               placeholderImage;
//                           }}
//                         />
//                       </td>
//                       <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
//                         {item.businessName || "-"}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                         {item.country || "-"}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
//                         {item.address || "-"}
//                       </td>
//                       <td className="px-6 py-4">
//                         <span
//                           className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusStyles(
//                             item.status
//                           )}`}
//                         >
//                           <i
//                             className={`fas ${getStatusIcon(
//                               item.status
//                             )} text-xs`}
//                           ></i>
//                           {item.status}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-sm text-center flex justify-center relative">
//                         <div className="dropdown-container relative">
//                           <button
//                             className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               if (openDropdownId === item._id) {
//                                 setOpenDropdownId(null);
//                                 setDropdownPosition(null);
//                               } else {
//                                 const rect =
//                                   e.currentTarget.getBoundingClientRect();
//                                 const dropdownWidth = 192;
//                                 const dropdownHeight = 180;
//                                 let top = rect.bottom + 8;
//                                 let left = rect.right - dropdownWidth;
//                                 if (top + dropdownHeight > window.innerHeight) {
//                                   top = rect.top - dropdownHeight - 8;
//                                 }
//                                 if (left < 8) {
//                                   left = 8;
//                                 }
//                                 if (
//                                   left + dropdownWidth >
//                                   window.innerWidth - 8
//                                 ) {
//                                   left = window.innerWidth - dropdownWidth - 8;
//                                 }
//                                 setDropdownPosition({ top, left });
//                                 setOpenDropdownId(item._id || null);
//                               }
//                             }}
//                           >
//                             <i className="fas fa-ellipsis-v"></i>
//                           </button>
//                           {openDropdownId === item._id && dropdownPosition && (
//                             <div
//                               className="fixed w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
//                               style={{
//                                 top: `${dropdownPosition.top}px`,
//                                 left: `${dropdownPosition.left}px`,
//                                 zIndex: 9999,
//                               }}
//                             >
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   handleView(item);
//                                 }}
//                                 className="flex items-center w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-[#0071E0] dark:text-blue-400 transition-colors"
//                               >
//                                 <i className="fas fa-eye mr-3 text-sm"></i>
//                                 View Details
//                               </button>
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   if (item._id)
//                                     handleStatusChange(item._id, "Approved");
//                                 }}
//                                 className="flex items-center w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-emerald-600 dark:text-emerald-400 transition-colors"
//                               >
//                                 <i className="fas fa-check mr-3 text-sm"></i>
//                                 Approve
//                               </button>
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   if (item._id)
//                                     handleStatusChange(item._id, "Pending");
//                                 }}
//                                 className="flex items-center w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-yellow-600 dark:text-yellow-400 transition-colors"
//                               >
//                                 <i className="fas fa-clock mr-3 text-sm"></i>
//                                 Set Pending
//                               </button>
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   if (item._id)
//                                     handleStatusChange(item._id, "Rejected");
//                                 }}
//                                 className="flex items-center w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 transition-colors"
//                               >
//                                 <i className="fas fa-times mr-3 text-sm"></i>
//                                 Reject
//                               </button>
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   )
//                 )
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
//                 {paginatedRequests.length}
//               </span>{" "}
//               of{" "}
//               <span className="text-gray-800 dark:text-gray-200 font-semibold">
//                 {filteredRequests.length}
//               </span>{" "}
//               items
//               {filteredRequests.length !== totalDocs && (
//                 <span className="text-gray-500">
//                   {" "}
//                   (filtered from {totalDocs} total)
//                 </span>
//               )}
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
//               {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
//                 let pageNum;
//                 if (totalPages <= 10) {
//                   pageNum = i + 1;
//                 } else {
//                   const start = Math.max(1, currentPage - 5);
//                   pageNum = start + i;
//                   if (pageNum > totalPages) return null;
//                 }
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

//       {selectedProduct && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full mx-4">
//             <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
//               <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
//                 Business Details
//               </h2>
//               <button
//                 onClick={() => setSelectedProduct(null)}
//                 className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
//                 title="Close"
//               >
//                 <i className="fas fa-times text-lg"></i>
//               </button>
//             </div>
//             <div className="p-6">
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Name
//                   </label>
//                   <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
//                     {selectedProduct.name || "-"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Email
//                   </label>
//                   <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
//                     {selectedProduct.email || "-"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Phone Number
//                   </label>
//                   <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
//                     {selectedProduct.mobileNumber || "-"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     WhatsApp Number
//                   </label>
//                   <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
//                     {selectedProduct.whatsappNumber || "-"}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {selectedImage && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
//           onClick={() => setSelectedImage(null)}
//         >
//           <div className="relative">
//             <img
//               src={selectedImage}
//               alt="Enlarged view"
//               className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
//             />
//             <button
//               className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white bg-gray-800/70 hover:bg-gray-800 rounded-full transition-colors"
//               onClick={() => setSelectedImage(null)}
//             >
//               <i className="fas fa-times"></i>
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default BusinessRequestsTable;


import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { BusinessRequestsService } from "../../services/businessRequests/businessRequests.services";

interface BusinessRequest {
  _id?: string;
  logo?: string;
  certificate?: string;
  businessName: string;
  country: string;
  address?: string;
  status: "Approved" | "Pending" | "Rejected";
  name?: string;
  email?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
}

const BusinessRequestsTable: React.FC = () => {
  const [businessRequests, setBusinessRequests] = useState<BusinessRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BusinessRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<BusinessRequest | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, "Approved" | "Pending" | "Rejected">>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("br_status_overrides");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setStatusOverrides(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("br_status_overrides", JSON.stringify(statusOverrides));
    } catch {}
  }, [statusOverrides]);

  const itemsPerPage = 10;

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { docs, totalDocs } = await BusinessRequestsService.getBusinessRequests(1, 1000, undefined);

      const baseUrl = import.meta.env.VITE_BASE_URL as string | undefined;
      const makeAbsoluteUrl = (path?: string | null): string | undefined => {
        if (!path) return undefined;
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        if (!baseUrl) return undefined;
        const trimmed = path.startsWith("/") ? path : `/${path}`;
        return `${baseUrl}${trimmed}`;
      };

      const mapped: BusinessRequest[] = (docs || []).map((d: any) => {
        const bp = d?.businessProfile || {};
        const statusStr: string | undefined = (bp?.status || "").toString().toLowerCase();
        let status: "Approved" | "Pending" | "Rejected" = "Pending";
        if (statusStr === "approved") status = "Approved";
        else if (statusStr === "rejected") status = "Rejected";
        else status = "Pending";

        return {
          _id: d?._id ?? d?.id,
          logo: makeAbsoluteUrl(bp?.logo),
          certificate: makeAbsoluteUrl(bp?.certificate),
          businessName: bp?.businessName ?? "-",
          country: bp?.country ?? "-",
          address: bp?.address ?? undefined,
          status,
          name: d?.name ?? "-",
          email: d?.email ?? "-",
          mobileNumber: d?.mobileNumber ?? "-",
          whatsappNumber: d?.whatsappNumber ?? "-",
        } as BusinessRequest;
      });

      const withOverrides = mapped.map((item) => {
        if (item._id && statusOverrides[item._id]) {
          return { ...item, status: statusOverrides[item._id] };
        }
        return item;
      });

      try {
        const nextOverrides = { ...statusOverrides };
        for (const item of mapped) {
          if (item._id && nextOverrides[item._id] === "Approved" && item.status === "Approved") {
            delete nextOverrides[item._id];
          }
        }
        if (JSON.stringify(nextOverrides) !== JSON.stringify(statusOverrides)) {
          setStatusOverrides(nextOverrides);
        }
      } catch {}

      setBusinessRequests(withOverrides);
      setTotalDocs(Number(totalDocs) || 0);
    } catch (err) {
      console.error("Error fetching business requests:", err);
      setBusinessRequests([]);
      setTotalDocs(0);
    } finally {
      setLoading(false);
    }
  }, [statusOverrides]);

  useEffect(() => {
    let filtered = businessRequests;

    if (searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        item.businessName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [businessRequests, searchTerm, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (id: string, newStatus: "Approved" | "Pending" | "Rejected") => {
    const confirmed = await Swal.fire({
      title: "Are you sure?",
      html: `
        <div class="text-center">
          <p class="mb-3">Change status to <strong>${newStatus}</strong>?</p>
          <p class="text-sm text-gray-600">This action will update the business request status.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, change it!",
      cancelButtonText: "No, cancel!",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      focusCancel: true,
    });

    if (confirmed.isConfirmed) {
      setStatusOverrides((prev) => ({ ...prev, [id]: newStatus }));
      setBusinessRequests((prev: BusinessRequest[]) =>
        prev.map((item: BusinessRequest) =>
          item._id === id ? { ...item, status: newStatus } : item
        )
      );

      try {
        const payloadStatus: "approved" | "pending" | "rejected" =
          newStatus === "Approved" ? "approved" : newStatus === "Rejected" ? "rejected" : "pending";
        await BusinessRequestsService.updateCustomerStatus(id, payloadStatus);
        await fetchData();
      } catch (err) {
        console.error("Error updating status:", err);
        await fetchData();
      } finally {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    }
  };

  const handleView = (item: BusinessRequest) => {
    setSelectedProduct(item);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const getStatusStyles = (status: "Approved" | "Pending" | "Rejected") => {
    switch (status) {
      case "Approved":
        return "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200/50 dark:border-green-800/50";
      case "Pending":
        return "bg-yellow-100/50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 border border-yellow-200/50 dark:border-yellow-800/50";
      case "Rejected":
        return "bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200/50 dark:border-red-800/50";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: "Approved" | "Pending" | "Rejected") => {
    switch (status) {
      case "Approved":
        return "fa-circle-check";
      case "Pending":
        return "fa-clock";
      case "Rejected":
        return "fa-circle-xmark";
      default:
        return "";
    }
  };

  const placeholderImage =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmyTPv4M5fFPvYLrMzMQcPD_VO34ByNjouQ&s";

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
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <div className="relative flex-1 max-w-sm">
                <i className="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  type="text"
                  placeholder="Search by business name..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] transition-all duration-300 text-sm placeholder-gray-400 shadow-sm"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-3 pr-10 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] text-sm min-w-[140px] appearance-none cursor-pointer transition-all shadow-sm"
                >
                  <option value="All">All Status</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                {["Logo", "Certificate", "Business Name", "Country", "Address", "Status", "Actions"].map((header) => (
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
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 dark:border-gray-700"></div>
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0071E0] border-t-transparent absolute top-0 left-0"></div>
                      </div>
                      <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Loading Business Requests...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : !paginatedRequests || paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="w-14 h-14 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-briefcase text-xl text-gray-400"></i>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                        No business requests found
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((item: BusinessRequest, index: number) => (
                  <tr
                    key={item._id || index}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <img
                        src={item.logo || placeholderImage}
                        alt="Logo"
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200/50 dark:border-gray-700/50 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                        onClick={() => setSelectedImage(item.logo || placeholderImage)}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = placeholderImage;
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={item.certificate || placeholderImage}
                        alt="Certificate"
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200/50 dark:border-gray-700/50 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                        onClick={() => setSelectedImage(item.certificate || placeholderImage)}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = placeholderImage;
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.businessName || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.country || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {item.address || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${getStatusStyles(
                          item.status
                        )}`}
                      >
                        <i className={`fas ${getStatusIcon(item.status)} text-xs`}></i>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="dropdown-container relative flex items-center justify-center gap-2.5">
                        <button
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0071E0]/10 hover:bg-[#0071E0]/20 dark:bg-[#0071E0]/20 dark:hover:bg-[#0071E0]/30 text-[#0071E0] dark:text-[#0071E0] transition-all duration-200 shadow-sm hover:shadow"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openDropdownId === item._id) {
                              setOpenDropdownId(null);
                              setDropdownPosition(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const dropdownWidth = 192;
                              const dropdownHeight = 180;
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
                          <i className="fas fa-ellipsis-v text-sm"></i>
                        </button>
                        {openDropdownId === item._id && dropdownPosition && (
                          <div
                            className="fixed w-48 bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-lg overflow-hidden"
                            style={{
                              top: `${dropdownPosition.top}px`,
                              left: `${dropdownPosition.left}px`,
                              zIndex: 9999,
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(item);
                              }}
                              className="flex items-center w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-[#0071E0] dark:text-blue-400 transition-all duration-200"
                            >
                              <i className="fas fa-eye mr-3 text-sm"></i>
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item._id) handleStatusChange(item._id, "Approved");
                              }}
                              className="flex items-center w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-green-600 dark:text-green-400 transition-all duration-200"
                            >
                              <i className="fas fa-check mr-3 text-sm"></i>
                              Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item._id) handleStatusChange(item._id, "Pending");
                              }}
                              className="flex items-center w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-yellow-600 dark:text-yellow-400 transition-all duration-200"
                            >
                              <i className="fas fa-clock mr-3 text-sm"></i>
                              Set Pending
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item._id) handleStatusChange(item._id, "Rejected");
                              }}
                              className="flex items-center w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 transition-all duration-200"
                            >
                              <i className="fas fa-times mr-3 text-sm"></i>
                              Reject
                            </button>
                          </div>
                        )}
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
                  {paginatedRequests.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {filteredRequests.length}
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
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 10) {
                    pageNum = i + 1;
                  } else {
                    const start = Math.max(1, currentPage - 5);
                    pageNum = start + i;
                    if (pageNum > totalPages) return null;
                  }
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

      {/* Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-800/50">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Business Details
              </h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
                title="Close"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 bg-gray-50 dark:bg-gray-900">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Name
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    {selectedProduct.name || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Email
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    {selectedProduct.email || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Phone Number
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    {selectedProduct.mobileNumber || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    WhatsApp Number
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    {selectedProduct.whatsappNumber || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative">
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white bg-gray-800/70 hover:bg-gray-800 rounded-full transition-all duration-200 shadow-sm"
              onClick={() => setSelectedImage(null)}
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessRequestsTable;
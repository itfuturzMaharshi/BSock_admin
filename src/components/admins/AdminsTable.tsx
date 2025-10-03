// import React, { useState, useEffect } from "react";
// import Swal from "sweetalert2";
// import toastHelper from "../../utils/toastHelper";
// import AdminsModal from "./AdminsModal";
// import {
//   AdminService,
//   Admin,
//   UpdateAdminRequest,
// } from "../../services/admin/admin.services";

// const AdminsTable: React.FC = () => {
//   const [adminsData, setAdminsData] = useState<Admin[]>([]);
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
//   const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [totalPages, setTotalPages] = useState<number>(1);
//   const [totalDocs, setTotalDocs] = useState<number>(0);
//   const [resettingPassword, setResettingPassword] = useState<string | null>(
//     null
//   );
//   const itemsPerPage = 10;

//   // Fetch admins data
//   const fetchAdmins = async () => {
//     setLoading(true);
//     try {
//       const response = await AdminService.listAdmins({
//         page: currentPage,
//         limit: itemsPerPage,
//         search: searchTerm,
//       });

//       if (response.status === 200 && response.data) {
//         // Filter out admins that have already logged in
//         const currentUserId = localStorage.getItem("userId");
//         const filteredAdmins = response.data.docs.filter(
//           (admin) => admin._id !== currentUserId
//         );

//         setAdminsData(filteredAdmins);
//         setTotalPages(response.data.totalPages);
//         setTotalDocs(filteredAdmins.length);
//       }
//     } catch (error) {
//       console.error("Error fetching admins:", error);
//       toastHelper.error("Failed to fetch admins");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAdmins();
//   }, [currentPage, searchTerm]);

//   // Debounce search
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       if (currentPage !== 1) {
//         setCurrentPage(1);
//       } else {
//         fetchAdmins();
//       }
//     }, 500);

//     return () => clearTimeout(timeoutId);
//   }, [searchTerm]);

//   const handleSave = () => {
//     fetchAdmins();
//     setIsModalOpen(false);
//     setEditingAdmin(null);
//   };

//   const handleEdit = (admin: Admin) => {
//     setEditingAdmin(admin);
//     setIsModalOpen(true);
//   };

//   const handleResetPassword = async (admin: Admin) => {
//     const confirmed = await Swal.fire({
//       title: "Reset Password?",
//       html: `
//         <div class="text-center">
//           <p class="mb-3">Are you sure you want to reset the password for <strong>${admin.name}</strong>?</p>
//           <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
//             <p class="text-sm text-yellow-800">
//               <i class="fas fa-exclamation-triangle mr-2"></i>
//               <strong>Warning:</strong> The new password will be set to <code class="bg-yellow-100 px-1 rounded">user@1234</code>
//             </p>
//           </div>
//           <p class="text-sm text-gray-600">The admin will need to change this password on their next login.</p>
//         </div>
//       `,
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, reset password!",
//       cancelButtonText: "No, cancel!",
//       confirmButtonColor: "#dc2626",
//       cancelButtonColor: "#6b7280",
//       focusCancel: true,
//     });

//     if (confirmed.isConfirmed) {
//       setResettingPassword(admin._id);
//       try {
//         const updateData: UpdateAdminRequest = {
//           id: admin._id,
//           name: admin.name,
//           email: admin.email,
//           isActive: admin.isActive,
//           password: "user@1234",
//         };

//         await AdminService.updateAdmin(updateData);

//         Swal.fire({
//           title: "Password Reset!",
//           text: `Password has been reset to "user@1234" for ${admin.name}`,
//           icon: "success",
//           confirmButtonColor: "#10b981",
//         });

//         fetchAdmins();
//       } catch (error) {
//         console.error("Error resetting password:", error);
//         Swal.fire({
//           title: "Error!",
//           text: "Failed to reset password. Please try again.",
//           icon: "error",
//           confirmButtonColor: "#dc2626",
//         });
//       } finally {
//         setResettingPassword(null);
//       }
//     }
//   };

//   const handleDelete = async (admin: Admin) => {
//     const confirmed = await Swal.fire({
//       title: "Are you sure?",
//       text: "This will permanently delete the admin! This action cannot be undone.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, delete permanently!",
//       cancelButtonText: "No, cancel!",
//       confirmButtonColor: "#dc2626",
//     });

//     if (confirmed.isConfirmed) {
//       try {
//         await AdminService.deleteAdmin({ id: admin._id });
//         fetchAdmins();
//       } catch (error) {
//         console.error("Error deleting admin:", error);
//       }
//     }
//   };

//   const getStatusStyles = (isActive: boolean) => {
//     return isActive
//       ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700"
//       : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700";
//   };

//   const getStatusIcon = (isActive: boolean) => {
//     return isActive ? "fa-check-circle" : "fa-times-circle";
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
//                 placeholder="Search by name or email..."
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
//               setIsModalOpen(true);
//             }}
//           >
//             <i className="fas fa-plus text-sm"></i>
//             Add New Admin
//           </button>
//         </div>

//         {/* Table */}
//         <div className="max-w-full overflow-x-auto">
//           <table className="w-full table-auto">
//             <thead className="bg-gray-50 dark:bg-gray-900">
//               <tr>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Name
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Email
//                   </div>
//                 </th>
//                 <th className="px-6 py-3.5 text-left flex justify-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 align-middle">
//                   <div className="flex items-center gap-2">
//                     Status
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
//                   <td colSpan={5} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="relative">
//                         <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200 dark:border-gray-700"></div>
//                         <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#0071E0] border-t-transparent absolute top-0 left-0"></div>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-3">
//                         Loading Admins...
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : adminsData.length === 0 ? (
//                 <tr>
//                   <td colSpan={5} className="p-12 text-center">
//                     <div className="flex flex-col items-center justify-center">
//                       <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
//                         <i className="fas fa-users-slash text-2xl text-gray-400"></i>
//                       </div>
//                       <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
//                         No admins found
//                       </p>
//                       <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
//                         Try adjusting your search criteria
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 adminsData.map((item: Admin) => (
//                   <tr
//                     key={item._id}
//                     className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
//                   >
//                     <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
//                       <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 bg-[#0071E0] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
//                           {item.name.charAt(0).toUpperCase()}
//                         </div>
//                         <span>{item.name}</span>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       <div className="flex items-center gap-2">
//                         <i className="fas fa-at text-gray-400 text-xs"></i>
//                         {item.email}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-sm flex justify-center">
//                       <span
//                         className={`inline-flex items-center  gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusStyles(
//                           item.isActive
//                         )}`}
//                       >
//                         <i
//                           className={`fas ${getStatusIcon(
//                             item.isActive
//                           )} text-xs`}
//                         ></i>
//                         {item.isActive ? "Active" : "Inactive"}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       <div className="flex items-center gap-2">
//                         <i className="fas fa-clock text-gray-400 text-xs"></i>
//                         {new Date(item.createdAt).toLocaleDateString()}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-center">
//                       <div className="flex items-center justify-center gap-2">
//                         <button
//                           onClick={() => handleEdit(item)}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-[#0071E0] dark:text-blue-400 transition-colors"
//                           title="Edit Admin"
//                         >
//                           <i className="fas fa-pen text-xs"></i>
//                         </button>
//                         <button
//                           onClick={() => handleResetPassword(item)}
//                           disabled={resettingPassword === item._id}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                           title="Reset Password"
//                         >
//                           {resettingPassword === item._id ? (
//                             <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-amber-600 border-t-transparent"></div>
//                           ) : (
//                             <i className="fas fa-key text-xs"></i>
//                           )}
//                         </button>
//                         <button
//                           onClick={() => handleDelete(item)}
//                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors"
//                           title="Delete Admin"
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
//         <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
//           <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
//             <i className="fas fa-list text-[#0071E0] text-xs"></i>
//             <span>
//               Showing{" "}
//               <span className="text-gray-800 dark:text-gray-200 font-semibold">
//                 {adminsData.length}
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
//               disabled={currentPage === 1 || loading}
//               className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
//             >
//               <i className="fas fa-chevron-left text-xs"></i>
//               Previous
//             </button>

//             {/* Page Numbers */}
//             <div className="flex space-x-1.5">
//               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                 const pageNum = i + 1;
//                 return (
//                   <button
//                     key={pageNum}
//                     onClick={() => setCurrentPage(pageNum)}
//                     disabled={loading}
//                     className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
//                       currentPage === pageNum
//                         ? "bg-[#0071E0] text-white"
//                         : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
//                     } disabled:opacity-50 disabled:cursor-not-allowed`}
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
//               disabled={currentPage === totalPages || loading}
//               className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
//             >
//               Next
//               <i className="fas fa-chevron-right text-xs"></i>
//             </button>
//           </div>
//         </div>
//       </div>

//       <AdminsModal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setEditingAdmin(null);
//         }}
//         onSave={handleSave}
//         editAdmin={editingAdmin}
//       />
//     </div>
//   );
// };

// export default AdminsTable;


import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import toastHelper from "../../utils/toastHelper";
import AdminsModal from "./AdminsModal";
import {
  AdminService,
  Admin,
  UpdateAdminRequest,
} from "../../services/admin/admin.services";

const AdminsTable: React.FC = () => {
  const [adminsData, setAdminsData] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch admins with debounced search
  useEffect(() => {
    let debounceTimer: number;

    const fetchAdmins = async () => {
      setLoading(true);
      try {
        const response = await AdminService.listAdmins({
          page: currentPage,
          limit: itemsPerPage,
        });

        if (response.status === 200 && response.data?.docs) {
          const currentUserId = localStorage.getItem("userId");
          const filteredAdmins = response.data.docs.filter(
            (admin) => admin._id !== currentUserId
          );

          // Apply client-side filtering if searchTerm exists
          const filteredData = searchTerm
            ? filteredAdmins.filter(
                (admin) =>
                  admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  admin.email.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : filteredAdmins;

          setAdminsData(filteredData);
          setTotalDocs(searchTerm ? filteredData.length : response.data.totalDocs || 0);
        } else {
          console.log("No admins data received");
          setAdminsData([]);
          setTotalDocs(0);
        }
      } catch (error: any) {
        console.error("Error fetching admins:", error);
        if (error.message?.includes("Authentication required")) {
          toastHelper.showTost("Please login to access admins", "error");
        } else if (error.message?.includes("API endpoint not found")) {
          toastHelper.showTost("Admin feature is not available. Please contact administrator.", "error");
        } else {
          toastHelper.showTost("Failed to fetch admins", "error");
        }
        setAdminsData([]);
        setTotalDocs(0);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the fetch
    debounceTimer = setTimeout(() => {
      fetchAdmins();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchTerm]);

  const handleSave = async () => {
    setCurrentPage(1); // Reset to first page after save
    setIsModalOpen(false);
    setEditingAdmin(null);
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setIsModalOpen(true);
  };

  const handleResetPassword = async (admin: Admin) => {
    const confirmed = await Swal.fire({
      title: "Reset Password?",
      html: `
        <div class="text-center">
          <p class="mb-3">Are you sure you want to reset the password for <strong>${admin.name}</strong>?</p>
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <p class="text-sm text-amber-800">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              <strong>Warning:</strong> The new password will be set to <code class="bg-amber-100 px-1 rounded">user@1234</code>
            </p>
          </div>
          <p class="text-sm text-gray-600">The admin will need to change this password on their next login.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reset password!",
      cancelButtonText: "No, cancel!",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      focusCancel: true,
    });

    if (confirmed.isConfirmed) {
      setResettingPassword(admin._id);
      try {
        const updateData: UpdateAdminRequest = {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          isActive: admin.isActive,
          password: "user@1234",
        };

        await AdminService.updateAdmin(updateData);

        Swal.fire({
          title: "Password Reset!",
          text: `Password has been reset to "user@1234" for ${admin.name}`,
          icon: "success",
          confirmButtonColor: "#10b981",
        });
      } catch (error: any) {
        console.error("Error resetting password:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to reset password. Please try again.",
          icon: "error",
          confirmButtonColor: "#dc2626",
        });
      } finally {
        setResettingPassword(null);
      }
    }
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
        setCurrentPage(1); // Reset to first page after delete
      } catch (error: any) {
        console.error("Error deleting admin:", error);
        toastHelper.showTost("Failed to delete admin", "error");
      }
    }
  };

  const getStatusStyles = (isActive: boolean) => {
    return isActive
      ? "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200/50 dark:border-green-800/50"
      : "bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200/50 dark:border-red-800/50";
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? "fa-circle-check" : "fa-circle-xmark";
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
                  placeholder="Search by name or email..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0] transition-all duration-300 text-sm placeholder-gray-400 shadow-sm"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                />
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#0071E0] hover:bg-[#0061c0] text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => setIsModalOpen(true)}
            >
              <i className="fas fa-plus text-xs"></i>
              Add New Admin
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                {["Name", "Email", "Status", "Created At", "Actions"].map(
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
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 dark:border-gray-700"></div>
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0071E0] border-t-transparent absolute top-0 left-0"></div>
                      </div>
                      <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Loading Admins...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : adminsData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="w-14 h-14 bg-gray-100/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-users-slash text-xl text-gray-400"></i>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                        No admins found
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                adminsData.map((item: Admin) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#0071E0]/90 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <i className="fas fa-envelope text-gray-400 text-sm"></i>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${getStatusStyles(
                          item.isActive
                        )}`}
                      >
                        <i
                          className={`fas ${getStatusIcon(
                            item.isActive
                          )} text-xs`}
                        ></i>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <i className="fas fa-calendar text-gray-400 text-sm"></i>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2.5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0071E0]/10 hover:bg-[#0071E0]/20 dark:bg-[#0071E0]/20 dark:hover:bg-[#0071E0]/30 text-[#0071E0] dark:text-[#0071E0] transition-all duration-200 shadow-sm hover:shadow"
                          title="Edit Admin"
                        >
                          <i className="fas fa-pen text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleResetPassword(item)}
                          disabled={resettingPassword === item._id}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-100/50 hover:bg-amber-200/50 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reset Password"
                        >
                          {resettingPassword === item._id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-600 border-t-transparent"></div>
                          ) : (
                            <i className="fas fa-key text-sm"></i>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100/50 hover:bg-red-200/50 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all duration-200 shadow-sm hover:shadow"
                          title="Delete Admin"
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
        )}
      </div>

      <AdminsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAdmin(null);
        }}
        onSave={handleSave}
        editAdmin={editingAdmin}
      />
    </div>
  );
};

export default AdminsTable;
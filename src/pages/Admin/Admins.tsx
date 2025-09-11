import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import AdminsTable from "../../components/admins/AdminsTable";

const Admins = () => {
  return (
    <>
      <PageMeta
        title="React.js Admins Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Admins Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Admins" />
      <div className="space-y-6">
        <AdminsTable />
      </div>
    </>
  );
};

export default Admins;

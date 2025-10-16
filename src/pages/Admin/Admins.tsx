import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import AdminsTable from "../../components/admins/AdminsTable";

const Admins = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Admins" />
      <div className="space-y-6">
        <AdminsTable />
      </div>
    </>
  );
};

export default Admins;

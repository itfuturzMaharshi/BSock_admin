import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import BusinessRequestsTable from "../../components/businessRequests/BusinessRequestsTable";

const BusinessRequests = () => {
  return (
    <>
      <PageMeta
        title="React.js Sku Family Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Sku Family Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Business Requests" />
        <div className="space-y-6">
        <BusinessRequestsTable />
      </div>
    </>
  );
};

export default BusinessRequests;

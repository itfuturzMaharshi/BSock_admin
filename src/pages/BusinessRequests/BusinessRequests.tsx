import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import BusinessRequestsTable from "../../components/businessRequests/BusinessRequestsTable";

const BusinessRequests = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Business Requests" />
        <div className="space-y-6">
        <BusinessRequestsTable />
      </div>
    </>
  );
};

export default BusinessRequests;

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CustomerTable from "../../components/customer/CustomerTable";

const Customers = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Customers" />
      <div className="space-y-6">
        <CustomerTable />
      </div>
    </>
  );
};

export default Customers;


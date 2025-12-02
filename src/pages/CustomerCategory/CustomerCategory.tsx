import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CustomerCategoryTable from "../../components/customerCategory/CustomerCategoryTable";

const CustomerCategory = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Customer Category" />
      <div className="space-y-6 ">
        <CustomerCategoryTable />
      </div>
    </>
  );
};

export default CustomerCategory;


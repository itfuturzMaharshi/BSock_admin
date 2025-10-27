  import BidProductsTable from "../../components/bidProducts/BidProductsTable";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

const BidProducts = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Products" />
      <div className="space-y-6 ">
        <BidProductsTable />
      </div>
    </>
  );
};

export default BidProducts;

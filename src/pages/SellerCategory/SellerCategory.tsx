import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import SellerCategoryTable from "../../components/sellerCategory/SellerCategoryTable";

const SellerCategory = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Seller Category" />
      <div className="space-y-6 ">
        <SellerCategoryTable />
      </div>
    </>
  );
};

export default SellerCategory;


import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ProductCategoryTable from "../../components/productCategory/ProductCategoryTable";

const ProductCategory = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Product Category" />
      <div className="space-y-6 ">
        <ProductCategoryTable />
      </div>
    </>
  );
};

export default ProductCategory;


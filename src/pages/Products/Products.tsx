import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ProductsTable from "../../components/products/ProductsTable";

const Products = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Products" />
      <div className="space-y-6 ">
        <ProductsTable />
      </div>
    </>
  );
};

export default Products;

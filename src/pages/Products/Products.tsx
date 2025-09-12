import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ProductsTable from "../../components/products/ProductsTable";

const Products = () => {
  return (
    <>
      <PageMeta
        title="React.js Products Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Products Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Products" />
      <div className="space-y-6 ">
        <ProductsTable />
      </div>
    </>
  );
};

export default Products;

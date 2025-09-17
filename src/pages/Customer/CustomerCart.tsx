import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CustomerCart from "../../components/products/customerCart";
const customerCart = () => {
  return (
    <>
      <PageMeta
        title="React.js Products Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Products Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Customer Cart" />
      <div className="space-y-6 ">
        <CustomerCart />
      </div>
    </>
  );
};

export default customerCart;

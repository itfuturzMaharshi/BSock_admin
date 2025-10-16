import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CustomerCart from "../../components/products/customerCart";
const customerCart = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Customer Cart" />
      <div className="space-y-6 ">
        <CustomerCart />
      </div>
    </>
  );
};

export default customerCart;

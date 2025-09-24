import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import OrdersTable from "../../components/orders/OrdersTable";

const Orders = () => {
  return (
    <>
      <PageMeta
        title="React.js Orders Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Orders Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Orders" />
      <div className="space-y-6">
        <OrdersTable />
      </div>
    </>
  );
};

export default Orders;
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import OrdersTable from "../../components/orders/OrdersTable";

const Orders = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Orders" />
      <div className="space-y-6">
        <OrdersTable />
      </div>
    </>
  );
};

export default Orders;
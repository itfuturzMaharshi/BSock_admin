import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PaymentConfig from "../../components/payment/PaymentConfig";
const payment = () => {
  return (
    <>
      <PageMeta
        title="React.js Products Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Products Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Payment Configuration" />
      <p className="text-gray-600 dark:text-gray-400 mt-0 pt-0">Manage your payment modules and shared fields</p>
      
      <div className="space-y-6 ">
        <PaymentConfig />
      </div>
    </>
  );
};

export default payment;

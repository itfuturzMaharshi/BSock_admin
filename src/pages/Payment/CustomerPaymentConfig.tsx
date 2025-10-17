import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CustomerPaymentConfig from "../../components/payment/CustomerPaymentConfig";

const customerPaymentConfig = () => {
  return (
    <>
      <PageMeta
        title="Customer Payment Details | TailAdmin - Next.js Admin Dashboard Template"
        description="This is Customer Payment Details page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Customer Payment Details" />
      <p className="text-gray-600 dark:text-gray-400 mt-0 pt-0">Manage customer payment details and status updates</p>
      
      <div className="space-y-6 ">
        <CustomerPaymentConfig />
      </div>
    </>
  );
};

export default customerPaymentConfig;

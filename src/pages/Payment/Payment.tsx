import PageMeta from "../../components/common/PageMeta";
import PaymentConfig from "../../components/payment/PaymentConfig";
import { useState } from "react";

const payment = () => {
  const [actionButtons, setActionButtons] = useState<React.ReactNode>(null);

  return (
    <>
      <PageMeta
        title="React.js Products Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Products Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-white/90">
          Payment Configuration
        </h2>
        {actionButtons}
      </div>
      
      <div className="space-y-6 ">
        <PaymentConfig onRenderButtons={setActionButtons} />
      </div>
    </>
  );
};

export default payment;

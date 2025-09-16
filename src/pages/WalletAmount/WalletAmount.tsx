import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import WalletAmountTable from "../../components/walletAmount/WalletAmountTable";

const WalletAmount = () => {
  return (
    <>
      <PageMeta
        title="React.js Sku Family Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Sku Family Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Wallet Amount" />
      <div className="space-y-6">
        <WalletAmountTable />
      </div>
    </>
  );
};

export default WalletAmount;
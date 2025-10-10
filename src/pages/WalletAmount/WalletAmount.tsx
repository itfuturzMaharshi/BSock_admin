import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import WalletAmountTable from "../../components/walletAmount/WalletAmountTable";

const WalletAmount = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Wallet Amount" />
      <div className="space-y-6">
        <WalletAmountTable />
      </div>
    </>
  );
};

export default WalletAmount;
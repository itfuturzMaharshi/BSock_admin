import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CurrencyConversionTable from "../../components/currencyConversion/CurrencyConversionTable";

const CurrencyConversion = () => {
  return (
    <>
      <PageMeta
        title="React.js Sku Family Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Sku Family Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Currency Conversion" />
      <div className="space-y-6">
        <CurrencyConversionTable />
      </div>
    </>
  );
};

export default CurrencyConversion;

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import SkyFamilyTable from "../../components/skuFamily/SkuFamilyTable";

const SkuFamily = () => {
  return (
    <>
      <PageMeta
        title="React.js Sku Family Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Sku Family Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Sku Family" />
      <div className="space-y-6">
        <SkyFamilyTable />
      </div>
    </>
  );
};

export default SkuFamily;
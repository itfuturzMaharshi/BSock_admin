import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import SkyFamilyTable from "../../components/skuFamily/SkuFamilyTable";

const SkuFamily = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Sku Family" />
      <div className="space-y-6">
        <SkyFamilyTable />
      </div>
    </>
  );
};

export default SkuFamily;
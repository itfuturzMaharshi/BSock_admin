import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CostModuleTable from "../../components/costModule/CostModuleTable";

const CostModule = () => {
  return (
    <>
      <PageMeta
        title="React.js Sku Family Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Sku Family Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Cost Management" />
      <div className="space-y-6">
        <CostModuleTable />
      </div>
    </>
  );
};

export default CostModule;
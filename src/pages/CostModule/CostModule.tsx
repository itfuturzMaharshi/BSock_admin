import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CostModuleTable from "../../components/costModule/CostModuleTable";

const CostModule = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Cost Management" />
      <div className="space-y-6">
        <CostModuleTable />
      </div>
    </>
  );
};

export default CostModule;
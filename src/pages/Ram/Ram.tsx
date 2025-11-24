import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import RamTable from "../../components/ram/RamTable";

const Ram = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="RAM" />
      <div className="space-y-6 ">
        <RamTable />
      </div>
    </>
  );
};

export default Ram;



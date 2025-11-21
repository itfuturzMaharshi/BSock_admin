import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ColorTable from "../../components/color/ColorTable";

const Color = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Color" />
      <div className="space-y-6 ">
        <ColorTable />
      </div>
    </>
  );
};

export default Color;


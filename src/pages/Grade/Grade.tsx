import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import GradeTable from "../../components/grade/GradeTable";

const Grade = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Grade" />
      <div className="space-y-6 ">
        <GradeTable />
      </div>
    </>
  );
};

export default Grade;


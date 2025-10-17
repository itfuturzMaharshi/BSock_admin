import ActionsTable from "../../components/activities/ActivitiesTable";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

const Activities = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Activities" />
      <div className="space-y-6">
        <ActionsTable />
      </div>
    </>
  );
};

export default Activities;


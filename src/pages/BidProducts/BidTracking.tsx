import BidProductsTrackingTable from "../../components/bidProducts/BidProductsTrackingTable";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

const BidTracking = () => {
  return (
    <>
      <PageBreadcrumb pageTitle="Bid Products" />
      <div className="space-y-6 ">
        <BidProductsTrackingTable />
      </div>
    </>
  );
};

export default BidTracking;

import React from "react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onConfirm: (products: any[]) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, products, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
        <h2 className="text-xl font-semibold mb-4">Preview Imported Data</h2>
        <table className="w-full table-auto mb-4">
          <thead>
            <tr>
              <th>Lot Number</th>
              <th>Quantity</th>
              <th>OEM</th>
              <th>Model</th>
              <th>Description</th>
              <th>Category</th>
              <th>Grade</th>
              <th>Package Type</th>
              <th>Capacity</th>
              <th>Color</th>
              <th>Carrier</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item, index) => (
              <tr key={index}>
                <td>{item.lotNumber}</td>
                <td>{item.qty}</td>
                <td>{item.oem}</td>
                <td>{item.model}</td>
                <td>{item.description}</td>
                <td>{item.category}</td>
                <td>{item.grade}</td>
                <td>{item.packageType}</td>
                <td>{item.capacity}</td>
                <td>{item.color}</td>
                <td>{item.carrier}</td>
                <td>{item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>
          <button onClick={() => onConfirm(products)} className="px-4 py-2 bg-blue-600 text-white rounded">
            Confirm & Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
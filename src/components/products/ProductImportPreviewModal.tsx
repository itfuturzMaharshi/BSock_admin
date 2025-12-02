import React, { useState, useEffect } from 'react';
import { ProductService } from '../../services/product/product.services';
import toastHelper from '../../utils/toastHelper';

interface RowData {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  isValid: boolean;
}

interface ProductImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: RowData[];
  filePath?: string;
  onImportComplete?: () => void;
}

const ProductImportPreviewModal: React.FC<ProductImportPreviewModalProps> = ({
  isOpen,
  onClose,
  rows: initialRows,
  filePath,
  onImportComplete,
}) => {
  const [rows, setRows] = useState<RowData[]>(initialRows);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [editedData, setEditedData] = useState<Record<number, Record<string, any>>>({});

  useEffect(() => {
    if (isOpen) {
      setRows(initialRows);
      setEditedData({});
      setEditingRow(null);
    }
  }, [isOpen, initialRows]);

  const handleEdit = (rowNumber: number) => {
    setEditingRow(rowNumber);
    const row = rows.find(r => r.rowNumber === rowNumber);
    if (row && !editedData[rowNumber]) {
      setEditedData(prev => ({
        ...prev,
        [rowNumber]: { ...row.data },
      }));
    }
  };

  const handleSave = (rowNumber: number) => {
    const edited = editedData[rowNumber];
    if (edited) {
      setRows(prev => prev.map(r => 
        r.rowNumber === rowNumber 
          ? { ...r, data: { ...r.data, ...edited }, errors: [], isValid: true }
          : r
      ));
      setEditingRow(null);
    }
  };

  const handleCancel = (rowNumber: number) => {
    setEditingRow(null);
    setEditedData(prev => {
      const newData = { ...prev };
      delete newData[rowNumber];
      return newData;
    });
  };

  const handleFieldChange = (rowNumber: number, field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [rowNumber]: {
        ...(prev[rowNumber] || {}),
        [field]: value,
      },
    }));
  };

  const handleReImport = async () => {
    // Check if there are still errors
    const rowsWithErrors = rows.filter(r => !r.isValid || r.errors.length > 0);
    if (rowsWithErrors.length > 0) {
      toastHelper.showTost(`Please fix ${rowsWithErrors.length} row(s) with errors before importing`, 'error');
      return;
    }

    setLoading(true);
    try {
      // Get selectedCharges from UploadExcelModal if available
      // For now, we'll pass empty charges - this can be enhanced later
      const selectedCharges = {};
      
      // Send corrected rows to backend
      const response = await ProductService.importCorrectedData(rows, selectedCharges);
      
      // Success - close modal and trigger refresh
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error: any) {
      // Check if error response contains updated rows with errors
      const errorData = error.response?.data || error;
      if (errorData?.data?.errors && errorData.data.errors.length > 0) {
        // Update rows with new errors from backend validation
        const errorMessages = errorData.data.errors;
        const updatedRows = rows.map(row => {
          // Find errors for this row
          const rowErrors = errorMessages
            .filter((err: string) => err.includes(`Row ${row.rowNumber}:`))
            .map((err: string) => err.replace(`Row ${row.rowNumber}: `, ''));
          
          if (rowErrors.length > 0) {
            return {
              ...row,
              errors: rowErrors,
              isValid: false,
            };
          }
          return row;
        });
        
        setRows(updatedRows);
        toastHelper.showTost(`Please fix ${errorMessages.length} error(s) and try again`, 'error');
      } else {
        // Error is already handled by the service
        console.error('Failed to re-import:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = rows.some(r => !r.isValid || r.errors.length > 0);
  const errorCount = rows.filter(r => !r.isValid || r.errors.length > 0).length;
  const validCount = rows.filter(r => r.isValid && r.errors.length === 0).length;

  if (!isOpen) return null;

  // Get all unique field names from all rows
  const allFields = new Set<string>();
  rows.forEach(row => {
    Object.keys(row.data).forEach(key => allFields.add(key));
  });
  const fieldNames = Array.from(allFields).sort();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-[95vw] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Import Preview
            </h2>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {validCount} valid, {errorCount} with errors
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-900 z-10">
                    Row
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-12 bg-gray-50 dark:bg-gray-900 z-10">
                    Status
                  </th>
                  {fieldNames.map(field => (
                    <th key={field} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {field}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {rows.map((row) => {
                  const isEditing = editingRow === row.rowNumber;
                  const hasError = !row.isValid || row.errors.length > 0;
                  const rowData = isEditing ? editedData[row.rowNumber] || row.data : row.data;

                  return (
                    <tr
                      key={row.rowNumber}
                      className={`${
                        hasError
                          ? 'bg-red-50 dark:bg-red-900/20'
                          : 'bg-white dark:bg-gray-800'
                      } hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-inherit z-10">
                        {row.rowNumber}
                      </td>
                      <td className="px-3 py-2 text-sm sticky left-12 bg-inherit z-10">
                        {hasError ? (
                          <div className="flex flex-col">
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              <i className="fas fa-exclamation-circle mr-1"></i>
                              Error
                            </span>
                            {row.errors.length > 0 && (
                              <div className="mt-1 text-xs text-red-500 dark:text-red-400">
                                {row.errors[0]}
                                {row.errors.length > 1 && ` (+${row.errors.length - 1} more)`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            <i className="fas fa-check-circle mr-1"></i>
                            Valid
                          </span>
                        )}
                      </td>
                      {fieldNames.map(field => (
                        <td key={field} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                          {isEditing ? (
                            <input
                              type="text"
                              value={rowData[field] || ''}
                              onChange={(e) => handleFieldChange(row.rowNumber, field, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs"
                            />
                          ) : (
                            <div className="truncate max-w-xs" title={String(rowData[field] || '')}>
                              {String(rowData[field] || '')}
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-sm">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(row.rowNumber)}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Save"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              onClick={() => handleCancel(row.rowNumber)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Cancel"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(row.rowNumber)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {hasErrors ? (
              <span className="text-red-600 dark:text-red-400">
                Please fix {errorCount} error(s) before importing
              </span>
            ) : (
              <span className="text-green-600 dark:text-green-400">
                All rows are valid. Ready to import.
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            {!hasErrors && (
              <button
                onClick={handleReImport}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing...' : 'Import All'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductImportPreviewModal;


import React, { useEffect, useState } from 'react';
import { BidService, BidHistoryItem, BidHistoryResponse } from '../../services/bidProducts/bid.services';

interface BidHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
}

const BidHistoryModal: React.FC<BidHistoryModalProps> = ({ isOpen, onClose, productId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<BidHistoryResponse['data'] | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    if (!isOpen || !productId) return;
    fetchHistory(1);
  }, [isOpen, productId]);

  const fetchHistory = async (newPage: number) => {
    if (!productId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await BidService.getBidHistory(productId, newPage, limit);
      setHistory(res.data || null);
      setPage(newPage);
    } catch (e: any) {
      setError(e.message || 'Failed to load bid history');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const bids = history?.bids?.docs || [];
  const totalPages = history?.bids?.totalPages || 1;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bid History</h3>
            {history?.product && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{history.product.lotNumber} — {history.product.description}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>
          ) : bids.length === 0 ? (
            <div className="p-10 text-center text-gray-500 dark:text-gray-400">No bids yet</div>
          ) : (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <i className="fas fa-info-circle mr-2"></i>
                <strong>Green highlighted rows</strong> indicate the winning bid.
              </p>
            </div>
          )}
          {bids.length > 0 && (
            <table className="w-full table-auto">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Bidder</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {bids.map((b: BidHistoryItem) => (
                  <tr key={b._id} className={b.isWinning ? "bg-green-50 dark:bg-green-900/20" : ""}>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        {b.customer?.profileImage ? (
                          <img src={b.customer.profileImage}  className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <i className="fas fa-user text-xs text-gray-600"></i>
                          </div>
                        )}
                        {b.customer?.name || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{b.customer?.email || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100">${typeof b.bidAmount === 'number' ? b.bidAmount.toFixed(2) : b.bidAmount}</td>
                    <td className="px-4 py-3 text-sm">
                      {b.isWinning ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Winning
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          Lost
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{new Date(b.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {history?.bids && history.bids.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => fetchHistory(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-300">Page {page} of {history.bids.totalPages}</div>
            <button
              onClick={() => fetchHistory(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidHistoryModal;



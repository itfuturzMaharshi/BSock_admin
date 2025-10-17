import React, { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import VersionProductService, { ProductVersionHistoryQuery, ProductsWithCountsQuery } from '../../services/versioning/versionProduct.services'
import placeholderImage from '../../../public/images/product/noimage.jpg'
import toastHelper from '../../utils/toastHelper'

interface VersionRowItem {
	_id?: string
	productId: string
	version: number
	data: any 
	status?: string
}

const ActivitiesTable = () => {
  const [items, setItems] = useState<VersionRowItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [limit] = useState<number>(10)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [totalDocs, setTotalDocs] = useState<number>(0)
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalDocs / limit)), [totalDocs, limit])
  const [isViewOpen, setIsViewOpen] = useState<boolean>(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Step 1: Find a productId to query history for, honoring the search term if any
        const countsBody: ProductsWithCountsQuery = { page: 1, limit: 1, search: searchTerm || undefined }
        const countsRes = await VersionProductService.fetchProductsWithCounts(countsBody)
        const countsPayload = countsRes?.data?.data || countsRes?.data
        const firstProduct = countsPayload?.docs?.[0]
        const productId: string | undefined = firstProduct?._id || firstProduct?.productId

        if (!productId) {
          setItems([])
          setTotalDocs(0)
          return
        }

        // Step 2: Fetch product version history for the discovered productId
        const historyBody: ProductVersionHistoryQuery = { productId, page, limit }
        const res = await VersionProductService.fetchHistory(historyBody)
        const payload = res?.data?.data || res?.data
        const docs = payload?.docs || []
        setItems(docs)
        setTotalDocs(payload?.totalDocs || docs.length)
      } catch (err: any) {
        // toast already from service if any; keep minimal UI disruption
        setItems([])
        setTotalDocs(0)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [page, limit, searchTerm])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1)
  }

  const formatExpiryTime = (iso?: string) => {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return '—'
      return format(d, 'dd MMM yyyy, HH:mm')
    } catch {
      return '—'
    }
  }

  const handleView = async (row: any) => {
    try {
      const productId = row?.productId || row?._id || row?.data?._id
      const rawVersion = row?.version ?? row?.data?.version
      const version = typeof rawVersion === 'string' ? parseInt(rawVersion, 10) : rawVersion
      let data = row?.productData || row?.data || row
      if (productId && typeof version === 'number') {
        // Try to fetch exact snapshot for accuracy
        const res = await VersionProductService.fetchVersion({ productId, version })
        // APIs in this module return payload under `data` key (res.data.data)
        data = res?.data?.data || data
      }
      const createdAt = row?.createdAt
      setSelectedItem(createdAt ? { ...data, __createdAt: createdAt } : data)
      setIsViewOpen(true)
    } catch {
      // toast already handled in service on error
    }
  }

  const handleRestore = async (row: any) => {
    try {
      const productId = row?.productId || row?._id || row?.data?._id
      const rawVersion = row?.version ?? row?.data?.version
      const version = typeof rawVersion === 'string' ? parseInt(rawVersion, 10) : rawVersion
      if (!productId || typeof version !== 'number') {
        toastHelper.showTost('Missing product or version', 'error')
        return
      }
      const reason = window.prompt('Enter reason for restore:') || 'Admin restore'
      await VersionProductService.restoreVersion({ productId, version, changeReason: reason })
      // Refresh list after restore
      setPage(1)
    } catch {
      // errors toasted in service
    }
  }

  return (
    <>
    <div className="p-4">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by SKU Family ID or other..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          <div className="flex items-center gap-3"></div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Sub Sku Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  SIM Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Color
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  RAM
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Storage
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Created At
                </th>
                {/* <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Status
                </th> */}
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 align-middle">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto mb-4"></div>
                      Loading Products...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      No items to display
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item: any, index: number) => {
                  const product = item?.productData || item?.data || item
                  const skuFamily = product?.skuFamilyId
                  const subSkuFamily = product?.subSkuFamilyId
                  const images: string[] = (skuFamily?.images || product?.images || []) as string[]
                  const imageUrl = images?.[0] || placeholderImage
                  return (
                    <tr key={`${item.productId || item._id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="px-6 py-4 align-middle">
                        <img src={imageUrl} alt="Product" className="h-10 w-10 object-cover rounded" />
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-700 dark:text-gray-200">
                        {skuFamily?.name || product?.name || '—'}
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-700 dark:text-gray-200">
                        {subSkuFamily?.name || '—'}
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-700 dark:text-gray-200">{product?.simType || '—'}</td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-700 dark:text-gray-200">{product?.color || '—'}</td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-700 dark:text-gray-200">{product?.ram || '—'}</td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-700 dark:text-gray-200">{product?.storage || '—'}</td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-700 dark:text-gray-200">{product?.price ?? '—'}</td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-700 dark:text-gray-200">{formatExpiryTime(item?.createdAt)}</td>
                      {/* <td className="px-6 py-4 align-middle text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product?.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                          {product?.status || '—'}
                        </span>
                      </td> */}
                      <td className="px-6 py-4 align-middle text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            title="View"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => handleView(item)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            title="Restore"
                            className="text-amber-600 hover:text-amber-700"
                            onClick={() => handleRestore(item)}
                          >
                            <i className="fas fa-rotate-left"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className={`px-3 py-1 rounded border text-sm ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className={`px-3 py-1 rounded border text-sm ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}>Next</button>
          </div>
        </div>
      </div>
    </div>
    {isViewOpen && selectedItem && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={() => setIsViewOpen(false)}></div>
        <div className="relative z-10 w-full max-w-3xl mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Product Details (Version View)</h3>
            <button onClick={() => setIsViewOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex items-center gap-4">
              <img
                src={(selectedItem?.skuFamilyId?.images?.[0] || selectedItem?.images?.[0] || placeholderImage) as string}
                alt="Product"
                className="h-16 w-16 rounded object-cover"
              />
              <div>
                <div className="text-sm text-gray-700 dark:text-gray-300">Created At</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedItem?.__createdAt ? format(new Date(selectedItem.__createdAt), 'dd MMM yyyy, HH:mm') : '—'}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{selectedItem?.skuFamilyId?.name || selectedItem?.name || '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sub Sku Name</label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{selectedItem?.subSkuFamilyId?.name || '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIM Type</label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{selectedItem?.simType || '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{selectedItem?.color || '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RAM</label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{selectedItem?.ram || '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Storage</label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{selectedItem?.storage || '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{selectedItem?.price ?? '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{selectedItem?.country || '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">{formatExpiryTime(selectedItem?.expiryTime)}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setIsViewOpen(false)} className="px-4 py-2 rounded border text-sm">Close</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default ActivitiesTable

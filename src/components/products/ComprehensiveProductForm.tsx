import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { VariantOption } from './CascadingVariantSelector';
import { GradeService } from '../../services/grade/grade.services';
import { SellerService } from '../../services/seller/sellerService';
import { CostModuleService } from '../../services/costModule/costModule.services';

export interface ProductRowData {
  // Product Detail Group
  subModelName: string;
  storage: string;
  colour: string;
  country: string;
  sim: string;
  version: string;
  grade: string;
  status: string;
  lockUnlock: string; // '1' for lock, '0' for unlock
  warranty: string;
  batteryHealth: string;
  
  // Pricing / Delivery / Payment Method Group
  packing: string;
  currentLocation: string;
  hkUsd: number | string;
  hkXe: number | string;
  hkHkd: number | string;
  dubaiUsd: number | string;
  dubaiXe: number | string;
  dubaiAed: number | string;
  deliveryLocation: string; // Auto-generated
  customMessage: string;
  totalQty: number | string;
  moqPerVariant: number | string;
  moqPerCart: number | string;
  weight: number | string;
  paymentTerm: string;
  paymentMethod: string;
  
  // Other Information Group
  negotiableFixed: string; // '1' for negotiable, '0' for fixed
  shippingTime: string;
  deliveryTime: string;
  vendor: string;
  vendorListingNo: string;
  carrier: string;
  carrierListingNo: string;
  uniqueListingNo: string; // Auto-generated
  hotDeal: string;
  lowStock: string;
  adminCustomMessage: string;
  startTime: string;
  endTime: string;
  remark: string;
  
  // Additional fields
  supplierId: string;
  supplierListingNumber: string;
  skuFamilyId: string;
  subSkuFamilyId?: string;
  ram?: string;
  sequence?: number;
  images?: string[];
}

interface ComprehensiveProductFormProps {
  variantType: 'single' | 'multi';
  variants?: VariantOption[];
  onSave: (rows: ProductRowData[]) => void;
  onCancel: () => void;
}

const ComprehensiveProductForm: React.FC<ComprehensiveProductFormProps> = ({
  variantType,
  variants = [],
  onSave,
  onCancel,
}) => {
  const [rows, setRows] = useState<ProductRowData[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [costsByCountry, setCostsByCountry] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  // Initialize rows based on variant type
  useEffect(() => {
    if (variantType === 'multi' && variants.length > 0) {
      const newRows: ProductRowData[] = variants.map((variant, index) => ({
        subModelName: variant.subModelName,
        storage: variant.storage,
        colour: variant.color,
        country: '',
        sim: '',
        version: '',
        grade: '',
        status: 'Active',
        lockUnlock: '0',
        warranty: '',
        batteryHealth: '',
        packing: '',
        currentLocation: '',
        hkUsd: '',
        hkXe: '',
        hkHkd: '',
        dubaiUsd: '',
        dubaiXe: '',
        dubaiAed: '',
        deliveryLocation: '',
        customMessage: '',
        totalQty: '',
        moqPerVariant: '',
        moqPerCart: variantType === 'multi' ? '' : '',
        weight: '',
        paymentTerm: '',
        paymentMethod: '',
        negotiableFixed: '0',
        shippingTime: '',
        deliveryTime: '',
        vendor: '',
        vendorListingNo: '',
        carrier: '',
        carrierListingNo: '',
        uniqueListingNo: '',
        hotDeal: '',
        lowStock: '',
        adminCustomMessage: '',
        startTime: '',
        endTime: '',
        remark: '',
        supplierId: '',
        supplierListingNumber: '',
        skuFamilyId: variant.skuFamilyId,
        subSkuFamilyId: variant.subSkuFamilyId,
        ram: variant.ram,
        sequence: index + 1,
      }));
      setRows(newRows);
    } else if (variantType === 'single') {
      setRows([{
        subModelName: '',
        storage: '',
        colour: '',
        country: '',
        sim: '',
        version: '',
        grade: '',
        status: 'Active',
        lockUnlock: '0',
        warranty: '',
        batteryHealth: '',
        packing: '',
        currentLocation: '',
        hkUsd: '',
        hkXe: '',
        hkHkd: '',
        dubaiUsd: '',
        dubaiXe: '',
        dubaiAed: '',
        deliveryLocation: '',
        customMessage: '',
        totalQty: '',
        moqPerVariant: '',
        moqPerCart: '',
        weight: '',
        paymentTerm: '',
        paymentMethod: '',
        negotiableFixed: '0',
        shippingTime: '',
        deliveryTime: '',
        vendor: '',
        vendorListingNo: '',
        carrier: '',
        carrierListingNo: '',
        uniqueListingNo: '',
        hotDeal: '',
        lowStock: '',
        adminCustomMessage: '',
        startTime: '',
        endTime: '',
        remark: '',
        supplierId: '',
        supplierListingNumber: '',
        skuFamilyId: '',
        sequence: 1,
      }]);
    }
  }, [variantType, variants]);

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch grades
        const gradeResponse = await GradeService.getGradeList(1, 1000);
        setGrades(gradeResponse.data.docs || []);
        
        // Fetch sellers
        const sellersList = await SellerService.getAllSellers();
        setSellers(sellersList || []);
        
        // Fetch costs by country
        const costResponse = await CostModuleService.getCostsByCountry();
        if (costResponse.status === 200 && costResponse.data) {
          setCostsByCountry(costResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Auto-calculate delivery location based on current location
  useEffect(() => {
    setRows(prevRows => prevRows.map(row => {
      if (row.currentLocation) {
        const locations: string[] = [];
        if (row.currentLocation === 'Hong Kong' || row.hkUsd || row.hkHkd) {
          locations.push('Hong Kong');
        }
        if (row.currentLocation === 'Dubai' || row.dubaiUsd || row.dubaiAed) {
          locations.push('Dubai');
        }
        return { ...row, deliveryLocation: locations.join(',') };
      }
      return row;
    }));
  }, [rows.map(r => r.currentLocation).join(',')]);

  const updateRow = (index: number, field: keyof ProductRowData, value: any) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      newRows[index] = { ...newRows[index], [field]: value };
      
      // Auto-calculate currency conversions
      if (field === 'hkUsd' || field === 'hkXe' || field === 'hkHkd') {
        const usd = parseFloat(String(newRows[index].hkUsd)) || 0;
        const xe = parseFloat(String(newRows[index].hkXe)) || 0;
        const hkd = parseFloat(String(newRows[index].hkHkd)) || 0;
        
        if (field === 'hkUsd' && xe && !hkd) {
          newRows[index].hkHkd = (usd * xe).toFixed(2);
        } else if (field === 'hkXe' && usd && !hkd) {
          newRows[index].hkHkd = (usd * xe).toFixed(2);
        } else if (field === 'hkHkd' && xe && !usd) {
          newRows[index].hkUsd = (hkd / xe).toFixed(2);
        } else if (field === 'hkHkd' && usd && !xe) {
          newRows[index].hkXe = (hkd / usd).toFixed(6);
        }
      }
      
      if (field === 'dubaiUsd' || field === 'dubaiXe' || field === 'dubaiAed') {
        const usd = parseFloat(String(newRows[index].dubaiUsd)) || 0;
        const xe = parseFloat(String(newRows[index].dubaiXe)) || 0;
        const aed = parseFloat(String(newRows[index].dubaiAed)) || 0;
        
        if (field === 'dubaiUsd' && xe && !aed) {
          newRows[index].dubaiAed = (usd * xe).toFixed(2);
        } else if (field === 'dubaiXe' && usd && !aed) {
          newRows[index].dubaiAed = (usd * xe).toFixed(2);
        } else if (field === 'dubaiAed' && xe && !usd) {
          newRows[index].dubaiUsd = (aed / xe).toFixed(2);
        } else if (field === 'dubaiAed' && usd && !xe) {
          newRows[index].dubaiXe = (aed / usd).toFixed(6);
        }
      }
      
      return newRows;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate unique listing numbers
    const rowsWithListingNos = rows.map((row, index) => ({
      ...row,
      uniqueListingNo: row.uniqueListingNo || `LIST-${Date.now()}-${index}`,
    }));
    
    onSave(rowsWithListingNos);
  };

  const countryOptions = ['Hong Kong', 'Dubai', 'Singapore'];
  const simOptions = ['Dual SIM', 'E-SIM', 'Physical Sim'];
  const statusOptions = ['Active', 'Non Active', 'pre owned'];
  const lockUnlockOptions = [
    { value: '1', label: 'Lock' },
    { value: '0', label: 'Unlock' },
  ];
  const packingOptions = ['sealed', 'open sealed', 'master cartoon'];
  const paymentTermOptions = ['on order', 'on delivery', 'as in conformation'];
  const paymentMethodOptions = ['hkd cash / aed cash', 'usd cash /tt', 'as in conformation'];
  const negotiableFixedOptions = [
    { value: '1', label: 'Negotiable' },
    { value: '0', label: 'Fixed' },
  ];
  const vendorOptions = ['att', 'tmobile'];
  const carrierOptions = ['tmob', 'mixed'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            {variantType === 'multi' ? 'Multi-Variant Product Form' : 'Single Variant Product Form'}
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            {rows.length} row(s) to fill
          </p>
        </div>

        {/* Scrollable Table Container */}
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              {/* Product Detail Group Header */}
              <tr>
                <th colSpan={11} className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 text-left font-bold text-sm border">
                  Product Detail Group
                </th>
              </tr>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border text-left min-w-[120px]">
                  SubModelName*
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border text-left min-w-[100px]">
                  Storage*
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border text-left min-w-[100px]">
                  Colour*
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border text-left min-w-[100px]">
                  Country (specs)*
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border text-left min-w-[100px]">
                  SIM*
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border text-left min-w-[100px]">
                  VERSION
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border text-left min-w-[100px]">
                  GRADE*
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border text-left min-w-[100px]">
                  STATUS*
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border text-left min-w-[100px]">
                  LOCK/UNLOCK*
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border text-left min-w-[100px]">
                  WARRANTY
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border text-left min-w-[100px]">
                  BATTERY HEALTH
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.subModelName}
                      onChange={(e) => updateRow(rowIndex, 'subModelName', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      required
                      disabled={variantType === 'multi'}
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.storage}
                      onChange={(e) => updateRow(rowIndex, 'storage', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      required
                      disabled={variantType === 'multi'}
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.colour}
                      onChange={(e) => updateRow(rowIndex, 'colour', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      required
                      disabled={variantType === 'multi'}
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <select
                      value={row.country}
                      onChange={(e) => updateRow(rowIndex, 'country', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      required
                    >
                      <option value="">Select</option>
                      {countryOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 border">
                    <select
                      value={row.sim}
                      onChange={(e) => updateRow(rowIndex, 'sim', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      required
                    >
                      <option value="">Select</option>
                      {simOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.version}
                      onChange={(e) => updateRow(rowIndex, 'version', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="e.g., ALSKW123"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <Select
                      options={grades.map(g => ({ value: g._id, label: g.title }))}
                      value={grades.find(g => g._id === row.grade) ? { value: row.grade, label: grades.find(g => g._id === row.grade)?.title } : null}
                      onChange={(opt) => updateRow(rowIndex, 'grade', opt?.value || '')}
                      className="text-sm"
                      classNamePrefix="select"
                      isSearchable
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <select
                      value={row.status}
                      onChange={(e) => updateRow(rowIndex, 'status', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      required
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 border">
                    <select
                      value={row.lockUnlock}
                      onChange={(e) => updateRow(rowIndex, 'lockUnlock', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      required
                    >
                      {lockUnlockOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.warranty}
                      onChange={(e) => updateRow(rowIndex, 'warranty', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="e.g., 6 months +"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.batteryHealth}
                      onChange={(e) => updateRow(rowIndex, 'batteryHealth', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="e.g., 70% above"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing / Delivery / Payment Method Group */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden mt-6">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Pricing / Delivery / Payment Method Group</h3>
        </div>
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th colSpan={15} className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 text-left font-bold text-sm border">
                  Pricing / Delivery / Payment Method Group
                </th>
              </tr>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">PACKING*</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">CURRENT LOCATION*</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">HK USD</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">HK XE</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">HK HKD</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">DUBAI USD</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">DUBAI XE</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">DUBAI AED</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">DELIVERY LOCATION</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">CUSTOM MESSAGE</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">TOTAL QTY*</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">MOQ/VARIANT*</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">MOQ PER CART</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">WEIGHT</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">PAYMENT TERM</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">PAYMENT METHOD</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-2 border">
                    <select
                      value={row.packing}
                      onChange={(e) => updateRow(rowIndex, 'packing', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      required
                    >
                      <option value="">Select</option>
                      {packingOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 border">
                    <select
                      value={row.currentLocation}
                      onChange={(e) => updateRow(rowIndex, 'currentLocation', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      required
                    >
                      <option value="">Select</option>
                      {countryOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      step="0.01"
                      value={row.hkUsd}
                      onChange={(e) => updateRow(rowIndex, 'hkUsd', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      step="0.000001"
                      value={row.hkXe}
                      onChange={(e) => updateRow(rowIndex, 'hkXe', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="0.000000"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      step="0.01"
                      value={row.hkHkd}
                      onChange={(e) => updateRow(rowIndex, 'hkHkd', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      step="0.01"
                      value={row.dubaiUsd}
                      onChange={(e) => updateRow(rowIndex, 'dubaiUsd', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      step="0.000001"
                      value={row.dubaiXe}
                      onChange={(e) => updateRow(rowIndex, 'dubaiXe', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="0.000000"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      step="0.01"
                      value={row.dubaiAed}
                      onChange={(e) => updateRow(rowIndex, 'dubaiAed', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.deliveryLocation}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-100 dark:bg-gray-700"
                      readOnly
                      placeholder="Auto-generated"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.customMessage}
                      onChange={(e) => updateRow(rowIndex, 'customMessage', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="e.g., frt inc"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      value={row.totalQty}
                      onChange={(e) => updateRow(rowIndex, 'totalQty', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      required
                      placeholder="0"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      value={row.moqPerVariant}
                      onChange={(e) => updateRow(rowIndex, 'moqPerVariant', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      required
                      placeholder="0"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      value={row.moqPerCart}
                      onChange={(e) => updateRow(rowIndex, 'moqPerCart', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder={variantType === 'multi' ? 'Multi variant only' : 'N/A'}
                      disabled={variantType === 'single'}
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      step="0.01"
                      value={row.weight}
                      onChange={(e) => updateRow(rowIndex, 'weight', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="0.00 kg"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <select
                      value={row.paymentTerm}
                      onChange={(e) => updateRow(rowIndex, 'paymentTerm', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                    >
                      <option value="">Select</option>
                      {paymentTermOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 border">
                    <select
                      value={row.paymentMethod}
                      onChange={(e) => updateRow(rowIndex, 'paymentMethod', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                    >
                      <option value="">Select</option>
                      {paymentMethodOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Other Information Group */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden mt-6">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Other Information Group</h3>
        </div>
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th colSpan={15} className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 text-left font-bold text-sm border">
                  Other Information Group
                </th>
              </tr>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">NEGOTIABLE/FIXED</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">SHIPPING TIME</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">DELIVERY TIME</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">VENDOR</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">VENDOR LISTING NO</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">CARRIER</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">CARRIER LISTING NO</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">UNIQUE LISTING NO</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">HOT DEAL</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[100px]">LOW STOCK</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[150px]">ADMIN CUSTOM MESSAGE</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[150px]">START TIME</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[150px]">END TIME</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">SUPPLIER ID*</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[150px]">SUPPLIER LISTING NO*</th>
                <th className="px-3 py-2 text-xs font-semibold border text-left min-w-[120px]">REMARK</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-2 border">
                    <select
                      value={row.negotiableFixed}
                      onChange={(e) => updateRow(rowIndex, 'negotiableFixed', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                    >
                      {negotiableFixedOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.shippingTime}
                      onChange={(e) => updateRow(rowIndex, 'shippingTime', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="e.g., ship today"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.deliveryTime}
                      onChange={(e) => updateRow(rowIndex, 'deliveryTime', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="e.g., 2-3 days"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <select
                      value={row.vendor}
                      onChange={(e) => updateRow(rowIndex, 'vendor', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                    >
                      <option value="">Select</option>
                      {vendorOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.vendorListingNo}
                      onChange={(e) => updateRow(rowIndex, 'vendorListingNo', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="e.g., att123abc"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <select
                      value={row.carrier}
                      onChange={(e) => updateRow(rowIndex, 'carrier', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                    >
                      <option value="">Select</option>
                      {carrierOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.carrierListingNo}
                      onChange={(e) => updateRow(rowIndex, 'carrierListingNo', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="e.g., qwe123"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.uniqueListingNo}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-100 dark:bg-gray-700"
                      readOnly
                      placeholder="Auto-generated"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.hotDeal}
                      onChange={(e) => updateRow(rowIndex, 'hotDeal', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="tag 1"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.lowStock}
                      onChange={(e) => updateRow(rowIndex, 'lowStock', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="tag 1"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.adminCustomMessage}
                      onChange={(e) => updateRow(rowIndex, 'adminCustomMessage', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="Admin only message"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <DatePicker
                      selected={row.startTime ? new Date(row.startTime) : null}
                      onChange={(date) => updateRow(rowIndex, 'startTime', date ? date.toISOString() : '')}
                      showTimeSelect
                      timeFormat="HH:mm"
                      dateFormat="yyyy-MM-dd HH:mm"
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholderText="Select start time"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <DatePicker
                      selected={row.endTime ? new Date(row.endTime) : null}
                      onChange={(date) => updateRow(rowIndex, 'endTime', date ? date.toISOString() : '')}
                      showTimeSelect
                      timeFormat="HH:mm"
                      dateFormat="yyyy-MM-dd HH:mm"
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholderText="Select end time"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <Select
                      options={sellers.map(s => ({ value: s._id, label: `${s.name}${s.code ? ` (${s.code})` : ''}` }))}
                      value={sellers.find(s => s._id === row.supplierId) ? { value: row.supplierId, label: sellers.find(s => s._id === row.supplierId)?.name } : null}
                      onChange={(opt) => updateRow(rowIndex, 'supplierId', opt?.value || '')}
                      className="text-sm"
                      classNamePrefix="select"
                      isSearchable
                      placeholder="Select Supplier"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.supplierListingNumber}
                      onChange={(e) => updateRow(rowIndex, 'supplierListingNumber', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      required
                      placeholder="Supplier listing number"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.remark}
                      onChange={(e) => updateRow(rowIndex, 'remark', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50 dark:bg-gray-800"
                      placeholder="Customer visible remark"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Products
        </button>
      </div>
    </form>
  );
};

export default ComprehensiveProductForm;


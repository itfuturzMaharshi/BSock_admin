import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { VariantOption } from './CascadingVariantSelector';
import { GradeService } from '../../services/grade/grade.services';
import { SellerService } from '../../services/seller/sellerService';
import { ProductService } from '../../services/product/product.services';

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
  condition: string;
  lockUnlock: string;
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
  deliveryLocation: string;
  customMessage: string;
  totalQty: number | string;
  moqPerVariant: number | string;
  moqPerCart: number | string;
  weight: number | string;
  paymentTerm: string;
  paymentMethod: string;
  
  // Other Information Group
  negotiableFixed: string;
  shippingTime: string;
  deliveryTime: string;
  vendor: string;
  vendorListingNo: string;
  carrier: string;
  carrierListingNo: string;
  uniqueListingNo: string;
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
  ram?: string;
  sequence?: number;
  images?: string[];
}

interface ExcelLikeProductFormProps {
  variantType: 'single' | 'multi';
  variants?: VariantOption[];
  onSave: (rows: ProductRowData[]) => void;
  onCancel: () => void;
}

const ExcelLikeProductForm: React.FC<ExcelLikeProductFormProps> = ({
  variantType,
  variants = [],
  onSave,
  onCancel,
}) => {
  const [rows, setRows] = useState<ProductRowData[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [skuFamilies, setSkuFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: string } | null>(null);
  const cellRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});

  // Initialize rows based on variant type
  useEffect(() => {
    if (variantType === 'multi' && variants.length > 0) {
      const newRows: ProductRowData[] = variants.map((variant, index) => createEmptyRow(index, variant));
      setRows(newRows);
    } else if (variantType === 'single') {
      setRows([createEmptyRow(0)]);
    }
  }, [variantType, variants]);

  const createEmptyRow = (index: number, variant?: VariantOption): ProductRowData => ({
    subModelName: variant?.subModelName || '',
    storage: variant?.storage || '',
    colour: variant?.color || '',
    country: '',
    sim: '',
    version: '',
    grade: '',
    status: 'Active',
    condition: '',
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
    skuFamilyId: variant?.skuFamilyId || '',
    ram: variant?.ram,
    sequence: index + 1,
  });

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const gradeResponse = await GradeService.getGradeList(1, 1000);
        setGrades(gradeResponse.data.docs || []);
        const sellersList = await SellerService.getAllSellers();
        setSellers(sellersList || []);
        const skuFamiliesList = await ProductService.getSkuFamilyListByName();
        setSkuFamilies(skuFamiliesList || []);
        // Fetch costs by country (stored for potential future use)
        // const costResponse = await CostModuleService.getCostsByCountry();
        // if (costResponse.status === 200 && costResponse.data) {
        //   // Costs can be used for product cost calculations if needed
        // }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N to add row
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        addRow();
      }
      // Delete key to remove row if focused
      if (e.key === 'Delete' && focusedCell) {
        const cell = cellRefs.current[`${focusedCell.row}-${focusedCell.col}`];
        if (cell && 'value' in cell) {
          updateRow(focusedCell.row, focusedCell.col as keyof ProductRowData, '');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedCell, rows.length]);

  // Auto-calculate delivery location and currency conversions
  useEffect(() => {
    setRows(prevRows => prevRows.map(row => {
      const updatedRow = { ...row };
      
      // Auto-calculate delivery location
      const locations: string[] = [];
      if (row.currentLocation === 'Hong Kong' || row.hkUsd || row.hkHkd) {
        locations.push('Hong Kong');
      }
      if (row.currentLocation === 'Dubai' || row.dubaiUsd || row.dubaiAed) {
        locations.push('Dubai');
      }
      updatedRow.deliveryLocation = locations.join(',');
      
      return updatedRow;
    }));
  }, [rows.map(r => `${r.currentLocation}-${r.hkUsd}-${r.hkHkd}-${r.dubaiUsd}-${r.dubaiAed}`).join(',')]);

  const updateRow = (index: number, field: keyof ProductRowData, value: any) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      newRows[index] = { ...newRows[index], [field]: value };
      
      // Auto-calculate currency conversions for HK
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
      
      // Auto-calculate currency conversions for Dubai
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

  const addRow = () => {
    setRows(prevRows => [...prevRows, createEmptyRow(prevRows.length)]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(prevRows => prevRows.filter((_, i) => i !== index));
    }
  };

  const duplicateRow = (index: number) => {
    setRows(prevRows => {
      const newRow = { ...prevRows[index], sequence: prevRows.length + 1 };
      // Clear unique fields
      newRow.uniqueListingNo = '';
      newRow.supplierListingNumber = '';
      return [...prevRows, newRow];
    });
  };

  const fillDown = (rowIndex: number, columnKey: string) => {
    if (rowIndex === rows.length - 1) return;
    const value = rows[rowIndex][columnKey as keyof ProductRowData];
    updateRow(rowIndex + 1, columnKey as keyof ProductRowData, value);
  };

  const fillAllBelow = (rowIndex: number, columnKey: string) => {
    const value = rows[rowIndex][columnKey as keyof ProductRowData];
    setRows(prevRows => prevRows.map((row, idx) => 
      idx > rowIndex ? { ...row, [columnKey]: value } : row
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const errors: string[] = [];
      rows.forEach((row, index) => {
        if (!row.skuFamilyId) errors.push(`Row ${index + 1}: SKU Family is required`);
        if (!row.subModelName) errors.push(`Row ${index + 1}: SubModelName is required`);
        if (!row.storage) errors.push(`Row ${index + 1}: Storage is required`);
        if (!row.colour) errors.push(`Row ${index + 1}: Colour is required`);
        if (!row.country) errors.push(`Row ${index + 1}: Country is required`);
        if (!row.sim) errors.push(`Row ${index + 1}: SIM is required`);
        if (!row.grade) errors.push(`Row ${index + 1}: GRADE is required`);
        if (!row.status) errors.push(`Row ${index + 1}: STATUS is required`);
        if (!row.lockUnlock) errors.push(`Row ${index + 1}: LOCK/UNLOCK is required`);
        if (!row.packing) errors.push(`Row ${index + 1}: PACKING is required`);
        if (!row.currentLocation) errors.push(`Row ${index + 1}: CURRENT LOCATION is required`);
        if (!row.totalQty) errors.push(`Row ${index + 1}: TOTAL QTY is required`);
        if (!row.moqPerVariant) errors.push(`Row ${index + 1}: MOQ/VARIANT is required`);
        if (!row.supplierId) errors.push(`Row ${index + 1}: SUPPLIER ID is required`);
        if (!row.supplierListingNumber) errors.push(`Row ${index + 1}: SUPPLIER LISTING NO is required`);
      });

    if (errors.length > 0) {
      // Use a better error display
      const errorMessage = `Please fix the following ${errors.length} error(s):\n\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n\n... and ${errors.length - 10} more errors` : ''}`;
      if (window.confirm(errorMessage + '\n\nDo you want to continue anyway?')) {
        // User wants to continue despite errors
      } else {
        return;
      }
    }

    const rowsWithListingNos = rows.map((row, index) => ({
      ...row,
      uniqueListingNo: row.uniqueListingNo || `LIST-${Date.now()}-${index}`,
    }));
    onSave(rowsWithListingNos);
  };

  // Column definitions
  const columns = [
    { key: 'skuFamilyId', label: 'SKU Family*', width: 150, group: 'Product Detail' },
    { key: 'subModelName', label: 'SubModelName*', width: 150, group: 'Product Detail' },
    { key: 'storage', label: 'Storage*', width: 100, group: 'Product Detail' },
    { key: 'colour', label: 'Colour*', width: 100, group: 'Product Detail' },
    { key: 'country', label: 'Country*', width: 120, group: 'Product Detail' },
    { key: 'sim', label: 'SIM*', width: 120, group: 'Product Detail' },
    { key: 'version', label: 'VERSION', width: 120, group: 'Product Detail' },
    { key: 'grade', label: 'GRADE*', width: 120, group: 'Product Detail' },
    { key: 'status', label: 'STATUS*', width: 100, group: 'Product Detail' },
    { key: 'condition', label: 'CONDITION', width: 120, group: 'Product Detail' },
    { key: 'lockUnlock', label: 'LOCK/UNLOCK*', width: 120, group: 'Product Detail' },
    { key: 'warranty', label: 'WARRANTY', width: 120, group: 'Product Detail' },
    { key: 'batteryHealth', label: 'BATTERY HEALTH', width: 130, group: 'Product Detail' },
    { key: 'packing', label: 'PACKING*', width: 120, group: 'Pricing/Delivery' },
    { key: 'currentLocation', label: 'CURRENT LOCATION*', width: 150, group: 'Pricing/Delivery' },
    { key: 'hkUsd', label: 'HK USD', width: 100, group: 'Pricing/Delivery' },
    { key: 'hkXe', label: 'HK XE', width: 100, group: 'Pricing/Delivery' },
    { key: 'hkHkd', label: 'HK HKD', width: 100, group: 'Pricing/Delivery' },
    { key: 'dubaiUsd', label: 'DUBAI USD', width: 110, group: 'Pricing/Delivery' },
    { key: 'dubaiXe', label: 'DUBAI XE', width: 110, group: 'Pricing/Delivery' },
    { key: 'dubaiAed', label: 'DUBAI AED', width: 110, group: 'Pricing/Delivery' },
    { key: 'deliveryLocation', label: 'DELIVERY LOCATION', width: 150, group: 'Pricing/Delivery' },
    { key: 'customMessage', label: 'CUSTOM MESSAGE', width: 150, group: 'Pricing/Delivery' },
    { key: 'totalQty', label: 'TOTAL QTY*', width: 100, group: 'Pricing/Delivery' },
    { key: 'moqPerVariant', label: 'MOQ/VARIANT*', width: 120, group: 'Pricing/Delivery' },
    { key: 'moqPerCart', label: 'MOQ PER CART', width: 120, group: 'Pricing/Delivery' },
    { key: 'weight', label: 'WEIGHT', width: 100, group: 'Pricing/Delivery' },
    { key: 'paymentTerm', label: 'PAYMENT TERM', width: 130, group: 'Pricing/Delivery' },
    { key: 'paymentMethod', label: 'PAYMENT METHOD', width: 150, group: 'Pricing/Delivery' },
    { key: 'negotiableFixed', label: 'NEGOTIABLE/FIXED', width: 150, group: 'Other Info' },
    { key: 'shippingTime', label: 'SHIPPING TIME', width: 130, group: 'Other Info' },
    { key: 'deliveryTime', label: 'DELIVERY TIME', width: 130, group: 'Other Info' },
    { key: 'vendor', label: 'VENDOR', width: 100, group: 'Other Info' },
    { key: 'vendorListingNo', label: 'VENDOR LISTING NO', width: 150, group: 'Other Info' },
    { key: 'carrier', label: 'CARRIER', width: 100, group: 'Other Info' },
    { key: 'carrierListingNo', label: 'CARRIER LISTING NO', width: 150, group: 'Other Info' },
    { key: 'uniqueListingNo', label: 'UNIQUE LISTING NO', width: 150, group: 'Other Info' },
    { key: 'hotDeal', label: 'HOT DEAL', width: 100, group: 'Other Info' },
    { key: 'lowStock', label: 'LOW STOCK', width: 100, group: 'Other Info' },
    { key: 'adminCustomMessage', label: 'ADMIN CUSTOM MESSAGE', width: 180, group: 'Other Info' },
    { key: 'startTime', label: 'START TIME', width: 150, group: 'Other Info' },
    { key: 'endTime', label: 'END TIME', width: 150, group: 'Other Info' },
    { key: 'supplierId', label: 'SUPPLIER ID*', width: 130, group: 'Other Info' },
    { key: 'supplierListingNumber', label: 'SUPPLIER LISTING NO*', width: 180, group: 'Other Info' },
    { key: 'remark', label: 'REMARK', width: 150, group: 'Other Info' },
  ];

  const countryOptions = ['Hong Kong', 'Dubai'];
  const simOptions = ['Dual SIM', 'E-SIM', 'Physical Sim'];
  const statusOptions = ['Active', 'Non Active', 'pre owned'];
  const conditionOptions = ['AAA', 'A+', 'Mixed'];
  const lockUnlockOptions = [{ value: '1', label: 'Lock' }, { value: '0', label: 'Unlock' }];
  const packingOptions = ['sealed', 'open sealed', 'master cartoon'];
  const paymentTermOptions = ['on order', 'on delivery', 'as in conformation'];
  const paymentMethodOptions = ['hkd cash / aed cash', 'usd cash /tt', 'as in conformation'];
  const negotiableFixedOptions = [{ value: '1', label: 'Negotiable' }, { value: '0', label: 'Fixed' }];
  const vendorOptions = ['att', 'tmobile'];
  const carrierOptions = ['tmob', 'mixed'];

  const renderCell = (row: ProductRowData, rowIndex: number, column: typeof columns[0]) => {
    const value = row[column.key as keyof ProductRowData];
    const cellId = `${rowIndex}-${column.key}`;

    switch (column.key) {
      case 'skuFamilyId':
        if (variantType === 'multi') {
          return (
            <div className="relative">
              <input
                type="text"
                value={value as string}
                className="w-full px-2 py-1.5 text-xs border-0 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400 italic"
                readOnly
                disabled
              />
              <i className="fas fa-lock absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs"></i>
            </div>
          );
        }
        return (
          <div className="min-w-[150px]" onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}>
            <Select
              options={skuFamilies.map(sku => ({ value: sku._id, label: sku.name }))}
              value={skuFamilies.find(sku => sku._id === value) ? { value: value as string, label: skuFamilies.find(sku => sku._id === value)?.name } : null}
              onChange={(opt) => updateRow(rowIndex, column.key as keyof ProductRowData, opt?.value || '')}
              className="text-xs"
              classNamePrefix="select"
              isSearchable
              placeholder="Select SKU Family"
              styles={{
                control: (provided, state) => ({ 
                  ...provided, 
                  minHeight: '32px', 
                  fontSize: '12px', 
                  border: 'none', 
                  boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                  backgroundColor: 'transparent',
                  '&:hover': { border: 'none' }
                }),
                valueContainer: (provided) => ({ ...provided, padding: '4px 8px' }),
                input: (provided) => ({ ...provided, margin: '0', padding: '0' }),
                indicatorsContainer: (provided) => ({ ...provided, height: '32px' }),
                menu: (provided) => ({ ...provided, zIndex: 9999, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }),
              }}
            />
          </div>
        );

      case 'subModelName':
      case 'storage':
      case 'colour':
        return (
          <input
            ref={(el) => { cellRefs.current[cellId] = el; }}
            type="text"
            value={value as string}
            onChange={(e) => updateRow(rowIndex, column.key as keyof ProductRowData, e.target.value)}
            className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-all duration-150 placeholder:text-gray-400"
            required={column.key === 'subModelName' || column.key === 'storage' || column.key === 'colour'}
            disabled={variantType === 'multi' && (column.key === 'subModelName' || column.key === 'storage' || column.key === 'colour')}
            onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}
            placeholder={variantType === 'multi' ? 'Auto-filled' : 'Enter value'}
          />
        );

      case 'country':
        return (
          <select
            value={value as string}
            onChange={(e) => updateRow(rowIndex, column.key as keyof ProductRowData, e.target.value)}
            className="w-full px-2 py-1.5 text-xs border-0 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-all duration-150 cursor-pointer appearance-none"
            required
            onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}
          >
            <option value="" className="text-gray-500">Select Country</option>
            {countryOptions.map(opt => <option key={opt} value={opt} className="bg-white dark:bg-gray-800">{opt}</option>)}
          </select>
        );

      case 'sim':
        return (
          <select
            value={value as string}
            onChange={(e) => updateRow(rowIndex, column.key as keyof ProductRowData, e.target.value)}
            className="w-full px-2 py-1.5 text-xs border-0 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-all duration-150 cursor-pointer appearance-none"
            required
            onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}
          >
            <option value="" className="text-gray-500">Select SIM</option>
            {simOptions.map(opt => <option key={opt} value={opt} className="bg-white dark:bg-gray-800">{opt}</option>)}
          </select>
        );

      case 'grade':
        return (
          <div className="min-w-[120px]" onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}>
            <Select
              options={grades.map(g => ({ value: g._id, label: g.title }))}
              value={grades.find(g => g._id === value) ? { value: value as string, label: grades.find(g => g._id === value)?.title } : null}
              onChange={(opt) => updateRow(rowIndex, column.key as keyof ProductRowData, opt?.value || '')}
              className="text-xs"
              classNamePrefix="select"
              isSearchable
              placeholder="Select Grade"
              styles={{
                control: (provided, state) => ({ 
                  ...provided, 
                  minHeight: '32px', 
                  fontSize: '12px', 
                  border: 'none', 
                  boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                  backgroundColor: 'transparent',
                  '&:hover': { border: 'none' }
                }),
                valueContainer: (provided) => ({ ...provided, padding: '4px 8px' }),
                input: (provided) => ({ ...provided, margin: '0', padding: '0' }),
                indicatorsContainer: (provided) => ({ ...provided, height: '32px' }),
                menu: (provided) => ({ ...provided, zIndex: 9999, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }),
              }}
            />
          </div>
        );

      case 'status':
        return (
          <select
            value={value as string}
            onChange={(e) => updateRow(rowIndex, column.key as keyof ProductRowData, e.target.value)}
            className="w-full px-2 py-1.5 text-xs border-0 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-all duration-150 cursor-pointer appearance-none"
            required
            onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}
          >
            {statusOptions.map(opt => <option key={opt} value={opt} className="bg-white dark:bg-gray-800">{opt}</option>)}
          </select>
        );

      case 'condition':
        return (
          <select
            value={value as string}
            onChange={(e) => updateRow(rowIndex, column.key as keyof ProductRowData, e.target.value)}
            className="w-full px-2 py-1.5 text-xs border-0 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-all duration-150 cursor-pointer appearance-none"
            onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}
          >
            <option value="" className="bg-white dark:bg-gray-800">Select Condition</option>
            {conditionOptions.map(opt => <option key={opt} value={opt} className="bg-white dark:bg-gray-800">{opt}</option>)}
          </select>
        );

      case 'lockUnlock':
      case 'negotiableFixed':
        const options = column.key === 'lockUnlock' ? lockUnlockOptions : negotiableFixedOptions;
        return (
          <select
            value={value as string}
            onChange={(e) => updateRow(rowIndex, column.key as keyof ProductRowData, e.target.value)}
            className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
            required={column.key === 'lockUnlock'}
            onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}
          >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        );

      case 'packing':
      case 'paymentTerm':
      case 'paymentMethod':
      case 'vendor':
      case 'carrier':
        const selectOptions = 
          column.key === 'packing' ? packingOptions :
          column.key === 'paymentTerm' ? paymentTermOptions :
          column.key === 'paymentMethod' ? paymentMethodOptions :
          column.key === 'vendor' ? vendorOptions : carrierOptions;
        return (
          <select
            value={value as string}
            onChange={(e) => updateRow(rowIndex, column.key as keyof ProductRowData, e.target.value)}
            className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
            required={column.key === 'packing' || (['currentLocation'].includes(column.key) as any)}
            onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}
          >
            <option value="">Select</option>
            {selectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );

      case 'currentLocation':
        return (
          <select
            value={value as string}
            onChange={(e) => updateRow(rowIndex, column.key as keyof ProductRowData, e.target.value)}
            className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}
          >
            <option value="">Select</option>
            {countryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );

      case 'hkUsd':
      case 'hkXe':
      case 'hkHkd':
      case 'dubaiUsd':
      case 'dubaiXe':
      case 'dubaiAed':
      case 'totalQty':
      case 'moqPerVariant':
      case 'moqPerCart':
      case 'weight':
        return (
          <input
            type="number"
            step={column.key.includes('Xe') || column.key.includes('XE') ? '0.000001' : '0.01'}
            value={value as string | number}
            onChange={(e) => updateRow(rowIndex, column.key as keyof ProductRowData, e.target.value)}
            className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-all duration-150 text-right font-medium placeholder:text-gray-400"
            placeholder="0.00"
            disabled={column.key === 'moqPerCart' && variantType === 'single'}
            onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}
          />
        );

      case 'deliveryLocation':
        return (
          <div className="relative">
            <input
              type="text"
              value={value as string}
              className="w-full px-2 py-1.5 text-xs border-0 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400 italic"
              readOnly
              placeholder="Auto-generated"
            />
            <i className="fas fa-magic absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs"></i>
          </div>
        );

      case 'startTime':
      case 'endTime':
        return (
          <DatePicker
            selected={value ? new Date(value as string) : null}
            onChange={(date) => updateRow(rowIndex, column.key as keyof ProductRowData, date ? date.toISOString() : '')}
            showTimeSelect
            timeFormat="HH:mm"
            dateFormat="yyyy-MM-dd HH:mm"
            className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-all duration-150 placeholder:text-gray-400"
            placeholderText="Select date & time"
            onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}
            wrapperClassName="w-full"
          />
        );

      case 'supplierId':
        return (
          <div className="min-w-[130px]" onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}>
            <Select
              options={sellers.map(s => ({ value: s._id, label: `${s.name}${s.code ? ` (${s.code})` : ''}` }))}
              value={sellers.find(s => s._id === value) ? { value: value as string, label: sellers.find(s => s._id === value)?.name } : null}
              onChange={(opt) => updateRow(rowIndex, column.key as keyof ProductRowData, opt?.value || '')}
              className="text-xs"
              classNamePrefix="select"
              isSearchable
              placeholder="Select Supplier"
              styles={{
                control: (provided, state) => ({ 
                  ...provided, 
                  minHeight: '32px', 
                  fontSize: '12px', 
                  border: 'none', 
                  boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                  backgroundColor: 'transparent',
                  '&:hover': { border: 'none' }
                }),
                valueContainer: (provided) => ({ ...provided, padding: '4px 8px' }),
                input: (provided) => ({ ...provided, margin: '0', padding: '0' }),
                indicatorsContainer: (provided) => ({ ...provided, height: '32px' }),
                menu: (provided) => ({ ...provided, zIndex: 9999, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }),
              }}
            />
          </div>
        );

      case 'uniqueListingNo':
        return (
          <div className="relative">
            <input
              type="text"
              value={value as string}
              className="w-full px-2 py-1.5 text-xs border-0 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400 italic"
              readOnly
              placeholder="Auto-generated"
            />
            <i className="fas fa-barcode absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs"></i>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => updateRow(rowIndex, column.key as keyof ProductRowData, e.target.value)}
            className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-all duration-150 placeholder:text-gray-400"
            required={column.key === 'supplierListingNumber'}
            onFocus={() => setFocusedCell({ row: rowIndex, col: column.key })}
            placeholder={column.key.includes('message') || column.key.includes('Message') ? 'Enter message...' : 'Enter value...'}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-spinner text-blue-600 dark:text-blue-400 text-lg animate-spin"></i>
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">Loading form data...</p>
      </div>
    );
  }

  // Group columns by their group
  const groupedColumns = columns.reduce((acc, col) => {
    if (!acc[col.group]) acc[col.group] = [];
    acc[col.group].push(col);
    return acc;
  }, {} as Record<string, typeof columns>);

  const totalWidth = columns.reduce((sum, col) => sum + col.width + 1, 0);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Enhanced Toolbar */}
      <div className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700 px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addRow}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              title="Add Row (Ctrl+N or Cmd+N)"
            >
              <i className="fas fa-plus text-sm"></i>
              <span>Add Row</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (rows.length > 0) {
                  duplicateRow(rows.length - 1);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              title="Duplicate Last Row"
            >
              <i className="fas fa-copy text-sm"></i>
              <span>Duplicate</span>
            </button>
          </div>
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <i className="fas fa-table text-blue-500 text-sm"></i>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {rows.length} {rows.length === 1 ? 'Row' : 'Rows'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <i className="fas fa-columns text-purple-500 text-sm"></i>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {columns.length} Columns
              </span>
            </div>
            {variantType === 'multi' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg border border-purple-300 dark:border-purple-700 shadow-sm">
                <i className="fas fa-layer-group text-purple-600 dark:text-purple-400 text-sm"></i>
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                  Multi-Variant Mode
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <i className="fas fa-times mr-2"></i>
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
          >
            <i className="fas fa-save text-sm"></i>
            <span>Save All Products</span>
            <span className="ml-1 px-2 py-0.5 bg-blue-500 rounded-full text-xs font-bold">
              {rows.length}
            </span>
          </button>
        </div>
      </div>

      {/* Excel-like Table with Enhanced Styling */}
      <div 
        ref={tableRef}
        className="flex-1 overflow-auto bg-white dark:bg-gray-900 relative"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {/* Scroll Shadow Indicators */}
        <div className="absolute top-0 right-0 w-8 h-full bg-gray-100 dark:bg-gray-800 pointer-events-none z-10 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gray-100 dark:bg-gray-800 pointer-events-none z-10 opacity-50"></div>
        <div style={{ width: `${totalWidth}px`, minWidth: '100%' }}>
          {/* Enhanced Column Headers with Groups */}
          <div className="sticky top-0 z-10 shadow-lg">
            {/* Group Headers with Better Styling */}
            <div className="flex border-b-2 border-gray-400 dark:border-gray-600">
              <div className="min-w-12 border-r-2 border-gray-400 dark:border-gray-600 bg-gray-300 dark:bg-gray-800 sticky left-0 z-10"></div>
              {Object.entries(groupedColumns).map(([groupName, cols], idx) => {
                const totalWidth = cols.reduce((sum, c) => sum + c.width, 0);
                const colors = [
                  'bg-yellow-500 dark:bg-yellow-700',
                  'bg-green-500 dark:bg-green-700',
                  'bg-purple-500 dark:bg-purple-700',
                ];
                return (
                  <div
                    key={groupName}
                    className={`${colors[idx % colors.length]} px-3 py-2 text-xs font-bold text-white text-center border-r-2 border-gray-400 dark:border-gray-600 shadow-inner`}
                    style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px` }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <i className={`fas ${idx === 0 ? 'fa-box' : idx === 1 ? 'fa-dollar-sign' : 'fa-info-circle'} text-xs`}></i>
                      <span>{groupName}</span>
                      <span className="bg-white/30 dark:bg-black/30 px-1.5 py-0.5 rounded text-xs">
                        {cols.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Column Headers with Better Styling */}
            <div className="flex border-b-2 border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-800">
              <div className="min-w-12 border-r-2 border-gray-400 dark:border-gray-600 bg-gray-400 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-800 dark:text-gray-200 sticky left-0 z-10 shadow-md">
                <i className="fas fa-hashtag mr-1"></i>
                #
              </div>
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="px-3 py-3 text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 whitespace-nowrap hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors cursor-default"
                  style={{ width: `${col.width}px`, minWidth: `${col.width}px` }}
                  title={col.label}
                >
                  <div className="flex items-center gap-1">
                    {col.label.includes('*') && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                    <span className="truncate">{col.label.replace('*', '')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Rows */}
          <div>
            {rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={`flex border-b border-gray-200 dark:border-gray-700 transition-all duration-150 ${
                  rowIndex % 2 === 0 
                    ? 'bg-white dark:bg-gray-900' 
                    : 'bg-gray-50/50 dark:bg-gray-800/30'
                } ${
                  focusedCell?.row === rowIndex
                    ? 'bg-blue-50 dark:bg-blue-900/20 shadow-inner'
                    : 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                }`}
              >
                {/* Enhanced Row Number */}
                <div className="min-w-12 border-r-2 border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 sticky left-0 z-5 shadow-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-bold shadow-md">
                      {rowIndex + 1}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateRow(rowIndex)}
                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Duplicate Row"
                      >
                        <i className="fas fa-copy text-xs"></i>
                      </button>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(rowIndex)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete Row"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Cells */}
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={`px-0 py-1.5 border-r border-gray-200 dark:border-gray-700 relative group transition-all duration-150 ${
                      focusedCell?.row === rowIndex && focusedCell?.col === col.key
                        ? 'ring-2 ring-blue-500 ring-offset-1 z-10 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                    style={{ width: `${col.width}px`, minWidth: `${col.width}px` }}
                    onDoubleClick={() => fillAllBelow(rowIndex, col.key)}
                    title="Double-click to fill all below"
                  >
                    <div className="px-2">
                      {renderCell(row, rowIndex, col)}
                    </div>
                    {rowIndex < rows.length - 1 && focusedCell?.row === rowIndex && focusedCell?.col === col.key && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fillDown(rowIndex, col.key);
                        }}
                        className="absolute bottom-1 right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded-lg shadow-lg hover:bg-blue-700 z-20 transform hover:scale-110 transition-all duration-200 flex items-center gap-1"
                        title="Fill Down (Ctrl+D)"
                      >
                        <i className="fas fa-arrow-down text-xs"></i>
                        <span className="text-xs font-medium">Fill</span>
                      </button>
                    )}
                    {/* Hover indicator */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-300 dark:group-hover:border-blue-700 rounded pointer-events-none transition-all duration-150"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
};

export default ExcelLikeProductForm;

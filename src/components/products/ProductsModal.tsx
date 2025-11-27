import React, { useState, useEffect } from "react";
import {
  ProductService,
  Product,
} from "../../services/product/product.services";
import { ProductCategoryService } from "../../services/productCategory/productCategory.services";
import { BrandService } from "../../services/brand/brand.services";
import { GradeService } from "../../services/grade/grade.services";
import { CostModuleService } from "../../services/costModule/costModule.services";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select';

interface CountryDeliverable {
  country: string;
  price: number | string;
  charges: Array<{
    name: string;
    value: number | string;
  }>;
}

interface FormData {
  skuFamilyId: string;
  subSkuFamilyId: string;
  productcategoriesId: string;
  brandId: string;
  gradeId: string;
  simType: string;
  color: string;
  ram: string;
  storage: string;
  condition: string;
  price: number | string;
  stock: number | string;
  country: string;
  moq: number | string;
  purchaseType: string; // 'full' | 'partial'
  isNegotiable: boolean;
  isFlashDeal: string;
  startTime: string; // ISO string (e.g., "2025-10-30T03:30:00.000Z")
  expiryTime: string; // ISO string (e.g., "2025-10-30T03:30:00.000Z")
  groupCode: string;
  countryDeliverables: CountryDeliverable[];
}

interface ValidationErrors {
  skuFamilyId?: string;
  subSkuFamilyId?: string;
  productcategoriesId?: string;
  brandId?: string;
  gradeId?: string;
  simType?: string;
  color?: string;
  ram?: string;
  storage?: string;
  condition?: string;
  price?: string;
  stock?: string;
  country?: string;
  moq?: string;
  purchaseType?: string;
  startTime?: string;
  expiryTime?: string;
  isNegotiable?: string;
  isFlashDeal?: string;
  [key: string]: string | undefined;
}

interface TouchedFields {
  skuFamilyId: boolean;
  subSkuFamilyId: boolean;
  simType: boolean;
  color: boolean;
  ram: boolean;
  storage: boolean;
  condition: boolean;
  price: boolean;
  stock: boolean;
  country: boolean;
  moq: boolean;
  purchaseType: boolean;
  startTime: boolean;
  expiryTime: boolean;
  isNegotiable: boolean;
  isFlashDeal: boolean;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: FormData) => void;
  editItem?: Product;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
}) => {
  const [formData, setFormData] = useState<FormData>({
    skuFamilyId: "",
    subSkuFamilyId: "",
    productcategoriesId: "",
    brandId: "",
    gradeId: "",
    simType: "",
    color: "",
    ram: "",
    storage: "",
    condition: "",
    price: 0,
    stock: 0,
    country: "",
    moq: 0,
    purchaseType: "partial",
    isNegotiable: false,
    isFlashDeal: "false",
    startTime: "",
    expiryTime: "",
    groupCode: "",
    countryDeliverables: [],
  });
  const [costsByCountry, setCostsByCountry] = useState<Record<string, Array<{ _id: string; name: string; costType: string; value: number }>>>({});
  const [skuFamilies, setSkuFamilies] = useState<
    { _id: string; name: string }[]
  >([]);
  const [subSkuFamilies, setSubSkuFamilies] = useState<
    { _id: string; name: string }[]
  >([]);
  const [productCategories, setProductCategories] = useState<
    { _id?: string; title: string }[]
  >([]);
  const [brands, setBrands] = useState<
    { _id?: string; title: string }[]
  >([]);
  const [grades, setGrades] = useState<
    { _id?: string; title: string; brand?: string | { _id?: string; title: string; code?: string } }[]
  >([]);
  const [skuLoading, setSkuLoading] = useState<boolean>(false);
  const [subSkuLoading, setSubSkuLoading] = useState<boolean>(false);
  const [productCategoryLoading, setProductCategoryLoading] = useState<boolean>(false);
  const [brandLoading, setBrandLoading] = useState<boolean>(false);
  const [gradeLoading, setGradeLoading] = useState<boolean>(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [subSkuError, setSubSkuError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [moqError, setMoqError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touched, setTouched] = useState<TouchedFields>({
    skuFamilyId: false,
    subSkuFamilyId: false,
    simType: false,
    color: false,
    ram: false,
    storage: false,
    condition: false,
    price: false,
    stock: false,
    country: false,
    moq: false,
    purchaseType: false,
    startTime: false,
    expiryTime: false,
    isNegotiable: false,
    isFlashDeal: false,
  });

  const colorOptions = ["Graphite", "Silver", "Gold", "Sierra Blue", "Mixed"];
  const countryOptions = ["Hongkong", "Dubai", "Singapore"];
  const simOptions = ["E-Sim", "Physical Sim"];

  // Fetch costs by country when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCostsByCountry();
    }
  }, [isOpen]);

  const fetchCostsByCountry = async () => {
    try {
      const response = await CostModuleService.getCostsByCountry();
      if (response.status === 200 && response.data) {
        setCostsByCountry(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch costs:", error);
    }
  };
  const ramOptions = ["4GB", "6GB", "8GB", "16GB", "32GB"];
  const storageOptions = ["128GB", "256GB", "512GB", "1TB"];
  const conditionOptions = ["AAA", "A+", "Mixed"];

  // Function to parse Sub SKU Family response and extract values
  const parseSubSkuFamilyResponse = (response: string) => {
    try {
      const parts = response.split('_');
      
      if (parts.length < 6) {
        console.warn('Unexpected Sub SKU Family format:', response);
        return null;
      }

      const firstName = parts[0];
      const color = parts[2];
      const simTypeRaw = parts[3];
      const country = parts[5];
      
      const simTypeMatch = simTypeRaw.match(/\["([^"]+)"\]/);
      const simType = simTypeMatch ? simTypeMatch[1] : simTypeRaw;

      return {
        displayName: firstName,
        color: color,
        simType: simType,
        country: country
      };
    } catch (error) {
      console.error('Error parsing Sub SKU Family response:', error);
      return null;
    }
  };

  const fetchSubSkuFamiliesBySkuFamilyId = async (skuFamilyId: string) => {
    try {
      setSubSkuLoading(true);
      setSubSkuError(null);
      console.log("Fetching Sub SKU Families for SKU Family ID:", skuFamilyId);
      const list = await ProductService.getSubSkuFamilyListByName(skuFamilyId);
      console.log("Received Sub SKU Families:", list);
      setSubSkuFamilies(list);
    } catch (error: any) {
      console.error("Error fetching Sub SKU Families:", error);
      setSubSkuError(error.message || "Failed to load Sub SKU Families");
    } finally {
      setSubSkuLoading(false);
    }
  };

  // Handle SKU Family selection for react-select
  const handleSkuFamilyChange = (selectedOption: any) => {
    const value = selectedOption?.value || '';
    setFormData(prev => {
      const next = { ...prev, skuFamilyId: value } as FormData;
      
      // Clear Sub SKU Family selection when SKU Family changes
      next.subSkuFamilyId = "";
      next.color = "";
      next.simType = "";
      next.country = "";
      
      if (value) {
        fetchSubSkuFamiliesBySkuFamilyId(value);
      }
      
      return next;
    });
    
    // Validate
    if (touched.skuFamilyId) {
      const error = validateField("skuFamilyId", value);
      setValidationErrors(prev => ({ ...prev, skuFamilyId: error }));
    }
  };

  // Handle Sub SKU Family selection for react-select
  const handleSubSkuFamilyChange = (selectedOption: any) => {
    const value = selectedOption?.value || '';
    setFormData(prev => {
      const next = { ...prev, subSkuFamilyId: value } as FormData;
      
      if (value) {
        const selectedSubSku = subSkuFamilies.find(subSku => subSku._id === value);
        if (selectedSubSku) {
          const parsedData = parseSubSkuFamilyResponse(selectedSubSku.name);
          if (parsedData) {
            next.color = parsedData.color;
            next.simType = parsedData.simType;
            next.country = parsedData.country;
          }
        }
      }
      
      return next;
    });
    
    // Validate
    if (touched.subSkuFamilyId) {
      const error = validateField("subSkuFamilyId", value);
      setValidationErrors(prev => ({ ...prev, subSkuFamilyId: error }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      const fetchSkuFamilies = async () => {
        try {
          setSkuLoading(true);
          setSkuError(null);
          const list = await ProductService.getSkuFamilyListByName();
          setSkuFamilies(list);
        } catch (error: any) {
          setSkuError(error.message || "Failed to load SKU Families");
        } finally {
          setSkuLoading(false);
        }
      };

      const fetchProductCategories = async () => {
        try {
          setProductCategoryLoading(true);
          const response = await ProductCategoryService.getProductCategoryList(1, 1000);
          const categories = (response.data.docs || []).filter((cat: any) => cat && cat._id && cat.title && typeof cat.title === 'string');
          setProductCategories(categories);
        } catch (error: any) {
          console.error("Failed to load Product Categories:", error);
        } finally {
          setProductCategoryLoading(false);
        }
      };

      const fetchBrands = async () => {
        try {
          setBrandLoading(true);
          const response = await BrandService.getBrandList(1, 1000);
          const brandsList = (response.data.docs || []).filter((brand: any) => brand && brand._id && brand.title && typeof brand.title === 'string');
          setBrands(brandsList);
        } catch (error: any) {
          console.error("Failed to load Brands:", error);
        } finally {
          setBrandLoading(false);
        }
      };

      const fetchGrades = async () => {
        try {
          setGradeLoading(true);
          const response = await GradeService.getGradeList(1, 1000);
          const gradesList = (response.data.docs || []).filter((grade: any) => grade && grade._id && grade.title && typeof grade.title === 'string');
          setGrades(gradesList);
        } catch (error: any) {
          console.error("Failed to load Grades:", error);
        } finally {
          setGradeLoading(false);
        }
      };

      fetchSkuFamilies();
      fetchProductCategories();
      fetchBrands();
      fetchGrades();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        const skuId =
          typeof editItem.skuFamilyId === "object"
            ? editItem.skuFamilyId._id || ""
            : editItem.skuFamilyId || "";
        const subSkuId =
          typeof editItem.subSkuFamilyId === "object"
            ? editItem.subSkuFamilyId._id || ""
            : editItem.subSkuFamilyId || "";
        const productCategoryId =
          typeof (editItem as any).productcategoriesId === "object"
            ? (editItem as any).productcategoriesId?._id || ""
            : (editItem as any).productcategoriesId || "";
        const brandId =
          typeof (editItem as any).brandId === "object"
            ? (editItem as any).brandId?._id || ""
            : (editItem as any).brandId || "";
        const gradeId =
          typeof (editItem as any).gradeId === "object"
            ? (editItem as any).gradeId?._id || ""
            : (editItem as any).gradeId || "";
        setFormData({
          skuFamilyId: skuId,
          subSkuFamilyId: subSkuId,
          productcategoriesId: productCategoryId,
          brandId: brandId,
          gradeId: gradeId,
          simType: editItem.simType,
          color: editItem.color,
          ram: editItem.ram,
          storage: editItem.storage,
          condition: editItem.condition,
          price: editItem.price,
          stock: editItem.stock,
          country: editItem.country,
          moq: editItem.moq,
          purchaseType: (editItem as any).purchaseType || "partial",
          isNegotiable: editItem.isNegotiable,
          isFlashDeal: `${(editItem as any).isFlashDeal ?? false}`,
          startTime: (editItem as any).startTime || "",
          expiryTime: editItem.expiryTime || "",
          groupCode: (editItem as any).groupCode || "",
          countryDeliverables: (editItem as any).countryDeliverables || [],
        });
        
        // If editing, fetch sub SKUs if SKU family is selected
        if (skuId) {
          fetchSubSkuFamiliesBySkuFamilyId(skuId);
        }
      } else {
        setFormData({
          skuFamilyId: "",
          subSkuFamilyId: "",
          productcategoriesId: "",
          brandId: "",
          gradeId: "",
          simType: "",
          color: "",
          ram: "",
          storage: "",
          condition: "",
          price: 0,
          stock: 0,
          country: "",
          moq: 0,
    purchaseType: "partial",
    isNegotiable: false,
    isFlashDeal: "false",
    startTime: "",
    expiryTime: "",
    groupCode: "",
    countryDeliverables: [],
  });
      }
      setDateError(null);
      setPriceError(null);
    }
  }, [isOpen, editItem]);

  // Handlers for countryDeliverables
  const addCountryDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      countryDeliverables: [
        ...prev.countryDeliverables,
        { country: "", price: 0, charges: [] }
      ]
    }));
  };

  const removeCountryDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      countryDeliverables: prev.countryDeliverables.filter((_, i) => i !== index)
    }));
  };

  const updateCountryDeliverable = (index: number, field: keyof CountryDeliverable, value: any) => {
    setFormData(prev => ({
      ...prev,
      countryDeliverables: prev.countryDeliverables.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addChargeToCountry = (countryIndex: number) => {
    setFormData(prev => ({
      ...prev,
      countryDeliverables: prev.countryDeliverables.map((item, i) =>
        i === countryIndex
          ? { ...item, charges: [...item.charges, { name: "", value: 0 }] }
          : item
      )
    }));
  };

  const removeChargeFromCountry = (countryIndex: number, chargeIndex: number) => {
    setFormData(prev => ({
      ...prev,
      countryDeliverables: prev.countryDeliverables.map((item, i) =>
        i === countryIndex
          ? { ...item, charges: item.charges.filter((_, ci) => ci !== chargeIndex) }
          : item
      )
    }));
  };

  const updateCharge = (countryIndex: number, chargeIndex: number, field: 'name' | 'value', value: any) => {
    setFormData(prev => ({
      ...prev,
      countryDeliverables: prev.countryDeliverables.map((item, i) =>
        i === countryIndex
          ? {
              ...item,
              charges: item.charges.map((charge, ci) =>
                ci === chargeIndex ? { ...charge, [field]: value } : charge
              )
            }
          : item
      )
    }));
  };

  const addChargeFromCostModule = (countryIndex: number, costId: string) => {
    const country = formData.countryDeliverables[countryIndex]?.country;
    if (!country || !costsByCountry[country]) return;

    const cost = costsByCountry[country].find(c => c._id === costId);
    if (!cost) return;

    // Check if charge already exists
    const existingCharge = formData.countryDeliverables[countryIndex].charges.find(
      c => c.name === cost.name
    );
    if (existingCharge) return;

    setFormData(prev => ({
      ...prev,
      countryDeliverables: prev.countryDeliverables.map((item, i) =>
        i === countryIndex
          ? { ...item, charges: [...item.charges, { name: cost.name, value: cost.value }] }
          : item
      )
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((previous) => {
      let updatedValue: any;
      if (type === "checkbox") {
        const checked = (e.target as HTMLInputElement).checked;
        updatedValue =
          name === "isFlashDeal" ? (checked ? "true" : "false") : checked;
      } else if (type === "number") {
        updatedValue = parseFloat(value) || 0;
      } else {
        updatedValue = value;
      }

      let next = { ...previous, [name]: updatedValue } as FormData;

      if (name === "isFlashDeal" && updatedValue === "false") {
        next.expiryTime = "";
        setDateError(null);
      }

      if (name === "purchaseType" && updatedValue === "full") {
        next.moq = Number(previous.stock) || 0;
      }

      if (name === "stock" && previous.purchaseType === "full") {
        next.moq =
          typeof updatedValue === "number"
            ? updatedValue
            : parseFloat(String(updatedValue)) || 0;
      }

      const purchaseType = String(
        name === "purchaseType" ? updatedValue : previous.purchaseType
      );
      if (purchaseType === "partial") {
        setMoqError(null);
      } else {
        setMoqError(null);
      }

      return next;
    });

    if (touched[name as keyof TouchedFields]) {
      const error = validateField(name as keyof FormData, value);
      setValidationErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleStartTimeChange = (date: Date | null) => {
    if (date && !isNaN(date.getTime())) {
      setFormData((prev) => ({
        ...prev,
        startTime: date.toISOString(),
      }));
      setDateError(null);

      if (touched.startTime) {
        const error = validateField("startTime", date.toISOString());
        setValidationErrors((prev) => ({ ...prev, startTime: error }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        startTime: "",
      }));

      if (touched.startTime) {
        const error = validateField("startTime", "");
        setValidationErrors((prev) => ({ ...prev, startTime: error }));
      }
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date && date > new Date() && !isNaN(date.getTime())) {
      setFormData((prev) => ({
        ...prev,
        expiryTime: date.toISOString(),
      }));
      setDateError(null);

      if (touched.expiryTime) {
        const error = validateField("expiryTime", date.toISOString());
        setValidationErrors((prev) => ({ ...prev, expiryTime: error }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        expiryTime: "",
      }));
      setDateError("Please select a valid future date and time");

      if (touched.expiryTime) {
        const error = validateField("expiryTime", "");
        setValidationErrors((prev) => ({ ...prev, expiryTime: error }));
      }
    }
  };

  const handleNumericChange = (
    name: "price" | "stock" | "moq",
    e: React.ChangeEvent<HTMLInputElement>,
    allowDecimal: boolean
  ) => {
    let value = e.target.value;

    if (allowDecimal) {
      value = value.replace(/[^0-9.]/g, "");
      const parts = value.split(".");
      if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("").replace(/\./g, "");
      }
    } else {
      value = value.replace(/[^0-9]/g, "");
    }

    setFormData((previous) => {
      const next: FormData = { ...previous, [name]: value } as FormData;

      if (name === "stock" && previous.purchaseType === "full") {
        const numeric = value === "" ? 0 : parseFloat(value) || 0;
        next.moq = numeric;
      }

      if (previous.purchaseType === "partial") {
        setMoqError(null);
      } else {
        setMoqError(null);
      }

      return next;
    });

    if (name === "price") {
      const numeric = parseFloat(value) || 0;
      if (value !== "" && numeric <= 0) {
        setPriceError("Price must be greater than 0");
      } else {
        setPriceError(null);
      }
    }
  };

  const validateField = (
    name: keyof FormData,
    value: any
  ): string | undefined => {
    switch (name) {
      case "skuFamilyId":
        return !value ? "SKU Family is required" : undefined;
      case "subSkuFamilyId":
        return !value ? "Sub SKU Family is required" : undefined;
      case "simType":
        return !value ? "SIM Type is required" : undefined;
      case "color":
        return !value ? "Color is required" : undefined;
      case "ram":
        return !value ? "RAM is required" : undefined;
      case "storage":
        return !value ? "Storage is required" : undefined;
      case "condition":
        return !value ? "Condition is required" : undefined;
      case "price":
        if (value === "" || value === null || value === undefined)
          return "Price is required";
        const numericPrice = parseFloat(String(value));
        return isNaN(numericPrice)
          ? "Price must be a valid number"
          : numericPrice <= 0
          ? "Price must be greater than 0"
          : undefined;
      case "stock":
        if (value === "" || value === null || value === undefined)
          return "Stock is required";
        const numericStock = parseFloat(String(value));
        return isNaN(numericStock)
          ? "Stock must be a valid number"
          : numericStock <= 0
          ? "Stock must be greater than 0"
          : undefined;
      case "country":
        return !value ? "Country is required" : undefined;
      case "moq":
        if (value === "" || value === null || value === undefined)
          return "MOQ is required";
        const numericMoq = parseFloat(String(value));
        return isNaN(numericMoq)
          ? "MOQ must be a valid number"
          : numericMoq <= 0
          ? "MOQ must be greater than 0"
          : undefined;
      case "purchaseType":
        return !value ? "Purchase Type is required" : undefined;
      case "expiryTime":
        return formData.isFlashDeal === "true" && !value
          ? "Expiry time is required for Flash Deals"
          : undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    const requiredFields: (keyof FormData)[] = [
      "skuFamilyId",
      "subSkuFamilyId",
      "simType",
      "color",
      "ram",
      "storage",
      "condition",
      "price",
      "stock",
      "country",
      "moq",
      "purchaseType",
    ];

    requiredFields.forEach((fieldName) => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        (errors as any)[fieldName] = error;
        isValid = false;
      }
    });

    if (formData.isFlashDeal === "true") {
      const error = validateField("expiryTime", formData.expiryTime);
      if (error) {
        errors.expiryTime = error;
        isValid = false;
      }
    }

    const numericStock = parseFloat(String(formData.stock));
    const numericMoq = parseFloat(String(formData.moq));
    if (
      formData.purchaseType === "partial" &&
      !isNaN(numericStock) &&
      !isNaN(numericMoq) &&
      numericMoq >= numericStock
    ) {
      errors.moq = "MOQ must be less than Stock";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(
      name as keyof FormData,
      formData[name as keyof FormData]
    );
    setValidationErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setTouched({
      skuFamilyId: true,
      subSkuFamilyId: true,
      simType: true,
      color: true,
      ram: true,
      storage: true,
      condition: true,
      price: true,
      stock: true,
      country: true,
      moq: true,
      purchaseType: true,
      startTime: true,
      expiryTime: true,
      isNegotiable: true,
      isFlashDeal: true,
    });

    const isValid = validateForm();
    console.log("Form validation result:", isValid);
    console.log("Current validation errors:", validationErrors);
    console.log("Form data:", formData);

    if (!isValid) {
      console.log("Form validation failed, not submitting");
      return;
    }

    console.log("Form is valid, submitting...");
    onSave(formData);
  };

  if (!isOpen) return null;

  const title = editItem ? "Edit Product" : "Create Product";
  const lockDerivedFields = Boolean(formData.subSkuFamilyId);

  const skuFamilyOptions = skuFamilies.map(sku => ({ 
    value: sku._id, 
    label: sku.name 
  }));

  const selectedSkuFamily = skuFamilyOptions.find(option => option.value === formData.skuFamilyId);
  
  const subSkuFamilyOptions = subSkuFamilies.map(subSku => {
    const parsedData = parseSubSkuFamilyResponse(subSku.name);
    const displayName = parsedData ? parsedData.displayName : subSku.name;
    return { value: subSku._id, label: displayName };
  });

  const selectedSubSkuFamily = subSkuFamilyOptions.find(option => option.value === formData.subSkuFamilyId);

  // Custom styles for react-select to match existing design
  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isDisabled ? '#f9fafb' : '#f9fafb',
      borderColor: touched.skuFamilyId && validationErrors.skuFamilyId 
        ? '#ef4444' 
        : state.isFocused 
        ? '#3b82f6' 
        : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      minHeight: '42px',
      borderRadius: '0.5rem',
      '&:hover': {
        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db'
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      zIndex: 9999
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
        ? '#f3f4f6' 
        : 'white',
      color: state.isSelected ? 'white' : '#111827',
      '&:hover': {
        backgroundColor: '#f3f4f6'
      }
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#111827'
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#6b7280'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: '#6b7280',
      '&:hover': {
        color: '#374151'
      }
    }),
    // Dark mode styles
    dark: {
      control: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        color: 'white'
      },
      menu: {
        backgroundColor: '#1f2937'
      },
      option: {
        backgroundColor: '#1f2937',
        color: 'white',
        '&:hover': {
          backgroundColor: '#374151'
        }
      },
      singleValue: {
        color: 'white'
      },
      placeholder: {
        color: '#9ca3af'
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-[800px] max-h-[80vh] transform transition-all duration-300 scale-100 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 p-6 pb-4 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform duration-200 hover:scale-110"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            {/* SKU Family ID, Sub SKU Family, and RAM Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  SKU Family ID
                </label>
                <Select
                  options={skuFamilyOptions}
                  value={selectedSkuFamily}
                  onChange={handleSkuFamilyChange}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, skuFamilyId: true }));
                    const error = validateField("skuFamilyId", formData.skuFamilyId);
                    setValidationErrors((prev) => ({ ...prev, skuFamilyId: error }));
                  }}
                  isDisabled={skuLoading || skuError !== null}
                  placeholder={skuLoading ? "Loading SKU Families..." : skuError ? "Error loading SKU Families" : "Select SKU Family"}
                  isSearchable={true}
                  isLoading={skuLoading}
                  styles={customSelectStyles}
                  className="basic-select"
                  classNamePrefix="select"
                />
                {touched.skuFamilyId && validationErrors.skuFamilyId && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.skuFamilyId}
                  </p>
                )}
                {skuError && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {skuError}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Sub SKU Family
                </label>
                <Select
                  options={subSkuFamilyOptions}
                  value={selectedSubSkuFamily}
                  onChange={handleSubSkuFamilyChange}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, subSkuFamilyId: true }));
                    const error = validateField("subSkuFamilyId", formData.subSkuFamilyId);
                    setValidationErrors((prev) => ({ ...prev, subSkuFamilyId: error }));
                  }}
                  isDisabled={subSkuLoading || subSkuError !== null || !formData.skuFamilyId}
                  placeholder={subSkuLoading ? "Loading Sub SKU Families..." : subSkuError ? "Error loading Sub SKU Families" : formData.skuFamilyId ? "Select Sub SKU Family" : "Select SKU Family first"}
                  isSearchable={true}
                  isLoading={subSkuLoading}
                  styles={customSelectStyles}
                  className="basic-select"
                  classNamePrefix="select"
                />
                {touched.subSkuFamilyId && validationErrors.subSkuFamilyId && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.subSkuFamilyId}
                  </p>
                )}
                {subSkuError && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {subSkuError}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  RAM
                </label>
                <div className="relative">
                  <select
                    name="ram"
                    value={formData.ram}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.ram && validationErrors.ram
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                  >
                    <option value="" disabled>
                      Select RAM
                    </option>
                    {ramOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.ram && validationErrors.ram && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.ram}
                  </p>
                )}
              </div>
            </div>

            {/* Product Category, Brand, and Grade Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Product Category
                </label>
                <Select
                  options={productCategories
                    .filter(cat => cat && cat._id && cat.title && typeof cat.title === 'string')
                    .map(cat => ({ 
                      value: cat._id || '', 
                      label: cat.title 
                    }))}
                  value={(() => {
                    if (!formData.productcategoriesId) return null;
                    const found = productCategories.find(cat => cat && cat._id === formData.productcategoriesId);
                    if (!found || !found._id || !found.title || typeof found.title !== 'string') return null;
                    return { 
                      value: found._id, 
                      label: found.title 
                    };
                  })()}
                  onChange={(selectedOption: any) => {
                    const value = selectedOption?.value || '';
                    setFormData(prev => ({ ...prev, productcategoriesId: value }));
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, productcategoriesId: true }));
                  }}
                  isDisabled={productCategoryLoading}
                  placeholder={productCategoryLoading ? "Loading..." : "Select Product Category"}
                  isSearchable={true}
                  isLoading={productCategoryLoading}
                  styles={customSelectStyles}
                  className="basic-select"
                  classNamePrefix="select"
                  isClearable
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Brand
                </label>
                <Select
                  options={brands
                    .filter(brand => brand && brand._id && brand.title && typeof brand.title === 'string')
                    .map(brand => ({ 
                      value: brand._id || '', 
                      label: brand.title 
                    }))}
                  value={(() => {
                    if (!formData.brandId) return null;
                    const found = brands.find(brand => brand && brand._id === formData.brandId);
                    if (!found || !found._id || !found.title || typeof found.title !== 'string') return null;
                    return { 
                      value: found._id, 
                      label: found.title 
                    };
                  })()}
                  onChange={(selectedOption: any) => {
                    const value = selectedOption?.value || '';
                    setFormData(prev => ({ ...prev, brandId: value }));
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, brandId: true }));
                  }}
                  isDisabled={brandLoading}
                  placeholder={brandLoading ? "Loading..." : "Select Brand"}
                  isSearchable={true}
                  isLoading={brandLoading}
                  styles={customSelectStyles}
                  className="basic-select"
                  classNamePrefix="select"
                  isClearable
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Grade
                </label>
                <Select
                  options={grades
                    .filter(grade => grade && grade._id && grade.title && typeof grade.title === 'string')
                    .map(grade => {
                      const title = grade.title;
                      const brandTitle = (typeof grade.brand === 'object' && grade.brand && grade.brand.title && typeof grade.brand.title === 'string') 
                        ? ` (${grade.brand.title})` 
                        : '';
                      return { 
                        value: grade._id || '', 
                        label: title + brandTitle
                      };
                    })}
                  value={(() => {
                    if (!formData.gradeId) return null;
                    const found = grades.find(grade => grade && grade._id === formData.gradeId);
                    if (!found || !found._id || !found.title || typeof found.title !== 'string') return null;
                    const title = found.title;
                    const brandTitle = (typeof found.brand === 'object' && found.brand && found.brand.title && typeof found.brand.title === 'string') 
                      ? ` (${found.brand.title})` 
                      : '';
                    return { 
                      value: found._id, 
                      label: title + brandTitle
                    };
                  })()}
                  onChange={(selectedOption: any) => {
                    const value = selectedOption?.value || '';
                    setFormData(prev => ({ ...prev, gradeId: value }));
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, gradeId: true }));
                  }}
                  isDisabled={gradeLoading}
                  placeholder={gradeLoading ? "Loading..." : "Select Grade"}
                  isSearchable={true}
                  isLoading={gradeLoading}
                  styles={customSelectStyles}
                  className="basic-select"
                  classNamePrefix="select"
                  isClearable
                />
              </div>
            </div>

            {/* SIM Type, Color, and Country Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  SIM Type
                </label>
                <div className="relative">
                  <select
                    name="simType"
                    value={formData.simType}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={lockDerivedFields}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.simType && validationErrors.simType
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                  >
                    <option value="" disabled>
                      Select SIM Type
                    </option>
                    {simOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.simType && validationErrors.simType && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.simType}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Color
                </label>
                <div className="relative">
                  <select
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={lockDerivedFields}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.color && validationErrors.color
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                  >
                    <option value="" disabled>
                      Select Color
                    </option>
                    {colorOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.color && validationErrors.color && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.color}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Country
                </label>
                <div className="relative">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={lockDerivedFields}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.country && validationErrors.country
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                  >
                    <option value="" disabled>
                      Select Country
                    </option>
                    {countryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.country && validationErrors.country && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.country}
                  </p>
                )}

              </div>
            </div>

            {/* Storage, Condition, and Price Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Storage
                </label>
                <div className="relative">
                  <select
                    name="storage"
                    value={formData.storage}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.storage && validationErrors.storage
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                  >
                    <option value="" disabled>
                      Select Storage
                    </option>
                    {storageOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.storage && validationErrors.storage && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.storage}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Condition
                </label>
                <div className="relative">
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.condition && validationErrors.condition
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                  >
                    <option value="" disabled>
                      Select Condition
                    </option>
                    {conditionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.condition && validationErrors.condition && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.condition}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Price
                </label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={(e) => handleNumericChange("price", e, true)}
                  onBlur={handleBlur}
                  inputMode="decimal"
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                    touched.price && validationErrors.price
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  placeholder="Enter Price"
                  required
                />
                {touched.price && validationErrors.price && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.price}
                  </p>
                )}
                {priceError && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {priceError}
                  </p>
                )}
              </div>
            </div>

            {/* Stock, MOQ, and Purchase Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Stock
                </label>
                <input
                  type="text"
                  name="stock"
                  value={formData.stock}
                  onChange={(e) => handleNumericChange("stock", e, false)}
                  onBlur={handleBlur}
                  inputMode="numeric"
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                    touched.stock && validationErrors.stock
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  placeholder="Enter Stock"
                  required
                />
                {touched.stock && validationErrors.stock && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.stock}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  MOQ
                </label>
                <input
                  type="text"
                  name="moq"
                  value={formData.moq}
                  onChange={(e) => handleNumericChange("moq", e, false)}
                  onBlur={handleBlur}
                  inputMode="numeric"
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                    touched.moq && validationErrors.moq
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  placeholder="Enter Minimum Order Quantity"
                  required
                  disabled={formData.purchaseType === "full"}
                />
                {touched.moq && validationErrors.moq && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.moq}
                  </p>
                )}
                {moqError && formData.purchaseType === "partial" && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {moqError}
                  </p>
                )}
                {formData.purchaseType === "full" && (
                  <p className="mt-1 text-xs text-gray-500">
                    MOQ equals Stock for Full purchase type.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Purchase Type
                </label>
                <div className="relative">
                  <select
                    name="purchaseType"
                    value={formData.purchaseType}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-3 pr-8 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm appearance-none cursor-pointer ${
                      touched.purchaseType && validationErrors.purchaseType
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                  >
                    <option value="partial">Partial</option>
                    <option value="full">Full</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                </div>
                {touched.purchaseType && validationErrors.purchaseType && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.purchaseType}
                  </p>
                )}
              </div>
            </div>

            {/* Start Time, Expiry Time, Is Negotiable, and Is Flash Deal Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                  Start Time
                </label>
                <DatePicker
                  selected={
                    formData.startTime ? new Date(formData.startTime) : null
                  }
                  onChange={handleStartTimeChange}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, startTime: true }));
                    const error = validateField(
                      "startTime",
                      formData.startTime
                    );
                    setValidationErrors((prev) => ({
                      ...prev,
                      startTime: error,
                    }));
                  }}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  placeholderText="Select start date and time (optional)"
                  className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                    touched.startTime && validationErrors.startTime
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                />
                {touched.startTime && validationErrors.startTime && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {validationErrors.startTime}
                  </p>
                )}
              </div>

              {formData.isFlashDeal === "true" && (
                <div>
                  <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                    Expiry Time
                  </label>
                  <DatePicker
                    selected={
                      formData.expiryTime ? new Date(formData.expiryTime) : null
                    }
                    onChange={handleDateChange}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, expiryTime: true }));
                      const error = validateField(
                        "expiryTime",
                        formData.expiryTime
                      );
                      setValidationErrors((prev) => ({
                        ...prev,
                        expiryTime: error,
                      }));
                    }}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="yyyy-MM-dd HH:mm"
                    placeholderText="Select date and time"
                    className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                      touched.expiryTime && validationErrors.expiryTime
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    minDate={new Date()}
                    required={formData.isFlashDeal === "true"}
                  />
                  {touched.expiryTime && validationErrors.expiryTime && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {validationErrors.expiryTime}
                    </p>
                  )}
                  {dateError && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {dateError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Is Negotiable and Is Flash Deal Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  name="isNegotiable"
                  checked={formData.isNegotiable}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
                />
                <label className="ml-2 text-sm font-medium text-gray-950 dark:text-gray-200">
                  Is Negotiable
                </label>
              </div>

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  name="isFlashDeal"
                  checked={formData.isFlashDeal === "true"}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition duration-200"
                />
                <label className="ml-2 text-sm font-medium text-gray-950 dark:text-gray-200">
                  Is Flash Deal
                </label>
              </div>
            </div>

            {/* Group Code Field */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                Group Code <span className="text-gray-500 text-xs">(Optional - for multi-variant products)</span>
              </label>
              <input
                type="text"
                name="groupCode"
                value={formData.groupCode}
                onChange={handleInputChange}
                placeholder="Enter group code (e.g., GROUP001)"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
              />
            </div>

            {/* Country Deliverables Section */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-950 dark:text-gray-200">
                  Country Deliverables
                </label>
                <button
                  type="button"
                  onClick={addCountryDeliverable}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm flex items-center gap-2"
                >
                  <i className="fas fa-plus text-xs"></i>
                  Add Country
                </button>
              </div>

              {formData.countryDeliverables.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No country deliverables added. Click "Add Country" to add country-wise pricing and charges.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.countryDeliverables.map((deliverable, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          Country Deliverable #{index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeCountryDeliverable(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                            Country <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={deliverable.country}
                            onChange={(e) => updateCountryDeliverable(index, 'country', e.target.value)}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                          >
                            <option value="">Select Country</option>
                            {countryOptions.map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                            Price <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={deliverable.price}
                            onChange={(e) => updateCountryDeliverable(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="Enter price"
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>

                      {/* Charges Section */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-950 dark:text-gray-200">
                            Charges
                          </label>
                          <div className="flex gap-2">
                            {/* Add charge from cost module */}
                            {deliverable.country && costsByCountry[deliverable.country] && (
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    addChargeFromCostModule(index, e.target.value);
                                    e.target.value = "";
                                  }
                                }}
                                className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200"
                              >
                                <option value="">Add from Cost Module</option>
                                {costsByCountry[deliverable.country].map(cost => (
                                  <option key={cost._id} value={cost._id}>
                                    {cost.name} ({cost.costType}: {cost.value}{cost.costType === 'Percentage' ? '%' : ''})
                                  </option>
                                ))}
                              </select>
                            )}
                            <button
                              type="button"
                              onClick={() => addChargeToCountry(index)}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition duration-200"
                            >
                              <i className="fas fa-plus mr-1"></i>
                              Add Charge
                            </button>
                          </div>
                        </div>

                        {deliverable.charges.length === 0 ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            No charges added. Click "Add Charge" or select from cost module.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {deliverable.charges.map((charge, chargeIndex) => (
                              <div
                                key={chargeIndex}
                                className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                              >
                                <input
                                  type="text"
                                  value={charge.name}
                                  onChange={(e) => updateCharge(index, chargeIndex, 'name', e.target.value)}
                                  placeholder="Charge name"
                                  className="flex-1 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-800 dark:text-gray-200"
                                />
                                <input
                                  type="number"
                                  value={charge.value}
                                  onChange={(e) => updateCharge(index, chargeIndex, 'value', parseFloat(e.target.value) || 0)}
                                  placeholder="Value"
                                  className="w-24 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-800 dark:text-gray-200"
                                  step="0.01"
                                  min="0"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeChargeFromCountry(index, chargeIndex)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                >
                                  <i className="fas fa-trash text-sm"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-6 pt-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              className="min-w-[160px] px-4 py-2 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 transition duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={
                skuLoading ||
                skuError !== null ||
                subSkuLoading ||
                subSkuError !== null
              }
            >
              {skuLoading || subSkuLoading ? (
                <svg
                  className="animate-spin h-4 w-4 text-white mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              {editItem ? "Update Product" : "Create Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
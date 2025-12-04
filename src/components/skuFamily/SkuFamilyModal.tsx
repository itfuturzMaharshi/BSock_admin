import React, { useState, useEffect, useRef } from "react";
import toastHelper from "../../utils/toastHelper";
import { SkuFamily } from "./types";
import { ProductCategoryService } from "../../services/productCategory/productCategory.services";
import { BrandService } from "../../services/brand/brand.services";
import { ConditionCategoryService } from "../../services/conditionCategory/conditionCategory.services";
import { StorageService } from "../../services/storage/storage.services";
import { RamService } from "../../services/ram/ram.services";
import { ColorService } from "../../services/color/color.services";
import Select from 'react-select';
import placeholderImage from "../../../public/images/product/noimage.jpg";

interface ValidationErrors {
  name?: string;
  brand?: string;
  productcategoriesId?: string;
  conditionCategoryId?: string;
  description?: string;
  sequence?: string;
}

interface TouchedFields {
  name: boolean;
  brand: boolean;
  productcategoriesId: boolean;
  conditionCategoryId: boolean;
  description: boolean;
  sequence: boolean;
}

interface SkuFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  editItem?: SkuFamily;
}

const SkuFamilyModal: React.FC<SkuFamilyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
}) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    brand: "",
    productcategoriesId: "",
    conditionCategoryId: "",
    subModel: "",
    storageId: "",
    ramId: "",
    colorId: "",
    description: "",
    sequence: 1 as number | undefined,
  });
  const [productCategories, setProductCategories] = useState<
    { _id?: string; title: string }[]
  >([]);
  const [brands, setBrands] = useState<
    { _id?: string; title: string }[]
  >([]);
  const [conditionCategories, setConditionCategories] = useState<
    { _id?: string; title: string }[]
  >([]);
  const [storages, setStorages] = useState<
    { _id?: string; title: string }[]
  >([]);
  const [rams, setRams] = useState<
    { _id?: string; title: string }[]
  >([]);
  const [colors, setColors] = useState<
    { _id?: string; title: string }[]
  >([]);
  const [productCategoryLoading, setProductCategoryLoading] = useState<boolean>(false);
  const [brandLoading, setBrandLoading] = useState<boolean>(false);
  const [conditionCategoryLoading, setConditionCategoryLoading] = useState<boolean>(false);
  const [storageLoading, setStorageLoading] = useState<boolean>(false);
  const [ramLoading, setRamLoading] = useState<boolean>(false);
  const [colorLoading, setColorLoading] = useState<boolean>(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touched, setTouched] = useState<TouchedFields>({
    name: false,
    brand: false,
    productcategoriesId: false,
    conditionCategoryId: false,
    description: false,
    sequence: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 5;

  const base = (import.meta as { env?: { VITE_BASE_URL?: string } }).env?.VITE_BASE_URL || "";

  const getImageUrl = (path: string): string => {
    if (!path) return placeholderImage;
    const isAbsolute = /^https?:\/\//i.test(path);
    return isAbsolute
      ? path
      : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  useEffect(() => {
    const resetStates = () => {
      setNewImages([]);
      setImageError("");
      setApiError("");
      setValidationErrors({});
      setTouched({
        name: false,
        brand: false,
        productcategoriesId: false,
        conditionCategoryId: false,
        description: false,
        sequence: false,
      });
    };

    if (!isOpen) {
      setFormData({
        code: "",
        name: "",
        brand: "",
        productcategoriesId: "",
        conditionCategoryId: "",
        subModel: "",
        storageId: "",
        ramId: "",
        colorId: "",
        description: "",
        sequence: 1,
      });
      setExistingImages([]);
      setNewImages([]);
      resetStates();
      return;
    }

    resetStates();

    if (editItem) {
      const productCategoryId = typeof editItem.productcategoriesId === "object"
        ? editItem.productcategoriesId?._id || ""
        : editItem.productcategoriesId || "";
      
      const brandId = typeof editItem.brand === "object"
        ? editItem.brand?._id || ""
        : editItem.brand || "";
      
      const conditionCategoryId = typeof editItem.conditionCategoryId === "object"
        ? editItem.conditionCategoryId?._id || ""
        : editItem.conditionCategoryId || "";

      const storageId = typeof editItem.storageId === "object"
        ? editItem.storageId?._id || ""
        : editItem.storageId || "";

      const ramId = typeof editItem.ramId === "object"
        ? editItem.ramId?._id || ""
        : editItem.ramId || "";

      const colorId = typeof editItem.colorId === "object"
        ? editItem.colorId?._id || ""
        : editItem.colorId || "";
      
      setFormData({
        code: editItem.code || "",
        name: editItem.name || "",
        brand: brandId,
        productcategoriesId: productCategoryId,
        conditionCategoryId: conditionCategoryId,
        subModel: editItem.subModel || "",
        storageId: storageId,
        ramId: ramId,
        colorId: colorId,
        description: editItem.description || "",
        sequence: editItem.sequence ?? 1,
      });

      if (editItem.images) {
        const imageArray = Array.isArray(editItem.images) 
          ? editItem.images.filter(img => img && String(img).trim() !== "")
          : [];
        setExistingImages(imageArray);
      }
    } else {
      setFormData({
        code: "",
        name: "",
        brand: "",
        productcategoriesId: "",
        conditionCategoryId: "",
        subModel: "",
        storageId: "",
        ramId: "",
        colorId: "",
        description: "",
        sequence: 1,
      });
      setExistingImages([]);
    }
  }, [isOpen, editItem]);

  // Fetch all dropdown data on mount
  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        setProductCategoryLoading(true);
        const response = await ProductCategoryService.getProductCategoryList(1, 1000);
        const categoriesList = (response.data.docs || []).filter((cat: { _id?: string; title?: string }) => cat && cat._id && cat.title && typeof cat.title === 'string');
        setProductCategories(categoriesList);
      } catch (error) {
        console.error("Failed to load Product Categories:", error);
      } finally {
        setProductCategoryLoading(false);
      }
    };

    const fetchBrands = async () => {
      try {
        setBrandLoading(true);
        const response = await BrandService.getBrandList(1, 1000);
        const brandsList = (response.data.docs || []).filter((brand: { _id?: string; title?: string }) => brand && brand._id && brand.title && typeof brand.title === 'string');
        setBrands(brandsList);
      } catch (error) {
        console.error("Failed to load Brands:", error);
      } finally {
        setBrandLoading(false);
      }
    };

    const fetchConditionCategories = async () => {
      try {
        setConditionCategoryLoading(true);
        const response = await ConditionCategoryService.getConditionCategoryList(1, 1000);
        const categoriesList = (response.data.docs || []).filter((cat: { _id?: string; title?: string }) => cat && cat._id && cat.title && typeof cat.title === 'string');
        setConditionCategories(categoriesList);
      } catch (error) {
        console.error("Failed to load Condition Categories:", error);
      } finally {
        setConditionCategoryLoading(false);
      }
    };

    const fetchStorages = async () => {
      try {
        setStorageLoading(true);
        const response = await StorageService.getStorageList(1, 1000);
        const storagesList = (response.data.docs || []).filter((storage: { _id?: string; title?: string }) => storage && storage._id && storage.title && typeof storage.title === 'string');
        setStorages(storagesList);
      } catch (error) {
        console.error("Failed to load Storages:", error);
      } finally {
        setStorageLoading(false);
      }
    };

    const fetchRams = async () => {
      try {
        setRamLoading(true);
        const response = await RamService.getRamList(1, 1000);
        const ramsList = (response.data.docs || []).filter((ram: { _id?: string; title?: string }) => ram && ram._id && ram.title && typeof ram.title === 'string');
        setRams(ramsList);
      } catch (error) {
        console.error("Failed to load RAMs:", error);
      } finally {
        setRamLoading(false);
      }
    };

    const fetchColors = async () => {
      try {
        setColorLoading(true);
        const response = await ColorService.getColorList(1, 1000);
        const colorsList = (response.data.docs || []).filter((color: { _id?: string; title?: string }) => color && color._id && color.title && typeof color.title === 'string');
        setColors(colorsList);
      } catch (error) {
        console.error("Failed to load Colors:", error);
      } finally {
        setColorLoading(false);
      }
    };

    fetchProductCategories();
    fetchBrands();
    fetchConditionCategories();
    fetchStorages();
    fetchRams();
    fetchColors();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name as keyof TouchedFields]) {
      const error = validateField(name as keyof typeof formData, value);
      setValidationErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > MAX_IMAGES) {
      setImageError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    if (files.length > 0) {
      setImageError("");
      setNewImages((prev) => [...prev, ...files]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > MAX_IMAGES) {
      setImageError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    setImageError("");
    setNewImages((prev) => [...prev, ...files]);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveExisting = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    setImageError("");
  };

  const handleRemoveNew = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setImageError("");
  };

  const validateField = (
    name: keyof typeof formData,
    value: string | number | undefined
  ): string | undefined => {
    switch (name) {
      case "name":
        return !value || (typeof value === 'string' && value.trim() === "") ? "Name is required" : undefined;
      case "brand":
        return !value || (typeof value === 'string' && value.trim() === "") ? "Brand is required" : undefined;
      case "description":
        return !value || (typeof value === 'string' && value.trim() === "")
          ? "Description is required"
          : undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    const requiredFields: (keyof typeof formData)[] = [
      "name",
      "brand",
      "description",
    ];

    requiredFields.forEach((fieldName) => {
      const fieldValue = formData[fieldName];
      const error = validateField(fieldName, typeof fieldValue === 'string' ? fieldValue : undefined);
      if (error && (fieldName === 'name' || fieldName === 'brand' || fieldName === 'description')) {
        errors[fieldName as keyof ValidationErrors] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const fieldName = name as keyof typeof formData;
    const fieldValue = formData[fieldName];
    const error = validateField(fieldName, typeof fieldValue === 'string' ? fieldValue : undefined);
    if (name === 'name' || name === 'code' || name === 'brand' || name === 'description') {
      setValidationErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setTouched({
      name: true,
      brand: true,
      productcategoriesId: true,
      conditionCategoryId: true,
      description: true,
      sequence: true,
    });

    const isValid = validateForm();
    if (!isValid) {
      setApiError("Please fill all required fields");
      toastHelper.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setApiError("");

    try {
      const formDataToSend = new FormData();
      if (editItem?._id) {
        formDataToSend.append("id", editItem._id);
        // Only send code in edit mode (to preserve existing code)
        if (formData.code) {
          formDataToSend.append("code", formData.code.trim());
        }
      }
      // Code will be auto-generated by backend for new records
      formDataToSend.append("name", formData.name.trim());
      if (formData.brand) {
        formDataToSend.append("brand", formData.brand);
      }
      if (formData.productcategoriesId) {
        formDataToSend.append("productcategoriesId", formData.productcategoriesId);
      }
      if (formData.conditionCategoryId) {
        formDataToSend.append("conditionCategoryId", formData.conditionCategoryId);
      }
      if (formData.subModel) {
        formDataToSend.append("subModel", formData.subModel.trim());
      }
      if (formData.storageId) {
        formDataToSend.append("storageId", formData.storageId);
      }
      if (formData.ramId) {
        formDataToSend.append("ramId", formData.ramId);
      }
      if (formData.colorId) {
        formDataToSend.append("colorId", formData.colorId);
      }
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("sequence", formData.sequence?.toString() || "1");
      newImages.forEach((image) => {
        formDataToSend.append("images", image);
      });
      if (editItem && existingImages.length > 0) {
        formDataToSend.append("keptImages", JSON.stringify(existingImages));
      }

      await onSave(formDataToSend);
      onClose();
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Failed to save SKU family";
      setApiError(errorMessage);
      toastHelper.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = editItem ? "Edit SKU Family" : "Create SKU Family";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] transform transition-all duration-300 scale-100 flex flex-col">
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 p-6 pb-4 border-b border-gray-200 dark:border-gray-700 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {editItem ? "Update SKU Family information" : "Fill in the details to create a new SKU Family"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform duration-200 hover:scale-110 p-2"
              disabled={isLoading}
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
          <form
            id="sku-family-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Basic Information Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <i className="fas fa-info-circle text-blue-600"></i>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editItem && formData.code && (
                  <div>
                    <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                      Code
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      className="w-full p-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 text-sm cursor-not-allowed"
                      disabled
                      readOnly
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Code is auto-generated and cannot be changed
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full p-2.5 bg-white dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                      touched.name && validationErrors.name
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    placeholder="Enter Name"
                    required
                    disabled={isLoading}
                  />
                  {touched.name && validationErrors.name && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {validationErrors.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Category & Brand Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <i className="fas fa-tags text-blue-600"></i>
                Categories & Brand
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={brands
                      .filter(brand => brand && brand._id && brand.title && typeof brand.title === 'string')
                      .map(brand => ({ 
                        value: brand._id || '', 
                        label: brand.title 
                      }))}
                    value={
                      !formData.brand ? null :
                      (() => {
                        const found = brands.find(brand => brand && brand._id === formData.brand);
                        return found ? { value: found._id || '', label: found.title } : null;
                      })()
                    }
                    onChange={(selectedOption) => {
                      const value = selectedOption ? selectedOption.value : "";
                      setFormData(prev => ({ ...prev, brand: value }));
                      setTouched((prev) => ({ ...prev, brand: true }));
                      if (value) {
                        setValidationErrors((prev) => ({ ...prev, brand: undefined }));
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, brand: true }));
                    }}
                    isDisabled={brandLoading}
                    placeholder={brandLoading ? "Loading..." : "Select Brand"}
                    isLoading={brandLoading}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: touched.brand && validationErrors.brand
                          ? '#ef4444'
                          : state.isFocused ? '#3b82f6' : '#e5e7eb',
                        boxShadow: state.isFocused && !(touched.brand && validationErrors.brand)
                          ? '0 0 0 1px #3b82f6'
                          : 'none',
                        '&:hover': {
                          borderColor: touched.brand && validationErrors.brand
                            ? '#ef4444'
                            : '#3b82f6',
                        },
                      }),
                    }}
                  />
                  {touched.brand && validationErrors.brand && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {validationErrors.brand}
                    </p>
                  )}
                </div>
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
                    value={
                      !formData.productcategoriesId ? null :
                      (() => {
                        const found = productCategories.find(cat => cat && cat._id === formData.productcategoriesId);
                        return found ? { value: found._id || '', label: found.title } : null;
                      })()
                    }
                    onChange={(selectedOption) => {
                      const value = selectedOption ? selectedOption.value : "";
                      setFormData(prev => ({ ...prev, productcategoriesId: value }));
                      setTouched((prev) => ({ ...prev, productcategoriesId: true }));
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, productcategoriesId: true }));
                    }}
                    isDisabled={productCategoryLoading}
                    placeholder={productCategoryLoading ? "Loading..." : "Select Product Category"}
                    isLoading={productCategoryLoading}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                    Condition Category
                  </label>
                  <Select
                    options={conditionCategories
                      .filter(cat => cat && cat._id && cat.title && typeof cat.title === 'string')
                      .map(cat => ({ 
                        value: cat._id || '', 
                        label: cat.title 
                      }))}
                    value={
                      !formData.conditionCategoryId ? null :
                      (() => {
                        const found = conditionCategories.find(cat => cat && cat._id === formData.conditionCategoryId);
                        return found ? { value: found._id || '', label: found.title } : null;
                      })()
                    }
                    onChange={(selectedOption) => {
                      const value = selectedOption ? selectedOption.value : "";
                      setFormData(prev => ({ ...prev, conditionCategoryId: value }));
                      setTouched((prev) => ({ ...prev, conditionCategoryId: true }));
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, conditionCategoryId: true }));
                    }}
                    isDisabled={conditionCategoryLoading}
                    placeholder={conditionCategoryLoading ? "Loading..." : "Select Condition Category"}
                    isLoading={conditionCategoryLoading}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>
              </div>
            </div>

            {/* Specifications Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <i className="fas fa-microchip text-blue-600"></i>
                Specifications
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                    Sub Model
                  </label>
                  <input
                    type="text"
                    name="subModel"
                    value={formData.subModel}
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                    placeholder="Enter Sub Model"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                    Storage
                  </label>
                  <Select
                    options={storages
                      .filter(storage => storage && storage._id && storage.title && typeof storage.title === 'string')
                      .map(storage => ({ 
                        value: storage._id || '', 
                        label: storage.title 
                      }))}
                    value={
                      !formData.storageId ? null :
                      (() => {
                        const found = storages.find(storage => storage && storage._id === formData.storageId);
                        return found ? { value: found._id || '', label: found.title } : null;
                      })()
                    }
                    onChange={(selectedOption) => {
                      const value = selectedOption ? selectedOption.value : "";
                      setFormData(prev => ({ ...prev, storageId: value }));
                    }}
                    isDisabled={storageLoading}
                    placeholder={storageLoading ? "Loading..." : "Select Storage"}
                    isLoading={storageLoading}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                    RAM
                  </label>
                  <Select
                    options={rams
                      .filter(ram => ram && ram._id && ram.title && typeof ram.title === 'string')
                      .map(ram => ({ 
                        value: ram._id || '', 
                        label: ram.title 
                      }))}
                    value={
                      !formData.ramId ? null :
                      (() => {
                        const found = rams.find(ram => ram && ram._id === formData.ramId);
                        return found ? { value: found._id || '', label: found.title } : null;
                      })()
                    }
                    onChange={(selectedOption) => {
                      const value = selectedOption ? selectedOption.value : "";
                      setFormData(prev => ({ ...prev, ramId: value }));
                    }}
                    isDisabled={ramLoading}
                    placeholder={ramLoading ? "Loading..." : "Select RAM"}
                    isLoading={ramLoading}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-950 dark:text-gray-200 mb-2">
                    Color
                  </label>
                  <Select
                    options={colors
                      .filter(color => color && color._id && color.title && typeof color.title === 'string')
                      .map(color => ({ 
                        value: color._id || '', 
                        label: color.title 
                      }))}
                    value={
                      !formData.colorId ? null :
                      (() => {
                        const found = colors.find(color => color && color._id === formData.colorId);
                        return found ? { value: found._id || '', label: found.title } : null;
                      })()
                    }
                    onChange={(selectedOption) => {
                      const value = selectedOption ? selectedOption.value : "";
                      setFormData(prev => ({ ...prev, colorId: value }));
                    }}
                    isDisabled={colorLoading}
                    placeholder={colorLoading ? "Loading..." : "Select Color"}
                    isLoading={colorLoading}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <i className="fas fa-align-left text-blue-600"></i>
                Description
              </h3>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                onBlur={handleBlur}
                rows={4}
                className={`w-full p-2.5 bg-white dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm ${
                  touched.description && validationErrors.description
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-700"
                } resize-y`}
                placeholder="Enter detailed description..."
                required
                disabled={isLoading}
              />
              {touched.description && validationErrors.description && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {validationErrors.description}
                </p>
              )}
            </div>

            {/* Images Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <i className="fas fa-images text-blue-600"></i>
                Images
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                  (Max {MAX_IMAGES} images)
                </span>
              </h3>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                className={`w-full p-6 bg-white dark:bg-gray-800 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={isLoading}
                />
                {existingImages.length + newImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {existingImages.map((url, index) => (
                      <div
                        key={`existing-${index}`}
                        className="relative group"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                          <img
                            src={getImageUrl(url)}
                            alt={`Existing ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                placeholderImage;
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveExisting(index);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                          disabled={isLoading}
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </div>
                    ))}
                    {newImages.map((image, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveNew(index);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                          disabled={isLoading}
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </div>
                    ))}
                    {existingImages.length + newImages.length < MAX_IMAGES && (
                      <div
                        className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-700/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClick();
                        }}
                      >
                        <i className="fas fa-plus text-2xl text-gray-400 dark:text-gray-500 mb-2"></i>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Add More</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <i className="fas fa-cloud-upload-alt text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
                    <p className="text-gray-600 dark:text-gray-400 text-base font-medium mb-2">
                      Drag & drop images here or click to browse
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      Supports JPG, PNG, GIF (max {MAX_IMAGES} images)
                    </p>
                  </div>
                )}
              </div>
              {imageError && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                  <i className="fas fa-exclamation-circle"></i>
                  {imageError}
                </p>
              )}
            </div>

            {/* Sequence Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <i className="fas fa-sort-numeric-down text-blue-600"></i>
                Display Order
              </h3>
              <div className="max-w-xs">
                <input
                  type="number"
                  name="sequence"
                  value={formData.sequence || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, sequence: value === '' ? undefined : parseInt(value) || 1 });
                  }}
                  min="1"
                  className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                  placeholder="Enter sequence number"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <i className="fas fa-info-circle"></i>
                  Lower numbers appear first in lists. Leave empty for auto-assignment.
                </p>
              </div>
            </div>

            {apiError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <i className="fas fa-exclamation-circle"></i>
                  {apiError}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-6 pt-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 text-sm font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="sku-family-form"
              className="min-w-[160px] px-6 py-2.5 bg-[#0071E0] text-white rounded-lg hover:bg-blue-600 transition duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
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
                  <span>Saving...</span>
                </>
              ) : editItem ? (
                <>
                  <i className="fas fa-save"></i>
                  <span>Update SKU Family</span>
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i>
                  <span>Create SKU Family</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkuFamilyModal;

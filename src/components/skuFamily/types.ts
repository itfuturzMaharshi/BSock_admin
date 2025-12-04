export interface SkuFamily {
  _id?: string;
  code: string;
  name: string;
  brand?: string | { _id?: string; title?: string; code?: string };
  productcategoriesId?: string | { _id?: string; title?: string; code?: string };
  conditionCategoryId?: string | { _id?: string; title?: string; code?: string };
  subModel?: string;
  storageId?: string | { _id?: string; title?: string; code?: string };
  ramId?: string | { _id?: string; title?: string; code?: string };
  colorId?: string | { _id?: string; title?: string; code?: string };
  description: string;
  images: string[];
  sequence?: number;
  isApproved?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  approvedBy?: string | null;
  __v?: string;
}

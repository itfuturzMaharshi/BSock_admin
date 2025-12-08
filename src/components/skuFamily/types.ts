export interface SubSkuFamily {
  _id?: string;
  subName: string;
  storageId?: string | { _id?: string; title?: string; code?: string };
  ramId?: string | { _id?: string; title?: string; code?: string };
  colorId?: string | { _id?: string; title?: string; code?: string };
  subSkuCode?: string;
  images: string[];
  videos: string[];
  subSkuSequence?: number;
}

export interface SkuFamily {
  _id?: string;
  code: string;
  name: string;
  brand?: string | { _id?: string; title?: string; code?: string };
  productcategoriesId?: string | { _id?: string; title?: string; code?: string };
  conditionCategoryId?: string | { _id?: string; title?: string; code?: string };
  sequence?: number;
  subSkuFamilies?: SubSkuFamily[];
  isApproved?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  approvedBy?: string | null;
  __v?: string;
}

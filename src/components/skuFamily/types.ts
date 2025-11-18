export interface SkuFamily {
  _id?: string;
  id?: string;
  code: string;
  name: string;
  brand: string;
  description: string;
  images: string[];
  colorVariant: string | string[];
  country: string | string[];
  simType: string | string[];
  networkBands: string | string[];
  countryVariant?: string;
  sequence?: number;
  isApproved?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  approvedBy?: string | null;
  __v?: string;
}

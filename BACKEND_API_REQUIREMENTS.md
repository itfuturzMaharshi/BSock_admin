# Backend API Requirements for Seller Product Permission System

This document lists all the backend API endpoints that need to be implemented for the seller product permission system to work fully.

## Seller Product Permission APIs

### 1. Get Seller Product Permissions
**Endpoint:** `POST /api/admin/seller-product-permission/get`

**Request Body:**
```json
{
  "sellerId": "string | null"  // null for global permissions, seller ID for specific seller
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "_id": "string",
    "sellerId": "string | null",
    "permissions": [
      {
        "fieldName": "string",
        "label": "string",
        "hasPermission": boolean,
        "isRequired": boolean,
        "group": "productDetail | pricing | otherInfo"
      }
    ],
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
}
```

**Notes:**
- If no permissions exist, return 404 (frontend will handle gracefully)
- If `sellerId` is null, return global permissions
- If `sellerId` is provided, return seller-specific permissions (or global if seller-specific doesn't exist)

---

### 2. Update Seller Product Permissions
**Endpoint:** `POST /api/admin/seller-product-permission/update`

**Request Body:**
```json
{
  "sellerId": "string | null",  // null for global permissions
  "permissions": [
    {
      "fieldName": "string",
      "label": "string",
      "hasPermission": boolean,
      "isRequired": boolean,
      "group": "productDetail | pricing | otherInfo"
    }
  ]
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Seller product permissions updated successfully!",
  "data": {
    "_id": "string",
    "sellerId": "string | null",
    "permissions": [...],
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
}
```

**Notes:**
- Create if doesn't exist, update if exists
- Validate that required fields always have permission
- If `sellerId` is null, save as global permissions

---

### 3. Get Current Seller Permissions (for Seller Panel)
**Endpoint:** `POST /api/seller/product-permission/get`

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "permissions": [
      {
        "fieldName": "string",
        "label": "string",
        "hasPermission": boolean,
        "isRequired": boolean,
        "group": "productDetail | pricing | otherInfo"
      }
    ]
  }
}
```

**Notes:**
- Get permissions for the currently logged-in seller
- First check seller-specific permissions, then fall back to global permissions
- Return only fields where `hasPermission: true`

---

## Seller Product Request APIs

### 4. Create Seller Product Request
**Endpoint:** `POST /api/seller/product/create-request`

**Request Body:**
```json
{
  "skuFamilyId": "string",
  "gradeId": "string | null",
  "specification": "string",
  "simType": "string",
  "color": "string",
  "ram": "string",
  "storage": "string",
  "weight": "number | null",
  "condition": "string | null",
  "stock": "number",
  "country": "string | null",
  "moq": "number",
  "purchaseType": "string",
  "isNegotiable": boolean,
  "isFlashDeal": "string",
  "startTime": "ISO string",
  "expiryTime": "ISO string",
  "groupCode": "string | null",
  "sequence": "number | null",
  "countryDeliverables": [
    {
      "country": "string",
      "currency": "USD | HKD | AED",
      "basePrice": "number",
      "calculatedPrice": "number | null",
      "exchangeRate": "number | null",
      "paymentTerm": "string | null",
      "paymentMethod": "string | null",
      "margins": [],
      "costs": [],
      "charges": []
    }
  ],
  "supplierListingNumber": "string",
  "packing": "string",
  "currentLocation": "string",
  "deliveryLocation": ["string"],
  "customMessage": "string",
  "paymentTerm": "string | null",
  "paymentMethod": "string | null",
  "shippingTime": "string",
  "deliveryTime": "string",
  "vendor": "string | null",
  "vendorListingNo": "string",
  "carrier": "string | null",
  "carrierListingNo": "string",
  "uniqueListingNo": "string",
  "tags": "string",
  "remark": "string",
  "warranty": "string",
  "batteryHealth": "string",
  "lockUnlock": boolean,
  "isSellerRequest": true,
  "status": "pending"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Product request submitted successfully!",
  "data": {
    "_id": "string",
    ...productData
  }
}
```

**Notes:**
- Set `isSellerRequest: true` and `status: "pending"`
- Automatically set `sellerId` from authenticated seller
- Don't set `isVerified` or `isApproved` (admin will do this)

---

### 5. Get Seller Product Requests (Admin)
**Endpoint:** `POST /api/admin/product/seller-requests`

**Request Body:**
```json
{
  "page": "number",
  "limit": "number",
  "search": "string | undefined"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "docs": [
      {
        "_id": "string",
        ...productData,
        "isSellerRequest": true,
        "status": "pending"
      }
    ],
    "totalDocs": "number",
    "limit": "number",
    "page": "number",
    "totalPages": "number",
    "hasNextPage": boolean,
    "hasPrevPage": boolean,
    "prevPage": "number | null",
    "nextPage": "number | null"
  }
}
```

**Notes:**
- Return only products where `isSellerRequest: true` and `status: "pending"`
- Support pagination and search

---

### 6. Update Seller Product Request (Admin)
**Endpoint:** `POST /api/admin/product/update-seller-request`

**Request Body:**
```json
{
  "id": "string",
  "skuFamilyId": "string",
  "specification": "string",
  "simType": "string",
  "color": "string",
  "ram": "string",
  "storage": "string",
  "condition": "string | null",
  "stock": "number",
  "country": "string | null",
  "moq": "number",
  "isNegotiable": boolean,
  "isFlashDeal": boolean,
  "startTime": "ISO string",
  "expiryTime": "ISO string",
  "countryDeliverables": [
    {
      "country": "string",
      "currency": "USD | HKD | AED",
      "basePrice": "number",
      "calculatedPrice": "number | null",
      "exchangeRate": "number | null",
      "margins": [],
      "costs": [],
      "charges": []
    }
  ],
  ...otherFields
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Product request updated successfully!",
  "data": {
    "_id": "string",
    ...updatedProductData
  }
}
```

**Notes:**
- Update product with admin-added fields
- Can add cost, margin, and other fields that seller doesn't have permission for

---

### 7. Reject Seller Product Request
**Endpoint:** `POST /api/admin/product/reject-seller-request`

**Request Body:**
```json
{
  "id": "string",
  "reason": "string | undefined"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Product request rejected successfully!",
  "data": {
    "_id": "string",
    "status": "rejected",
    "rejectionReason": "string"
  }
}
```

**Notes:**
- Set product status to "rejected"
- Store rejection reason if provided
- Optionally notify seller

---

## Database Schema Requirements

### SellerProductPermission Collection
```javascript
{
  _id: ObjectId,
  sellerId: ObjectId | null,  // null for global permissions
  permissions: [
    {
      fieldName: String,
      label: String,
      hasPermission: Boolean,
      isRequired: Boolean,
      group: String  // 'productDetail' | 'pricing' | 'otherInfo'
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Product Collection Updates
Add these fields to existing Product schema:
```javascript
{
  isSellerRequest: Boolean,  // true if created by seller
  status: String,  // 'pending' | 'approved' | 'rejected'
  rejectionReason: String  // if rejected
}
```

---

## Implementation Notes

1. **Permission Priority:**
   - Seller-specific permissions override global permissions
   - If seller has no specific permissions, use global permissions
   - Required fields must always have permission

2. **Product Request Flow:**
   - Seller creates product → `isSellerRequest: true`, `status: "pending"`
   - Admin reviews → can add missing fields, cost, margin
   - Admin approves → `status: "approved"`, `isApproved: true`
   - Admin rejects → `status: "rejected"`, store reason

3. **Frontend Fallback:**
   - Frontend uses localStorage as fallback when backend endpoints are not available
   - Permissions work locally until backend is implemented
   - Backend should be implemented for production use

---

## Testing Checklist

- [ ] Get global permissions (sellerId: null)
- [ ] Get seller-specific permissions
- [ ] Update global permissions
- [ ] Update seller-specific permissions
- [ ] Create seller product request
- [ ] Get seller product requests (admin)
- [ ] Update seller product request (admin)
- [ ] Reject seller product request
- [ ] Verify required fields validation
- [ ] Test permission priority (seller > global)

export interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  quantity?: number;
  category?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

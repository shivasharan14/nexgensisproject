import axiosInstance from "./axiosInstance";

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  thumbnail: string;
  images: string[];

  reviews?: {
    rating: number;
    comment: string;
    date: string;
    reviewerName: string;
    reviewerEmail: string;
  }[];
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface ProductInput {
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
}

// Get products
export const getProducts = async (
  limit: number,
  skip: number
): Promise<ProductsResponse> => {
  const response = await axiosInstance.get<ProductsResponse>(
    `/products?limit=${limit}&skip=${skip}`
  );

  return response.data;
};

// Search products
export const searchProducts = async (
  query: string,
  limit: number,
  skip: number,
  signal?: AbortSignal
): Promise<ProductsResponse> => {
  const response = await axiosInstance.get<ProductsResponse>(
    `/products/search?q=${encodeURIComponent(
      query
    )}&limit=${limit}&skip=${skip}`,
    { signal }
  );

  return response.data;
};

// Get categories
export const getCategories = async (): Promise<string[]> => {
  const response = await axiosInstance.get<string[]>(
    "/products/category-list"
  );

  return response.data;
};

// Get products by category
export const getProductsByCategory = async (
  category: string,
  limit: number,
  skip: number
): Promise<ProductsResponse> => {
  const response = await axiosInstance.get<ProductsResponse>(
    `/products/category/${encodeURIComponent(
      category
    )}?limit=${limit}&skip=${skip}`
  );

  return response.data;
};

// Get single product
export const getProductById = async (
  id: number
): Promise<Product> => {
  const response = await axiosInstance.get<Product>(
    `/products/${id}`
  );

  return response.data;
};

// Add product
export const addProduct = async (
  product: ProductInput
): Promise<Product> => {
  const response = await axiosInstance.post<Product>(
    "/products/add",
    product
  );

  return response.data;
};

// Update product
export const updateProduct = async (
  id: number,
  product: ProductInput
): Promise<Product> => {
  const response = await axiosInstance.put<Product>(
    `/products/${id}`,
    product
  );

  return response.data;
};

// Delete product
export const deleteProduct = async (
  id: number
): Promise<Product> => {
  const response = await axiosInstance.delete<Product>(
    `/products/${id}`
  );

  return response.data;
};
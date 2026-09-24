
"use client";

import {
  Suspense,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addProduct,
  deleteProduct,
  getCategories,
  getProducts,
  getProductsByCategory,
  searchProducts,
  updateProduct,
  Product,
} from "../../api/productApi";

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Product form states
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] =
    useState<number | null>(null);

  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    stock: "",
  });

  // URL parameters
  const pageParam = Number(searchParams.get("page"));
  const sizeParam = Number(searchParams.get("size"));

  const page =
    Number.isInteger(pageParam) && pageParam > 0
      ? pageParam
      : 1;

  const pageSize =
    [10, 20, 50].includes(sizeParam)
      ? sizeParam
      : 10;

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";

  const [searchInput, setSearchInput] =
    useState(search);

  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize)
  );

  // --------------------------------------------------
  // Authentication
  // --------------------------------------------------

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  // --------------------------------------------------
  // Load Categories
  // --------------------------------------------------

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch {
        console.error("Category loading failed");
      }
    };

    loadCategories();
  }, []);

  // --------------------------------------------------
  // Sync search input with URL
  // --------------------------------------------------

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // --------------------------------------------------
  // Debounced Search
  // --------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateUrl({
          search: searchInput,
          page: 1,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // --------------------------------------------------
  // Load Products
  // --------------------------------------------------

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const skip = (page - 1) * pageSize;

        let data: {
          products: Product[];
          total: number;
        };

        if (search) {
          data = await searchProducts(
            search,
            pageSize,
            skip,
            controller.signal
          );
        } else if (category) {
          data = await getProductsByCategory(
            category,
            pageSize,
            skip
          );
        } else {
          data = await getProducts(
            pageSize,
            skip
          );
        }

        if (controller.signal.aborted) {
          return;
        }

        // --------------------------------------------------
        // Handle page=999 or any page beyond available pages
        // --------------------------------------------------

        const maxPage = Math.max(
          1,
          Math.ceil(data.total / pageSize)
        );

        if (page > maxPage) {
          const params = new URLSearchParams();

          params.set("page", "1");
          params.set("size", String(pageSize));

          if (search) {
            params.set("search", search);
          }

          if (category) {
            params.set("category", category);
          }

          if (sort) {
            params.set("sort", sort);
          }

          router.replace(
            `/products?${params.toString()}`
          );

          return;
        }

        setProducts(data.products);
        setTotal(data.total);
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.name === "CanceledError"
        ) {
          return;
        }

        if (controller.signal.aborted) {
          return;
        }

        setError("Failed to load products.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      controller.abort();
    };
  }, [
    page,
    pageSize,
    search,
    category,
    router,
    sort,
  ]);

  // --------------------------------------------------
  // Sort Products
  // --------------------------------------------------

  const sortedProducts = [...products].sort(
    (a, b) => {
      if (sort === "price-asc") {
        return a.price - b.price;
      }

      if (sort === "price-desc") {
        return b.price - a.price;
      }

      if (sort === "rating-desc") {
        return b.rating - a.rating;
      }

      if (sort === "rating-asc") {
        return a.rating - b.rating;
      }

      if (sort === "title-asc") {
        return a.title.localeCompare(b.title);
      }

      if (sort === "title-desc") {
        return b.title.localeCompare(a.title);
      }

      return 0;
    }
  );

  // --------------------------------------------------
  // URL Update
  // --------------------------------------------------

  const updateUrl = ({
    page: newPage = page,
    search: newSearch = search,
    category: newCategory = category,
    sort: newSort = sort,
  }: {
    page?: number;
    search?: string;
    category?: string;
    sort?: string;
  }) => {
    const params = new URLSearchParams();

    params.set("page", String(newPage));
    params.set("size", String(pageSize));

    if (newSearch) {
      params.set("search", newSearch);
    }

    if (newCategory) {
      params.set("category", newCategory);
    }

    if (newSort) {
      params.set("sort", newSort);
    }

    router.push(
      `/products?${params.toString()}`
    );
  };

  // --------------------------------------------------
  // Pagination
  // --------------------------------------------------

  const changePage = (newPage: number) => {
    if (newPage < 1) return;
    if (newPage > totalPages) return;

    updateUrl({
      page: newPage,
    });
  };

  const changePageSize = (newSize: number) => {
    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("size", String(newSize));

    if (search) {
      params.set("search", search);
    }

    if (category) {
      params.set("category", category);
    }

    if (sort) {
      params.set("sort", sort);
    }

    router.push(
      `/products?${params.toString()}`
    );
  };

  // --------------------------------------------------
  // Category
  // --------------------------------------------------

  const handleCategoryChange = (
    value: string
  ) => {
    updateUrl({
      category: value,
      page: 1,
    });
  };

  // --------------------------------------------------
  // Sort
  // --------------------------------------------------

  const handleSortChange = (
    value: string
  ) => {
    updateUrl({
      sort: value,
      page: 1,
    });
  };

  // --------------------------------------------------
  // Add Product Form
  // --------------------------------------------------

  const openAddForm = () => {
    setEditingProduct(null);

    setForm({
      title: "",
      description: "",
      category: "",
      price: "",
      stock: "",
    });

    setFormError("");
    setShowForm(true);
  };

  // --------------------------------------------------
  // Edit Product Form
  // --------------------------------------------------

  const openEditForm = (
    product: Product
  ) => {
    setEditingProduct(product);

    setForm({
      title: product.title,
      description: product.description,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
    });

    setFormError("");
    setShowForm(true);
  };

  // --------------------------------------------------
  // Close Form
  // --------------------------------------------------

  const closeForm = () => {
    if (formLoading) return;

    setShowForm(false);
    setEditingProduct(null);
    setFormError("");
  };

  // --------------------------------------------------
  // Form Input Change
  // --------------------------------------------------

  const handleFormChange = (
    e: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // Save Product
  // --------------------------------------------------

  const handleSaveProduct = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    // Prevent multiple rapid clicks
    if (formLoading) return;

    const title = form.title.trim();
    const description =
      form.description.trim();
    const categoryValue =
      form.category.trim();

    const price = Number(form.price);
    const stock = Number(form.stock);

    // Validation
    if (!title) {
      setFormError(
        "Product title is required."
      );
      return;
    }

    if (!description) {
      setFormError(
        "Description is required."
      );
      return;
    }

    if (!categoryValue) {
      setFormError(
        "Category is required."
      );
      return;
    }

    if (
      !form.price ||
      Number.isNaN(price) ||
      price <= 0
    ) {
      setFormError(
        "Price must be greater than 0."
      );
      return;
    }

    if (
      !form.stock ||
      Number.isNaN(stock) ||
      stock < 0
    ) {
      setFormError(
        "Stock cannot be negative."
      );
      return;
    }

    setFormLoading(true);
    setFormError("");

    const productData = {
      title,
      description,
      category: categoryValue,
      price,
      stock,
    };

    try {
      // --------------------------------------------------
      // Edit
      // --------------------------------------------------

      if (editingProduct) {
        const updatedProduct =
          await updateProduct(
            editingProduct.id,
            productData
          );

        setProducts((previous) =>
          previous.map((product) =>
            product.id ===
            editingProduct.id
              ? {
                  ...product,
                  ...updatedProduct,
                  title,
                  description,
                  category:
                    categoryValue,
                  price,
                  stock,
                }
              : product
          )
        );
      }

      // --------------------------------------------------
      // Add
      // --------------------------------------------------

      else {
        const newProduct =
          await addProduct(productData);

        const productToAdd: Product = {
          ...newProduct,
          title,
          description,
          category: categoryValue,
          price,
          stock,

          thumbnail:
            newProduct.thumbnail ||
            "https://cdn.dummyjson.com/product-images/1/thumbnail.jpg",

          images:
            newProduct.images || [],
        };

        setProducts((previous) => [
          productToAdd,
          ...previous,
        ]);

        setTotal(
          (previous) => previous + 1
        );
      }

      setShowForm(false);
      setEditingProduct(null);
      setFormError("");
    } catch {
      setFormError(
        editingProduct
          ? "Failed to update product."
          : "Failed to add product."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // --------------------------------------------------
  // Delete Product
  // --------------------------------------------------

  const handleDeleteProduct = async (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this product?"
      );

    if (!confirmed) return;

    // Prevent multiple delete requests
    if (deleteLoading !== null) return;

    setDeleteLoading(id);

    try {
      await deleteProduct(id);

      setProducts((previous) =>
        previous.filter(
          (product) =>
            product.id !== id
        )
      );

      setTotal(
        (previous) =>
          Math.max(0, previous - 1)
      );
    } catch {
      alert(
        "Failed to delete product."
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  // --------------------------------------------------
  // Pagination Display
  // --------------------------------------------------

  const start =
    total === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const end = Math.min(
    page * pageSize,
    total
  );

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600">
          Loading products...
        </p>
      </main>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <div className="rounded-xl bg-white p-10 text-center shadow">
          <p className="mb-4 text-red-600">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Products
            </h1>

            <p className="text-gray-500">
              Manage your product inventory
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openAddForm}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
            >
              + Add Product
            </button>

            <button
              onClick={() => {
                localStorage.removeItem(
                  "token"
                );
                localStorage.removeItem(
                  "user"
                );

                router.push("/login");
              }}
              className="rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search / Filter / Sort */}
        <div className="mb-5 grid gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-3">

          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search products
            </label>

            <input
              type="text"
              value={searchInput}
              onChange={(e) =>
                setSearchInput(
                  e.target.value
                )
              }
              placeholder="Search by product name..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Category
            </label>

            <select
              value={category}
              onChange={(e) =>
                handleCategoryChange(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
            >
              <option value="">
                All Categories
              </option>

              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Sort by
            </label>

            <select
              value={sort}
              onChange={(e) =>
                handleSortChange(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
            >
              <option value="">
                Default
              </option>

              <option value="price-asc">
                Price: Low to High
              </option>

              <option value="price-desc">
                Price: High to Low
              </option>

              <option value="rating-desc">
                Rating: High to Low
              </option>

              <option value="rating-asc">
                Rating: Low to High
              </option>

              <option value="title-asc">
                Title: A to Z
              </option>

              <option value="title-desc">
                Title: Z to A
              </option>
            </select>
          </div>
        </div>

        {/* Page Information */}
        <div className="mb-5 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <strong>
              {start}–{end}
            </strong>{" "}
            of{" "}
            <strong>{total}</strong>
          </p>

          <select
            value={pageSize}
            onChange={(e) =>
              changePageSize(
                Number(e.target.value)
              )
            }
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value={10}>
              10
            </option>

            <option value={20}>
              20
            </option>

            <option value={50}>
              50
            </option>
          </select>
        </div>

        {/* Empty State */}
        {sortedProducts.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <h2 className="text-xl font-semibold">
              No products found
            </h2>

            <p className="mt-2 text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-xl bg-white shadow md:block">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Product
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Category
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Price
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Rating
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Stock
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {sortedProducts.map(
                    (product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50"
                      >
                        {/* Product */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={
                                product.thumbnail
                              }
                              alt={
                                product.title
                              }
                              className="h-14 w-14 rounded-lg object-cover"
                            />

                            <button
                              onClick={() =>
                                router.push(
                                  `/products/${product.id}`
                                )
                              }
                              className="text-left font-medium hover:text-blue-600"
                            >
                              {
                                product.title
                              }
                            </button>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4 text-gray-600">
                          {
                            product.category
                          }
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 font-medium">
                          $
                          {
                            product.price
                          }
                        </td>

                        {/* Rating */}
                        <td className="px-6 py-4">
                          ⭐{" "}
                          {
                            product.rating
                          }
                        </td>

                        {/* Stock */}
                        <td className="px-6 py-4">
                          {
                            product.stock
                          }
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                openEditForm(
                                  product
                                )
                              }
                              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteProduct(
                                  product.id
                                )
                              }
                              disabled={
                                deleteLoading ===
                                product.id
                              }
                              className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              {deleteLoading ===
                              product.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
              {sortedProducts.map(
                (product) => (
                  <div
                    key={product.id}
                    className="rounded-xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <img
                        src={
                          product.thumbnail
                        }
                        alt={
                          product.title
                        }
                        className="h-20 w-20 rounded-lg object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() =>
                            router.push(
                              `/products/${product.id}`
                            )
                          }
                          className="text-left font-medium hover:text-blue-600"
                        >
                          {
                            product.title
                          }
                        </button>

                        <p className="text-sm text-gray-500">
                          {
                            product.category
                          }
                        </p>

                        <p className="mt-1 font-medium">
                          $
                          {
                            product.price
                          }
                        </p>

                        <p className="text-sm">
                          ⭐{" "}
                          {
                            product.rating
                          }{" "}
                          · Stock:{" "}
                          {
                            product.stock
                          }
                        </p>
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="mt-4 flex gap-2 border-t pt-3">
                      <button
                        onClick={() =>
                          openEditForm(
                            product
                          )
                        }
                        className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteProduct(
                            product.id
                          )
                        }
                        disabled={
                          deleteLoading ===
                          product.id
                        }
                        className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deleteLoading ===
                        product.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() =>
                changePage(page - 1)
              }
              className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from(
              {
                length: totalPages,
              },
              (_, index) => {
                const pageNumber =
                  index + 1;

                return (
                  <button
                    key={pageNumber}
                    onClick={() =>
                      changePage(
                        pageNumber
                      )
                    }
                    className={`rounded-lg px-4 py-2 ${
                      pageNumber === page
                        ? "bg-blue-600 text-white"
                        : "border bg-white text-gray-700"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              }
            )}

            <button
              disabled={
                page === totalPages
              }
              onClick={() =>
                changePage(page + 1)
              }
              className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* --------------------------------------------------
          Add / Edit Product Modal
          -------------------------------------------------- */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingProduct
                    ? "Update product information"
                    : "Add a new product"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={formLoading}
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={
                handleSaveProduct
              }
              className="space-y-5"
            >
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Title
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={
                    handleFormChange
                  }
                  placeholder="Enter product title"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="Enter product description"
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Category / Price / Stock */}
              <div className="grid gap-4 md:grid-cols-3">

                {/* Category */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Category
                  </label>

                  <select
                    name="category"
                    value={
                      form.category
                    }
                    onChange={
                      handleFormChange
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Price
                  </label>

                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={
                      handleFormChange
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Stock
                  </label>

                  <input
                    name="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={
                      handleFormChange
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Form Error */}
              {formError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    formLoading
                  }
                  className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    formLoading
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {formLoading
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

// --------------------------------------------------
// Suspense boundary required for useSearchParams()
// --------------------------------------------------

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-100">
          <p className="text-lg text-gray-600">
            Loading products...
          </p>
        </main>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}


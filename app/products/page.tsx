"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getCategories,
  getProducts,
  getProductsByCategory,
  searchProducts,
  Product,
} from "../../api/productApi";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageParam = Number(searchParams.get("page"));
  const sizeParam = Number(searchParams.get("size"));

  const page =
    Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const pageSize =
    [10, 20, 50].includes(sizeParam) ? sizeParam : 10;

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";

  const [searchInput, setSearchInput] = useState(search);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Authentication
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Category loading failed");
      }
    };

    loadCategories();
  }, []);

  // Keep input synced with URL
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounce search
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
  }, [searchInput]);

  // Load products
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
          data = await getProducts(pageSize, skip);
        }

        if (controller.signal.aborted) return;

        setProducts(data.products);
        setTotal(data.total);
      } catch (error: any) {
        if (error.name === "CanceledError") return;

        if (controller.signal.aborted) return;

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
  }, [page, pageSize, search, category]);

  // Sort on client
  const sortedProducts = [...products].sort((a, b) => {
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
  });

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

    router.push(`/products?${params.toString()}`);
  };

  const changePage = (newPage: number) => {
    updateUrl({ page: newPage });
  };

  const changePageSize = (newSize: number) => {
    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("size", String(newSize));

    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);

    router.push(`/products?${params.toString()}`);
  };

  const handleCategoryChange = (value: string) => {
    updateUrl({
      category: value,
      page: 1,
    });
  };

  const handleSortChange = (value: string) => {
    updateUrl({
      sort: value,
      page: 1,
    });
  };

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-600">
          Loading products...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

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

          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              router.push("/login");
            }}
            className="rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
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
              onChange={(e) => setSearchInput(e.target.value)}
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
                handleCategoryChange(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
            >
              <option value="">All Categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
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
                handleSortChange(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
            >
              <option value="">Default</option>
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

        {/* Page information */}
        <div className="mb-5 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <strong>
              {start}–{end}
            </strong>{" "}
            of <strong>{total}</strong>
          </p>

          <select
            value={pageSize}
            onChange={(e) =>
              changePageSize(Number(e.target.value))
            }
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Empty */}
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
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {sortedProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="h-14 w-14 rounded-lg object-cover"
                          />

                          <button
  onClick={() => router.push(`/products/${product.id}`)}
  className="text-left font-medium hover:text-blue-600"
>
  {product.title}
</button>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {product.category}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        ${product.price}
                      </td>

                      <td className="px-6 py-4">
                        ⭐ {product.rating}
                      </td>

                      <td className="px-6 py-4">
                        {product.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="h-20 w-20 rounded-lg object-cover"
                    />

                    <div>
                      <button
  onClick={() => router.push(`/products/${product.id}`)}
  className="text-left font-medium hover:text-blue-600"
>
  {product.title}
</button>

                      <p className="text-sm text-gray-500">
                        {product.category}
                      </p>

                      <p className="mt-1 font-medium">
                        ${product.price}
                      </p>

                      <p className="text-sm">
                        ⭐ {product.rating} · Stock:{" "}
                        {product.stock}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => changePage(page - 1)}
              className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from(
              { length: totalPages },
              (_, index) => {
                const pageNumber = index + 1;

                return (
                  <button
                    key={pageNumber}
                    onClick={() => changePage(pageNumber)}
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
              disabled={page === totalPages}
              onClick={() => changePage(page + 1)}
              className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
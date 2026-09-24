"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProductById, Product } from "../../../api/productApi";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const loadProduct = async () => {
      try {
        const data = await getProductById(Number(params.id));

        setProduct(data);
      } catch (error) {
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600">
          Loading product...
        </p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <div className="rounded-xl bg-white p-10 text-center shadow">
          <h1 className="text-2xl font-bold text-gray-900">
            Product Not Found
          </h1>

          <p className="mt-2 text-gray-500">
            The product you are looking for does not exist.
          </p>

          <button
            onClick={() => router.push("/products")}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          ← Back
        </button>

        {/* Product Information */}
        <div className="overflow-hidden rounded-2xl bg-white shadow">

          <div className="grid gap-8 p-6 md:grid-cols-2 md:p-10">

            {/* Images */}
            <div>
              <img
                src={product.images?.[0] || product.thumbnail}
                alt={product.title}
                className="h-80 w-full rounded-xl bg-gray-50 object-contain"
              />

              <div className="mt-4 grid grid-cols-4 gap-3">
                {product.images?.slice(0, 4).map((image) => (
                  <img
                    key={image}
                    src={image}
                    alt={product.title}
                    className="h-20 w-full rounded-lg bg-gray-50 object-contain"
                  />
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <p className="text-sm font-medium uppercase text-blue-600">
                {product.category}
              </p>

              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                {product.title}
              </h1>

              <div className="mt-4 flex items-center gap-4">
                <span className="text-3xl font-bold">
                  ${product.price}
                </span>

                <span className="rounded-full bg-yellow-50 px-3 py-1 text-sm">
                  ⭐ {product.rating}
                </span>
              </div>

              <p className="mt-6 leading-7 text-gray-600">
                {product.description}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Stock
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {product.stock}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Product ID
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    #{product.id}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="border-t p-6 md:p-10">

            <h2 className="text-2xl font-bold">
              Reviews
            </h2>

            <div className="mt-5 space-y-4">

              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((review, index) => (
                  <div
                    key={index}
                    className="rounded-xl bg-gray-50 p-5"
                  >
                    <div className="flex items-center justify-between">

                      <p className="font-semibold">
                        {review.reviewerName}
                      </p>

                      <span>
                        ⭐ {review.rating}
                      </span>

                    </div>

                    <p className="mt-2 text-gray-600">
                      {review.comment}
                    </p>

                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  No reviews available.
                </p>
              )}

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
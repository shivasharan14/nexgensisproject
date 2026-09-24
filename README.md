# Product Admin Dashboard

A responsive Product Admin Dashboard built with Next.js, React, Tailwind CSS and Axios using the DummyJSON API.

## Live Demo

https://nexgensis-product-admin.onrender.com

## GitHub Repository

https://github.com/shivasharan14/nexgensisproject

## Tech Stack

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Axios
- DummyJSON API

## Features

### Authentication
- Login using DummyJSON authentication API
- Demo credentials:
  - Username: `emilys`
  - Password: `emilyspass`
- Token stored in localStorage
- Protected product pages
- Logout functionality
- Prevents multiple login requests while login is in progress

### Product Management
- Product listing with:
  - Product image
  - Title
  - Category
  - Price
  - Rating
  - Stock
- Responsive desktop table
- Responsive mobile card layout
- Product details page
- Product reviews
- Add product
- Edit product
- Delete product
- Delete confirmation

### Search, Filter and Sort
- Product search using DummyJSON search API
- 500ms debounce for search
- Previous search request is cancelled using AbortController
- Category filtering
- Price sorting
- Rating sorting
- Title sorting
- Search, category and sorting state are stored in the URL

### Pagination
- Server-side pagination using `limit` and `skip`
- Page sizes:
  - 10
  - 20
  - 50
- Previous and Next buttons
- Page number navigation
- Showing range such as `Showing 1–20 of 194`

### Error and Loading Handling
- Loading states
- Empty states
- API error states
- Retry option
- Invalid page values are handled safely
- Invalid product IDs show a Product Not Found state

## API

This project uses the DummyJSON API:

- Authentication: `/auth/login`
- Products: `/products`
- Search: `/products/search`
- Categories: `/products/category-list`
- Category products: `/products/category/{category}`
- Product details: `/products/{id}`
- Add product: `/products/add`
- Update product: `/products/{id}`
- Delete product: `/products/{id}`

## Engineering Decisions

### Search and Category Filtering

The DummyJSON API does not support combining search and category filtering in a single request.

The application therefore treats search and category as separate API operations. When both values are present in the URL, search takes priority and the search endpoint is used.

This avoids making unsupported API requests and keeps the API logic predictable.

### Add, Edit and Delete Persistence

DummyJSON simulates Add, Edit and Delete API operations but does not permanently persist the changes.

To provide a realistic user experience, the application updates the local React state after a successful API response.

Therefore:

- Add immediately appears in the product list.
- Edit immediately updates the product.
- Delete immediately removes the product.

After a browser refresh, the original DummyJSON data is loaded again because the API does not persist these changes.

### Fast Search Handling

Search uses a 500ms debounce to avoid sending a request for every keystroke.

AbortController is used to cancel the previous request when a newer search request starts. This prevents an older API response from overwriting the latest search results.

### URL State

Page, page size, search, category and sorting values are stored in the URL.

Example:

`/products?page=1&size=20&search=phone&category=smartphones&sort=price-asc`

This makes the current product view shareable and keeps browser navigation useful.

### Invalid URL Handling

Invalid values such as:

`?page=abc`

are safely converted to page 1.

If a page number is greater than the available number of pages, the application redirects to a valid page instead of breaking.

## Project Structure

```text
product-admin-dashboard/
│
├── api/
│   ├── axiosInstance.ts
│   ├── authApi.ts
│   └── productApi.ts
│
├── app/
│   ├── login/
│   │   └── page.tsx
│   │
│   ├── products/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── public/
├── package.json
└── README.md
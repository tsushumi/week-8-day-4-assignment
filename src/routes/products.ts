import { Request, Response, Router } from 'express';
import { ApiResponse, CreateProductRequest, Product } from '../types';

const DEFAULT_QUANTITY = 0;
const DEFAULT_CATEGORY = 'general';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
} as const;

const router = Router();

const products: Product[] = [
  { id: 1, name: 'Laptop', price: 45000, quantity: 10, category: 'electronics' },
  { id: 2, name: 'Headphones', price: 3500, quantity: 25, category: 'electronics' },
  { id: 3, name: 'Notebook', price: 150, quantity: 100, category: 'stationery' },
  { id: 4, name: 'Pen', price: 50, quantity: 200, category: 'stationery' },
  { id: 5, name: 'Backpack', price: 2500, quantity: 15, category: 'accessories' },
  { id: 6, name: 'USB Cable', price: 500, quantity: 50, category: 'electronics' },
];
let nextId: number = products.length + 1;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

/** Returns a validation error message, or null when the body is valid. */
const validateCreateRequest = (body: Partial<CreateProductRequest> | undefined): string | null => {
  if (!body) {
    return 'Request body is required';
  }
  if (!isNonEmptyString(body.name)) {
    return 'name is required and must be a non-empty string';
  }
  if (body.price === undefined || body.price === null) {
    return 'price is required';
  }
  if (!isPositiveNumber(body.price)) {
    return 'price must be a positive number';
  }
  if (body.quantity !== undefined && !isNonNegativeInteger(body.quantity)) {
    return 'quantity must be a non-negative integer';
  }
  if (body.category !== undefined && !isNonEmptyString(body.category)) {
    return 'category must be a non-empty string';
  }
  return null;
};

// GET /api/products
router.get('/', (_req: Request, res: Response<ApiResponse<Product[]>>) => {
  res.status(HTTP_STATUS.OK).json({ success: true, data: products });
});

// POST /api/products
router.post(
  '/',
  (
    req: Request<Record<string, never>, ApiResponse<Product>, CreateProductRequest>,
    res: Response<ApiResponse<Product>>,
  ) => {
    const validationError = validateCreateRequest(req.body);
    if (validationError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: validationError });
      return;
    }

    const { name, price, quantity, category } = req.body;
    const product: Product = {
      id: nextId,
      name: name.trim(),
      price,
      quantity: quantity ?? DEFAULT_QUANTITY,
      category: category ?? DEFAULT_CATEGORY,
    };
    nextId += 1;
    products.push(product);

    res.status(HTTP_STATUS.CREATED).json({ success: true, data: product });
  },
);

// GET /api/products/:id
router.get('/:id', (req: Request<{ id: string }>, res: Response<ApiResponse<Product>>) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ success: false, error: 'Product id must be a number' });
    return;
  }

  const product = products.find((item) => item.id === id);
  if (!product) {
    res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, error: `Product with id ${id} not found` });
    return;
  }

  res.status(HTTP_STATUS.OK).json({ success: true, data: product });
});

export default router;

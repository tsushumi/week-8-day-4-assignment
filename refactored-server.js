const express = require('express');
const cors = require('cors');

const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const DEFAULT_QUANTITY = 0;
const DEFAULT_CATEGORY = 'general';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

const app = express();
app.use(cors());
app.use(express.json());

// Data
const products = [
  { id: 1, name: 'Laptop', price: 45000, quantity: 10, category: 'electronics' },
  { id: 2, name: 'Headphones', price: 3500, quantity: 25, category: 'electronics' },
  { id: 3, name: 'Notebook', price: 150, quantity: 100, category: 'stationery' },
  { id: 4, name: 'Pen', price: 50, quantity: 200, category: 'stationery' },
  { id: 5, name: 'Backpack', price: 2500, quantity: 15, category: 'accessories' },
  { id: 6, name: 'USB Cable', price: 500, quantity: 50, category: 'electronics' },
];
let nextId = products.length + 1;

// Helpers
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const sendSuccess = (res, data, statusCode = HTTP_STATUS.OK) =>
  res.status(statusCode).json({ success: true, data });

const parseId = (rawId) => {
  const id = parseInt(rawId, 10);
  if (Number.isNaN(id)) {
    throw new HttpError(HTTP_STATUS.BAD_REQUEST, 'Product id must be a number');
  }
  return id;
};

const findProductIndexById = (rawId) => {
  const id = parseId(rawId);
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) {
    throw new HttpError(HTTP_STATUS.NOT_FOUND, `Product with id ${id} not found`);
  }
  return index;
};

const findProductById = (rawId) => products[findProductIndexById(rawId)];

const isPositiveNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const isNonNegativeInteger = (value) => Number.isInteger(value) && value >= 0;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const validateNewProduct = (body) => {
  if (!isNonEmptyString(body.name)) {
    throw new HttpError(HTTP_STATUS.BAD_REQUEST, 'name is required and must be a non-empty string');
  }
  if (body.price === undefined || body.price === null) {
    throw new HttpError(HTTP_STATUS.BAD_REQUEST, 'price is required');
  }
  if (!isPositiveNumber(body.price)) {
    throw new HttpError(HTTP_STATUS.BAD_REQUEST, 'price must be a positive number');
  }
  if (body.quantity !== undefined && !isNonNegativeInteger(body.quantity)) {
    throw new HttpError(HTTP_STATUS.BAD_REQUEST, 'quantity must be a non-negative integer');
  }
  if (body.category !== undefined && !isNonEmptyString(body.category)) {
    throw new HttpError(HTTP_STATUS.BAD_REQUEST, 'category must be a non-empty string');
  }
};

const validateProductUpdate = (body) => {
  if (body.name !== undefined && !isNonEmptyString(body.name)) {
    throw new HttpError(HTTP_STATUS.BAD_REQUEST, 'name must be a non-empty string');
  }
  if (body.price !== undefined && !isPositiveNumber(body.price)) {
    throw new HttpError(HTTP_STATUS.BAD_REQUEST, 'price must be a positive number');
  }
  if (body.quantity !== undefined && !isNonNegativeInteger(body.quantity)) {
    throw new HttpError(HTTP_STATUS.BAD_REQUEST, 'quantity must be a non-negative integer');
  }
  if (body.category !== undefined && !isNonEmptyString(body.category)) {
    throw new HttpError(HTTP_STATUS.BAD_REQUEST, 'category must be a non-empty string');
  }
};

const parsePriceFilter = (rawValue, label) => {
  if (rawValue === undefined || rawValue === '') {
    return undefined;
  }
  const value = Number(rawValue);
  if (Number.isNaN(value)) {
    throw new HttpError(HTTP_STATUS.BAD_REQUEST, `${label} must be a number`);
  }
  return value;
};

// Wraps a route handler so every error is caught and forwarded to the error middleware.
const handleRoute = (handler) => (req, res, next) => {
  try {
    handler(req, res);
  } catch (error) {
    next(error);
  }
};

// Routes
app.get(
  '/api/items',
  handleRoute((req, res) => {
    const { category } = req.query;
    const minPrice = parsePriceFilter(req.query.min, 'min');
    const maxPrice = parsePriceFilter(req.query.max, 'max');

    let result = products;
    if (category) {
      result = result.filter((product) => product.category === category);
    }
    if (minPrice !== undefined) {
      result = result.filter((product) => product.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      result = result.filter((product) => product.price <= maxPrice);
    }
    sendSuccess(res, result);
  }),
);

app.get(
  '/api/items/:id',
  handleRoute((req, res) => {
    sendSuccess(res, findProductById(req.params.id));
  }),
);

app.post(
  '/api/items',
  handleRoute((req, res) => {
    const body = req.body || {};
    validateNewProduct(body);

    const product = {
      id: nextId,
      name: body.name.trim(),
      price: body.price,
      quantity: body.quantity ?? DEFAULT_QUANTITY,
      category: body.category ?? DEFAULT_CATEGORY,
    };
    nextId += 1;
    products.push(product);
    sendSuccess(res, product, HTTP_STATUS.CREATED);
  }),
);

app.put(
  '/api/items/:id',
  handleRoute((req, res) => {
    const product = findProductById(req.params.id);
    const body = req.body || {};
    validateProductUpdate(body);

    product.name = body.name !== undefined ? body.name.trim() : product.name;
    product.price = body.price ?? product.price;
    product.quantity = body.quantity ?? product.quantity;
    product.category = body.category ?? product.category;
    sendSuccess(res, product);
  }),
);

app.delete(
  '/api/items/:id',
  handleRoute((req, res) => {
    const index = findProductIndexById(req.params.id);
    const [deleted] = products.splice(index, 1);
    sendSuccess(res, deleted);
  }),
);

app.get(
  '/api/stats',
  handleRoute((req, res) => {
    const totalValue = products.reduce((sum, product) => sum + product.price * product.quantity, 0);
    const categories = products.reduce((counts, product) => {
      counts[product.category] = (counts[product.category] || 0) + 1;
      return counts;
    }, {});
    sendSuccess(res, { totalValue, categories, itemCount: products.length });
  }),
);

// Error handling
app.use((req, res, next) => {
  next(new HttpError(HTTP_STATUS.NOT_FOUND, `Route ${req.method} ${req.originalUrl} not found`));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Malformed JSON bodies surface from express.json() as a SyntaxError with status 400.
  const statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message =
    statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR ? 'Internal server error' : err.message;

  if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(statusCode).json({ success: false, error: message });
});

// Start
if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

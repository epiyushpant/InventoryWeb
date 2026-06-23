export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5201/api';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function handleResponse(response: Response, defaultMessage: string) {
  if (!response.ok) {
    let message = defaultMessage;
    let errors: Record<string, string[]> | undefined = undefined;
    try {
      const text = await response.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (data && typeof data === 'object') {
            if (data.errors && typeof data.errors === 'object') {
              errors = data.errors;
              message = data.title || defaultMessage;
            } else if (Array.isArray(data) && data.length > 0 && 'description' in data[0]) {
              errors = { '': data.map((err) => err.description) };
              message = 'Validation failed';
            } else if (data.message) {
              message = data.message;
            } else if (data.error) {
              message = data.error;
            } else {
              message = JSON.stringify(data);
            }
          } else if (typeof data === 'string') {
            message = data;
          }
        } catch {
          message = text;
        }
      }
    } catch {}
    throw new ApiError(message, response.status, errors);
  }

  if (response.status === 204) {
    return response;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response;
}

export async function apiFetch(url: string, options: RequestInit = {}, defaultErrorMessage = 'Request failed') {
  const response = await fetch(url, options);
  return handleResponse(response, defaultErrorMessage);
}

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authApi = {
  login: async (loginData: any) => {
    return apiFetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
    }, 'Login failed');
  },

  register: async (registerData: any) => {
    return apiFetch(`${API_BASE_URL}/Auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    }, 'Registration failed');
  },
};

export const categoriesApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/Categories`, { headers: getAuthHeaders() }, 'Failed to fetch categories');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Categories/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch category');
  },
  create: async (category: any) => {
    return apiFetch(`${API_BASE_URL}/Categories`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(category) }, 'Failed to create category');
  },
  update: async (id: number, category: any) => {
    return apiFetch(`${API_BASE_URL}/Categories/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(category) }, 'Failed to update category');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete category');
  },
};

export const inventoriesApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/Inventories`, { headers: getAuthHeaders() }, 'Failed to fetch inventories');
  },
  getLookup: async () => {
    return apiFetch(`${API_BASE_URL}/Inventories/lookup`, { headers: getAuthHeaders() }, 'Failed to fetch inventory lookup');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Inventories/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch inventory');
  },
  create: async (inventory: any) => {
    return apiFetch(`${API_BASE_URL}/Inventories`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(inventory) }, 'Failed to create inventory');
  },
  update: async (id: number, inventory: any) => {
    return apiFetch(`${API_BASE_URL}/Inventories/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(inventory) }, 'Failed to update inventory');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Inventories/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete inventory');
  },
};

export const customersApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/Customers`, { headers: getAuthHeaders() }, 'Failed to fetch customers');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Customers/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch customer');
  },
  create: async (customer: any) => {
    return apiFetch(`${API_BASE_URL}/Customers`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(customer) }, 'Failed to create customer');
  },
  update: async (id: number, customer: any) => {
    return apiFetch(`${API_BASE_URL}/Customers/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(customer) }, 'Failed to update customer');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Customers/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete customer');
  },
};

export const locationsApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/Locations`, { headers: getAuthHeaders() }, 'Failed to fetch locations');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Locations/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch location');
  },
  create: async (location: any) => {
    return apiFetch(`${API_BASE_URL}/Locations`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(location) }, 'Failed to create location');
  },
  update: async (id: number, location: any) => {
    return apiFetch(`${API_BASE_URL}/Locations/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(location) }, 'Failed to update location');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Locations/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete location');
  },
};

export const suppliersApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/Suppliers`, { headers: getAuthHeaders() }, 'Failed to fetch suppliers');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Suppliers/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch supplier');
  },
  create: async (supplier: any) => {
    return apiFetch(`${API_BASE_URL}/Suppliers`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(supplier) }, 'Failed to create supplier');
  },
  update: async (id: number, supplier: any) => {
    return apiFetch(`${API_BASE_URL}/Suppliers/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(supplier) }, 'Failed to update supplier');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Suppliers/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete supplier');
  },
};

export const salesApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/Sales`, { headers: getAuthHeaders() }, 'Failed to fetch sales');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Sales/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch sale');
  },
  create: async (sale: any) => {
    return apiFetch(`${API_BASE_URL}/Sales`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(sale) }, 'Failed to create sale');
  },
  update: async (id: number, sale: any) => {
    return apiFetch(`${API_BASE_URL}/Sales/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(sale) }, 'Failed to update sale');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Sales/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete sale');
  },
};

export const saleDetailsApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/SaleDetails`, { headers: getAuthHeaders() }, 'Failed to fetch sale details');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/SaleDetails/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch sale detail');
  },
  create: async (detail: any) => {
    return apiFetch(`${API_BASE_URL}/SaleDetails`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(detail) }, 'Failed to create sale detail');
  },
  update: async (id: number, detail: any) => {
    return apiFetch(`${API_BASE_URL}/SaleDetails/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(detail) }, 'Failed to update sale detail');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/SaleDetails/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete sale detail');
  },
};

export const stockMovementsApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/StockMovements`, { headers: getAuthHeaders() }, 'Failed to fetch stock movements');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/StockMovements/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch stock movement');
  },
  create: async (movement: any) => {
    return apiFetch(`${API_BASE_URL}/StockMovements`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(movement) }, 'Failed to create stock movement');
  },
  update: async (id: number, movement: any) => {
    return apiFetch(`${API_BASE_URL}/StockMovements/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(movement) }, 'Failed to update stock movement');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/StockMovements/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete stock movement');
  },
};

export const productsApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/Products`, { headers: getAuthHeaders() }, 'Failed to fetch products');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Products/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch product');
  },
  create: async (product: any) => {
    return apiFetch(`${API_BASE_URL}/Products`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(product) }, 'Failed to create product');
  },
  update: async (id: number, product: any) => {
    return apiFetch(`${API_BASE_URL}/Products/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(product) }, 'Failed to update product');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/Products/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete product');
  },
};

export const purchaseOrdersApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/PurchaseOrders`, { headers: getAuthHeaders() }, 'Failed to fetch purchase orders');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/PurchaseOrders/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch purchase order');
  },
  create: async (order: any) => {
    return apiFetch(`${API_BASE_URL}/PurchaseOrders`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(order) }, 'Failed to create purchase order');
  },
  update: async (id: number, order: any) => {
    return apiFetch(`${API_BASE_URL}/PurchaseOrders/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(order) }, 'Failed to update purchase order');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/PurchaseOrders/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete purchase order');
  },
};

export const purchaseOrderDetailsApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/PurchaseOrderDetails`, { headers: getAuthHeaders() }, 'Failed to fetch purchase order details');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/PurchaseOrderDetails/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch purchase order detail');
  },
  create: async (detail: any) => {
    return apiFetch(`${API_BASE_URL}/PurchaseOrderDetails`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(detail) }, 'Failed to create purchase order detail');
  },
  update: async (id: number, detail: any) => {
    return apiFetch(`${API_BASE_URL}/PurchaseOrderDetails/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(detail) }, 'Failed to update purchase order detail');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/PurchaseOrderDetails/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete purchase order detail');
  },
};

export const setAuthData = (data: { token: string; role?: string; fullName?: string }) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
    if (data.role) localStorage.setItem('userRole', data.role);
    if (data.fullName) localStorage.setItem('fullName', data.fullName);
  }
};

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const getUserRole = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userRole') || 'User';
  }
  return 'User';
};

export const getUserFullName = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('fullName') || '';
  }
  return '';
};

export const addressesApi = {
  getCountries: async () => {
    return apiFetch(`${API_BASE_URL}/Addresses/countries`, {}, 'Failed to fetch countries');
  },
  getProvinces: async () => {
    return apiFetch(`${API_BASE_URL}/Addresses/nepal/provinces`, {}, 'Failed to fetch provinces');
  },
  getDistricts: async (provinceId: number) => {
    return apiFetch(`${API_BASE_URL}/Addresses/nepal/provinces/${provinceId}/districts`, {}, 'Failed to fetch districts');
  },
  getMunicipalities: async (districtId: number) => {
    return apiFetch(`${API_BASE_URL}/Addresses/nepal/districts/${districtId}/municipalities`, {}, 'Failed to fetch municipalities');
  },
};

export const deliveryNotesApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/DeliveryNotes`, { headers: getAuthHeaders() }, 'Failed to fetch delivery notes');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/DeliveryNotes/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch delivery note');
  },
  create: async (note: any) => {
    return apiFetch(`${API_BASE_URL}/DeliveryNotes`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(note) }, 'Failed to create delivery note');
  },
  update: async (id: number, note: any) => {
    return apiFetch(`${API_BASE_URL}/DeliveryNotes/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(note) }, 'Failed to update delivery note');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/DeliveryNotes/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete delivery note');
  },
};

export const stockTransfersApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/StockTransfers`, { headers: getAuthHeaders() }, 'Failed to fetch stock transfers');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/StockTransfers/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch stock transfer');
  },
  create: async (transfer: any) => {
    return apiFetch(`${API_BASE_URL}/StockTransfers`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(transfer) }, 'Failed to create stock transfer');
  },
  update: async (id: number, transfer: any) => {
    return apiFetch(`${API_BASE_URL}/StockTransfers/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(transfer) }, 'Failed to update stock transfer');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/StockTransfers/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete stock transfer');
  },
};

export const stockAdjustmentsApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/StockAdjustments`, { headers: getAuthHeaders() }, 'Failed to fetch stock adjustments');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/StockAdjustments/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch stock adjustment');
  },
  create: async (adjustment: any) => {
    return apiFetch(`${API_BASE_URL}/StockAdjustments`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(adjustment) }, 'Failed to create stock adjustment');
  },
  update: async (id: number, adjustment: any) => {
    return apiFetch(`${API_BASE_URL}/StockAdjustments/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(adjustment) }, 'Failed to update stock adjustment');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/StockAdjustments/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete stock adjustment');
  },
};

export const salesInvoicesApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/SalesInvoices`, { headers: getAuthHeaders() }, 'Failed to fetch sales invoices');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/SalesInvoices/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch sales invoice');
  },
  create: async (invoice: any) => {
    return apiFetch(`${API_BASE_URL}/SalesInvoices`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(invoice) }, 'Failed to create sales invoice');
  },
  update: async (id: number, invoice: any) => {
    return apiFetch(`${API_BASE_URL}/SalesInvoices/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(invoice) }, 'Failed to update sales invoice');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/SalesInvoices/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete sales invoice');
  },
};

export const purchaseRequisitionsApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/PurchaseRequisitions`, { headers: getAuthHeaders() }, 'Failed to fetch purchase requisitions');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/PurchaseRequisitions/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch purchase requisition');
  },
  create: async (req: any) => {
    return apiFetch(`${API_BASE_URL}/PurchaseRequisitions`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(req) }, 'Failed to create purchase requisition');
  },
  update: async (id: number, req: any) => {
    return apiFetch(`${API_BASE_URL}/PurchaseRequisitions/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(req) }, 'Failed to update purchase requisition');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/PurchaseRequisitions/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete purchase requisition');
  },
};

export const grnsApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/GRNs`, { headers: getAuthHeaders() }, 'Failed to fetch GRNs');
  },
  getById: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/GRNs/${id}`, { headers: getAuthHeaders() }, 'Failed to fetch GRN');
  },
  create: async (grn: any) => {
    return apiFetch(`${API_BASE_URL}/GRNs`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(grn) }, 'Failed to create GRN');
  },
  update: async (id: number, grn: any) => {
    return apiFetch(`${API_BASE_URL}/GRNs/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(grn) }, 'Failed to update GRN');
  },
  delete: async (id: number) => {
    return apiFetch(`${API_BASE_URL}/GRNs/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete GRN');
  },
};

export const dashboardApi = {
  getStats: async () => {
    return apiFetch(`${API_BASE_URL}/Dashboard/stats`, { headers: getAuthHeaders() }, 'Failed to fetch dashboard stats');
  },
  generateReorders: async () => {
    return apiFetch(`${API_BASE_URL}/Dashboard/generate-reorders`, { method: 'POST', headers: getAuthHeaders() }, 'Failed to generate reorders');
  },
};

export const reportsApi = {
  getReport: async (reportId: 'stock-summary' | 'low-stock' | 'stock-ledger' | 'purchase-history' | 'sales-history' | 'vat-sales-register' | 'vat-purchase-register' | 'fiscal-year-stock') => {
    return apiFetch(`${API_BASE_URL}/Reports/${reportId}`, { headers: getAuthHeaders() }, 'Failed to fetch report');
  },
};

export const usersApi = {
  getAll: async () => {
    return apiFetch(`${API_BASE_URL}/Users`, { headers: getAuthHeaders() }, 'Failed to fetch users');
  },
  delete: async (id: string) => {
    return apiFetch(`${API_BASE_URL}/Users/${id}`, { method: 'DELETE', headers: getAuthHeaders() }, 'Failed to delete user');
  },
  updateRoles: async (id: string, roles: string[]) => {
    return apiFetch(`${API_BASE_URL}/Users/${id}/roles`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(roles) }, 'Failed to update user roles');
  },
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('fullName');
  }
};


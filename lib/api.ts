export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5201/api';

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const authApi = {
  login: async (loginData: any) => {
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Login failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  register: async (registerData: any) => {
    const response = await fetch(`${API_BASE_URL}/Auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Registration failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = JSON.stringify(errorData) || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },
};

export const categoriesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/Categories`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Categories/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch category');
    return response.json();
  },

  create: async (category: any) => {
    const response = await fetch(`${API_BASE_URL}/Categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Failed to create category');
    return response.json();
  },

  update: async (id: number, category: any) => {
    const response = await fetch(`${API_BASE_URL}/Categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Failed to update category');
    return response;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete category');
    return response;
  },
};

export const inventoriesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/Inventories`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch inventories');
    return response.json();
  },

  getLookup: async () => {
    const response = await fetch(`${API_BASE_URL}/Inventories/lookup`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch inventory lookup');
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Inventories/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch inventory');
    return response.json();
  },

  create: async (inventory: any) => {
    const response = await fetch(`${API_BASE_URL}/Inventories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(inventory),
    });
    if (!response.ok) throw new Error('Failed to create inventory');
    return response.json();
  },

  update: async (id: number, inventory: any) => {
    const response = await fetch(`${API_BASE_URL}/Inventories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(inventory),
    });
    if (!response.ok) throw new Error('Failed to update inventory');
    return response;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Inventories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete inventory');
    return response;
  },
};

export const customersApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/Customers`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch customers');
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Customers/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch customer');
    return response.json();
  },

  create: async (customer: any) => {
    const response = await fetch(`${API_BASE_URL}/Customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customer),
    });
    if (!response.ok) throw new Error('Failed to create customer');
    return response.json();
  },

  update: async (id: number, customer: any) => {
    const response = await fetch(`${API_BASE_URL}/Customers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(customer),
    });
    if (!response.ok) throw new Error('Failed to update customer');
    return response;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete customer');
    return response;
  },
};

export const locationsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/Locations`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch locations');
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Locations/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch location');
    return response.json();
  },

  create: async (location: any) => {
    const response = await fetch(`${API_BASE_URL}/Locations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(location),
    });
    if (!response.ok) throw new Error('Failed to create location');
    return response.json();
  },

  update: async (id: number, location: any) => {
    const response = await fetch(`${API_BASE_URL}/Locations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(location),
    });
    if (!response.ok) throw new Error('Failed to update location');
    return response;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Locations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete location');
    return response;
  },
};

export const suppliersApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/Suppliers`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch suppliers');
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Suppliers/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch supplier');
    return response.json();
  },

  create: async (supplier: any) => {
    const response = await fetch(`${API_BASE_URL}/Suppliers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(supplier),
    });
    if (!response.ok) throw new Error('Failed to create supplier');
    return response.json();
  },

  update: async (id: number, supplier: any) => {
    const response = await fetch(`${API_BASE_URL}/Suppliers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(supplier),
    });
    if (!response.ok) throw new Error('Failed to update supplier');
    return response;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Suppliers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete supplier');
    return response;
  },
};

export const salesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/Sales`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch sales');
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Sales/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch sale');
    return response.json();
  },

  create: async (sale: any) => {
    const response = await fetch(`${API_BASE_URL}/Sales`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(sale),
    });
    if (!response.ok) throw new Error('Failed to create sale');
    return response.json();
  },

  update: async (id: number, sale: any) => {
    const response = await fetch(`${API_BASE_URL}/Sales/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(sale),
    });
    if (!response.ok) throw new Error('Failed to update sale');
    return response;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Sales/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete sale');
    return response;
  },
};

export const saleDetailsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/SaleDetails`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch sale details');
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/SaleDetails/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch sale detail');
    return response.json();
  },

  create: async (detail: any) => {
    const response = await fetch(`${API_BASE_URL}/SaleDetails`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(detail),
    });
    if (!response.ok) throw new Error('Failed to create sale detail');
    return response.json();
  },

  update: async (id: number, detail: any) => {
    const response = await fetch(`${API_BASE_URL}/SaleDetails/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(detail),
    });
    if (!response.ok) throw new Error('Failed to update sale detail');
    return response;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/SaleDetails/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete sale detail');
    return response;
  },
};

export const stockMovementsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/StockMovements`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch stock movements');
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/StockMovements/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch stock movement');
    return response.json();
  },

  create: async (movement: any) => {
    const response = await fetch(`${API_BASE_URL}/StockMovements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(movement),
    });
    if (!response.ok) throw new Error('Failed to create stock movement');
    return response.json();
  },

  update: async (id: number, movement: any) => {
    const response = await fetch(`${API_BASE_URL}/StockMovements/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(movement),
    });
    if (!response.ok) throw new Error('Failed to update stock movement');
    return response;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/StockMovements/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete stock movement');
    return response;
  },
};

export const productsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/Products`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Products/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  create: async (product: any) => {
    const response = await fetch(`${API_BASE_URL}/Products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
  },

  update: async (id: number, product: any) => {
    const response = await fetch(`${API_BASE_URL}/Products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/Products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return response;
  },
};

export const purchaseOrdersApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/PurchaseOrders`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch purchase orders');
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/PurchaseOrders/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch purchase order');
    return response.json();
  },

  create: async (order: any) => {
    const response = await fetch(`${API_BASE_URL}/PurchaseOrders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Failed to create purchase order');
    return response.json();
  },

  update: async (id: number, order: any) => {
    const response = await fetch(`${API_BASE_URL}/PurchaseOrders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Failed to update purchase order');
    return response;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/PurchaseOrders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete purchase order');
    return response;
  },
};

export const purchaseOrderDetailsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/PurchaseOrderDetails`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch purchase order details');
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/PurchaseOrderDetails/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch purchase order detail');
    return response.json();
  },

  create: async (detail: any) => {
    const response = await fetch(`${API_BASE_URL}/PurchaseOrderDetails`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(detail),
    });
    if (!response.ok) throw new Error('Failed to create purchase order detail');
    return response.json();
  },

  update: async (id: number, detail: any) => {
    const response = await fetch(`${API_BASE_URL}/PurchaseOrderDetails/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(detail),
    });
    if (!response.ok) throw new Error('Failed to update purchase order detail');
    return response;
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/PurchaseOrderDetails/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete purchase order detail');
    return response;
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
    return localStorage.getItem('fullName') || 'Unknown User';
  }
  return 'Unknown User';
};

export const purchaseRequisitionsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/PurchaseRequisitions`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch purchase requisitions');
    return response.json();
  },
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/PurchaseRequisitions/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch purchase requisition');
    return response.json();
  },
  create: async (pr: any) => {
    const response = await fetch(`${API_BASE_URL}/PurchaseRequisitions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(pr),
    });
    if (!response.ok) throw new Error('Failed to create purchase requisition');
    return response.json();
  },
  update: async (id: number, pr: any) => {
    const response = await fetch(`${API_BASE_URL}/PurchaseRequisitions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(pr),
    });
    if (!response.ok) throw new Error('Failed to update purchase requisition');
    return response;
  },
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/PurchaseRequisitions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete purchase requisition');
    return response;
  },
};

export const grnsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/GRNs`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch GRNs');
    return response.json();
  },
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/GRNs/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch GRN');
    return response.json();
  },
  create: async (grn: any) => {
    const response = await fetch(`${API_BASE_URL}/GRNs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(grn),
    });
    if (!response.ok) throw new Error('Failed to create GRN');
    return response.json();
  },
};

export const deliveryNotesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/DeliveryNotes`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch delivery notes');
    return response.json();
  },
  create: async (note: any) => {
    const response = await fetch(`${API_BASE_URL}/DeliveryNotes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(note),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create delivery note');
    }
    return response.json();
  },
  update: async (id: number, note: any) => {
    const response = await fetch(`${API_BASE_URL}/DeliveryNotes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(note),
    });
    if (!response.ok) throw new Error('Failed to update delivery note');
    return response;
  },
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/DeliveryNotes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete delivery note');
    return response;
  },
};

export const salesInvoicesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/SalesInvoices`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch invoices');
    return response.json();
  },
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/SalesInvoices/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch invoice');
    return response.json();
  },
  create: async (invoice: any) => {
    const response = await fetch(`${API_BASE_URL}/SalesInvoices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(invoice),
    });
    if (!response.ok) throw new Error('Failed to create invoice');
    return response.json();
  },
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/SalesInvoices/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete invoice');
    return response;
  },
};

export const stockAdjustmentsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/StockAdjustments`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch stock adjustments');
    return response.json();
  },
  create: async (adj: any) => {
    const response = await fetch(`${API_BASE_URL}/StockAdjustments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(adj),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create stock adjustment');
    }
    return response.json();
  },
};

export const stockTransfersApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/StockTransfers`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch stock transfers');
    return response.json();
  },
  create: async (transfer: any) => {
    const response = await fetch(`${API_BASE_URL}/StockTransfers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transfer),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate stock transfer');
    }
    return response.json();
  },
  update: async (id: number, transfer: any) => {
    const response = await fetch(`${API_BASE_URL}/StockTransfers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(transfer),
    });
    if (!response.ok) throw new Error('Failed to update stock transfer');
    return response;
  },
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('fullName');
  }
};

export const dashboardApi = {
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/Dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },
  generateReorders: async () => {
    const response = await fetch(`${API_BASE_URL}/Dashboard/generate-reorders`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to generate reorder drafts');
    return response.json();
  }
};
export const reportsApi = {
  getReport: async (type: 'stock-summary' | 'low-stock' | 'sales-history' | 'purchase-history' | 'stock-ledger' | 'vat-sales-register' | 'vat-purchase-register' | 'fiscal-year-stock') => {
    const response = await fetch(`${API_BASE_URL}/Reports/${type}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Failed to fetch ${type} report`);
    return response.json();
  }
};

export const usersApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/Users`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/Users/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },
  updateRoles: async (id: string, roles: string[]) => {
    const response = await fetch(`${API_BASE_URL}/Users/${id}/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(roles),
    });
    if (!response.ok) throw new Error('Failed to update roles');
    return response;
  },
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/Users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response;
  },
};

export const addressesApi = {
  getCountries: async () => {
    const response = await fetch(`${API_BASE_URL}/Addresses/countries`);
    if (!response.ok) throw new Error('Failed to fetch countries');
    return response.json();
  },
  getProvinces: async () => {
    const response = await fetch(`${API_BASE_URL}/Addresses/nepal/provinces`);
    if (!response.ok) throw new Error('Failed to fetch provinces');
    return response.json();
  },
  getDistricts: async (provinceId: number) => {
    const response = await fetch(`${API_BASE_URL}/Addresses/nepal/provinces/${provinceId}/districts`);
    if (!response.ok) throw new Error('Failed to fetch districts');
    return response.json();
  },
  getMunicipalities: async (districtId: number) => {
    const response = await fetch(`${API_BASE_URL}/Addresses/nepal/districts/${districtId}/municipalities`);
    if (!response.ok) throw new Error('Failed to fetch municipalities');
    return response.json();
  }
};

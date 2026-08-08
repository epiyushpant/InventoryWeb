'use client';

import { useEffect, useState } from 'react';
import { productsApi, unitConversionsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';
import { useFormValidation } from '@/hooks/useFormValidation';
import FormErrors from '@/components/FormErrors';

interface UnitConversion {
  conversionID: number;
  productID: number;
  fromUnit: string;
  toUnit: string;
  factor: number;
}

interface Product {
  productID: number;
  productName: string;
  unitOfMeasure?: string;
}

export default function UnitConversionsPage() {
  const [rows, setRows] = useState<UnitConversion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { validationErrors, validateAndSubmit, handleApiError } = useFormValidation();
  const [current, setCurrent] = useState<Partial<UnitConversion>>({
    productID: 0,
    fromUnit: 'CARTON',
    toUnit: 'PCS',
    factor: 1,
  });

  const load = async () => {
    try {
      setLoading(true);
      const [convs, prods] = await Promise.all([unitConversionsApi.getAll(), productsApi.getAll()]);
      setRows(convs || []);
      setProducts(prods || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && current.conversionID) {
        await unitConversionsApi.update(current.conversionID, current);
      } else {
        await unitConversionsApi.create(current);
      }
      setShowModal(false);
      setIsEditing(false);
      await load();
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<UnitConversion>[] = [
    {
      header: 'Product',
      render: (r) => products.find((p) => p.productID === r.productID)?.productName || `#${r.productID}`,
    },
    { header: 'From', render: (r) => r.fromUnit },
    { header: 'To', render: (r) => r.toUnit },
    {
      header: 'Factor',
      render: (r) => (
        <span>
          1 {r.fromUnit} = <strong>{r.factor}</strong> {r.toUnit}
        </span>
      ),
    },
  ];

  return (
    <>
      <LookupTable<UnitConversion>
        title="Unit Conversions"
        subtitle="Map carton/sack to pieces for PO, GRN, and sales lines."
        addButtonLabel="Add Conversion"
        onAdd={() => {
          setIsEditing(false);
          setCurrent({
            productID: products[0]?.productID || 0,
            fromUnit: 'CARTON',
            toUnit: products[0]?.unitOfMeasure || 'PCS',
            factor: 24,
          });
          setShowModal(true);
        }}
        columns={columns}
        data={rows}
        keyField="conversionID"
        loading={loading}
        error={error}
        onEdit={(row) => {
          setIsEditing(true);
          setCurrent(row);
          setShowModal(true);
        }}
        onDelete={async (row) => {
          if (!confirm('Delete this conversion?')) return;
          await unitConversionsApi.delete(row.conversionID);
          await load();
        }}
      />

      {showModal && (
        <div className="modal-backdrop">
          <div className="glass animate-fade modal-card">
            <h2 className="auth-title">{isEditing ? 'Edit Conversion' : 'Add Conversion'}</h2>
            <form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>
              <div className="form-group">
                <label className="form-label">Product</label>
                <select
                  className="form-input"
                  required
                  value={current.productID}
                  onChange={(e) => setCurrent({ ...current, productID: parseInt(e.target.value) })}
                >
                  <option value={0} disabled>
                    Select product
                  </option>
                  {products.map((p) => (
                    <option key={p.productID} value={p.productID}>
                      {p.productName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">From unit</label>
                  <input
                    className="form-input"
                    required
                    value={current.fromUnit || ''}
                    onChange={(e) => setCurrent({ ...current, fromUnit: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">To unit</label>
                  <input
                    className="form-input"
                    required
                    value={current.toUnit || ''}
                    onChange={(e) => setCurrent({ ...current, toUnit: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Factor (1 from = N to)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0.0001"
                  step="any"
                  required
                  value={current.factor ?? 1}
                  onChange={(e) => setCurrent({ ...current, factor: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <FormErrors errors={validationErrors} />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success btn-block">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

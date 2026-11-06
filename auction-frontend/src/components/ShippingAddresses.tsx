import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { COUNTRIES } from '../auction/countries';
import { flagEmoji } from '../auction/utils';
import { API_URL } from '../lib/api';

interface Address {
  id: number;
  fullName: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const labelClass = 'mb-1 block text-sm font-bold tracking-wide text-ink-strong uppercase';
const inputClass = 'h-auto rounded-xl border-2 border-ink-strong bg-white px-4 py-2.5 text-base font-semibold';

export function ShippingAddresses({ token }: { token: string }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [fullName, setFullName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('PT');
  const [isDefault, setIsDefault] = useState(false);
  const [showForm, setShowForm] = useState(false);

    const fetchAddresses = async () => {
        if (!token) {
        setLoading(false);
        return;
        }
        try {
        const res = await fetch(`${API_URL}/api/addresses`, { headers: { Authorization: `Bearer ${token}` },});
        if (res.ok) {
            const data = await res.json();
            setAddresses(Array.isArray(data) ? data : []);
        } else {
            setAddresses([]);
        }
        } catch {
        setAddresses([]);
        } finally {
        setLoading(false);
        }
    };

  useEffect(() => {
    if (token) fetchAddresses();
  }, [token]);

  const resetForm = () => {
    setFullName('');
    setStreet('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('PT');
    setIsDefault(false);
    setIsEditing(null);
    setShowForm(false);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = { fullName, street, city, state, postalCode, country, isDefault };
    const url = isEditing 
      ? `${API_URL}/api/addresses/${isEditing}` 
      : `${API_URL}/api/addresses`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save address');

      await fetchAddresses();
      resetForm();
    } catch {
      setError('Could not save address. Please check the fields.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAddresses();
    } catch {
      setError('Could not delete address.');
    }
  };

  const handleEdit = (addr: Address) => {
    setIsEditing(addr.id);
    setFullName(addr.fullName);
    setStreet(addr.street);
    setCity(addr.city);
    setState(addr.state || '');
    setPostalCode(addr.postalCode);
    setCountry(addr.country);
    setIsDefault(addr.isDefault);
    setShowForm(true);
  };

  return (
    <section className="mt-12 space-y-6 rounded-[22px] border-2 border-ink-strong p-8 max-mobile:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-ink-strong uppercase">Shipping Addresses</h2>
        {!showForm && (
          <Button variant="solid" size="sm" onClick={() => setShowForm(true)}>
            + ADD ADDRESS
          </Button>
        )}
      </div>

      {error && <div role="alert" className="rounded-2xl bg-red-100 p-4 font-semibold text-red-700">{error}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="space-y-4 rounded-xl bg-surface p-6 border-2 border-ink-strong">
          <h3 className="text-lg font-bold text-ink-strong uppercase">{isEditing ? 'Edit Address' : 'New Address'}</h3>
          
          <div>
            <label className={labelClass}>Full Name</label>
            <Input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Street Address</label>
            <Input className={inputClass} value={street} onChange={(e) => setStreet(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>City</label>
              <Input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>State / Province</label>
              <Input className={inputClass} value={state} onChange={(e) => setState(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Postal Code</label>
              <Input className={inputClass} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <select className={`${inputClass} w-full border-solid`} value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="isDefault" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-5 w-5" />
            <label htmlFor="isDefault" className="font-semibold text-ink-strong">Set as default shipping address</label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="solid" size="sm">Save Address</Button>
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="font-medium text-slate">Loading addresses…</p>
      ) : addresses.length === 0 ? (
        <p className="text-ink-soft">No shipping addresses saved yet.</p>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="flex items-center justify-between rounded-xl border-2 border-ink-strong p-4 bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-ink-strong">{addr.fullName}</p>
                  {addr.isDefault && (
                    <span className="rounded-full bg-ink-strong px-2.5 py-0.5 text-xs font-bold text-white uppercase">Default</span>
                  )}
                </div>
                <p className="text-sm text-slate">{addr.street}, {addr.city} {addr.postalCode}</p>
                <p className="text-sm text-slate">{flagEmoji(addr.country)} {addr.country}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(addr)}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(addr.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
// components/PersonalInfoForm.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function PersonalInfoForm({ user }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postal, setPostal] = useState('');
  const [country, setCountry] = useState('US');

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setMsg('');
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, address_line1, address_line2, city, state, postal_code, country, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setAddress1(data.address_line1 || '');
        setAddress2(data.address_line2 || '');
        setCity(data.city || '');
        setState(data.state || '');
        setPostal(data.postal_code || '');
        setCountry(data.country || 'US');
      }
      setLoading(false);
    })();
  }, [user]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    // minimal validation
    if (!fullName || !address1 || !city || !state || !postal || !country) {
      setMsg('Please complete all required fields (marked *).');
      return;
    }

    setSaving(true);
    setMsg('');
    const payload = {
      user_id: user.id,
      email: user.email ?? null,
      full_name: fullName,
      phone,
      address_line1: address1,
      address_line2: address2,
      city,
      state,
      postal_code: postal,
      country,
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.error('save profile error', error);
      setMsg(error.message || 'Failed to save. Please try again.');
    } else {
      setMsg('✅ Saved!');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading your info…</div>;
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name *</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
                 className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)}
                 className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Address Line 1 *</label>
        <input value={address1} onChange={e => setAddress1(e.target.value)}
               className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
        <input value={address2} onChange={e => setAddress2(e.target.value)}
               className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">City *</label>
          <input value={city} onChange={e => setCity(e.target.value)}
                 className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">State/Province *</label>
          <input value={state} onChange={e => setState(e.target.value)}
                 className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Postal Code *</label>
          <input value={postal} onChange={e => setPostal(e.target.value)}
                 className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Country *</label>
        <input value={country} onChange={e => setCountry(e.target.value)}
               className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
      </div>

      {msg && <div className="text-sm text-gray-700">{msg}</div>}

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>

      <p className="text-xs text-gray-400 mt-2">
        We use this information to personalize your guidebook and ship your sculpture. We will never share it.
      </p>
    </form>
  );
}

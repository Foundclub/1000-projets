"use client";
import { useState } from 'react';

export default function RolesPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ANNONCEUR'|'MISSIONNAIRE'>('ANNONCEUR');
  const [userId, setUserId] = useState<string | null>(null);
  const [isCertified, setIsCertified] = useState(false);
  const [loading, setLoading] = useState(false);
  
  async function fetchUser() {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setUserId(data.id);
        setIsCertified(data.isCertifiedAnnonceur || false);
      }
    } catch (e) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }
  
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
    if (res.ok) {
      alert('Rôle mis à jour');
      fetchUser();
    } else {
      alert('Erreur');
    }
  }
  
  async function toggleCertify() {
    if (!userId) return;
    const res = await fetch(`/api/admin/annonceurs/${userId}/certify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCertifiedAnnonceur: !isCertified }),
    });
    if (res.ok) {
      setIsCertified(!isCertified);
      alert('Statut de certification mis à jour');
    } else {
      alert('Erreur');
    }
  }
  
  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-xl font-semibold mb-4">Gestion des rôles</h1>
        <form onSubmit={submit} className="space-y-3">
          <input 
            className="w-full border rounded px-3 py-2 text-sm" 
            placeholder="email@exemple.com" 
            value={email} 
            onChange={(e) => {
              setEmail(e.target.value);
              setUserId(null);
              setIsCertified(false);
            }}
            onBlur={fetchUser}
          />
          <select className="w-full border rounded px-3 py-2 text-sm" value={role} onChange={(e)=>setRole(e.target.value as any)}>
            <option value="ANNONCEUR">ANNONCEUR</option>
            <option value="MISSIONNAIRE">MISSIONNAIRE</option>
          </select>
          <button className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm w-full">Mettre à jour</button>
        </form>
      </div>
      
      {userId && role === 'ANNONCEUR' && (
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-3">Certification</h2>
          <div className="flex items-center justify-between p-3 bg-secondary rounded">
            <div>
              <p className="text-sm font-medium">Certifier (badge bleu)</p>
              <p className="text-xs text-muted-foreground">Accorde le badge "Certifié" à cet annonceur</p>
            </div>
            <button
              onClick={toggleCertify}
              className={`px-3 py-1 rounded text-sm font-medium ${
                isCertified
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isCertified ? 'Certifié' : 'Non certifié'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



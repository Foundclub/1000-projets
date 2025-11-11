"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Role } from '@prisma/client';

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  role: Role;
  companyName: string | null;
  isCertifiedAnnonceur: boolean;
  annonceurRequestStatus: string | null;
  adminRequestStatus: string | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    role: '' as Role | '',
    verification: '',
    adminStatus: '',
    q: '',
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadUsers();
  }, [filters, page]);

  async function loadUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.role) params.set('role', filters.role);
      if (filters.verification) params.set('verification', filters.verification);
      if (filters.adminStatus) params.set('adminStatus', filters.adminStatus);
      if (filters.q) params.set('q', filters.q);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Erreur lors du chargement des utilisateurs');
        setUsers([]);
        setTotal(0);
      }
    } catch (e) {
      setError('Erreur lors du chargement des utilisateurs');
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCertify(userId: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/admin/annonceurs/${userId}/certify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isCertifiedAnnonceur: !currentStatus }),
      });
      if (res.ok) {
        await loadUsers();
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (e) {
      alert('Erreur lors de la mise à jour');
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Filtres</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Rôle</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value as Role | '' })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Tous</option>
                <option value={Role.MISSIONNAIRE}>Missionnaire</option>
                <option value={Role.ANNONCEUR}>Annonceur</option>
                <option value={Role.ADMIN}>Admin</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-semibold mb-2 block">Vérification Annonceur</label>
              <select
                value={filters.verification}
                onChange={(e) => setFilters({ ...filters, verification: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Tous</option>
                <option value="NONE">Aucune</option>
                <option value="PENDING">En attente</option>
                <option value="APPROVED">Approuvé</option>
                <option value="REJECTED">Rejeté</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-semibold mb-2 block">Admin Status</label>
              <select
                value={filters.adminStatus}
                onChange={(e) => setFilters({ ...filters, adminStatus: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Tous</option>
                <option value="NONE">Aucune</option>
                <option value="PENDING">En attente</option>
                <option value="APPROVED">Approuvé</option>
                <option value="REJECTED">Rejeté</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-semibold mb-2 block">Recherche</label>
              <Input
                type="text"
                placeholder="Email, nom, entreprise..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Utilisateurs ({total})</h2>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun utilisateur trouvé</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Nom</th>
                    <th className="text-left p-2">Rôle</th>
                    <th className="text-left p-2">Entreprise</th>
                    <th className="text-left p-2">Vérif</th>
                    <th className="text-left p-2">Admin</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b">
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.displayName || '-'}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === Role.ADMIN ? 'bg-purple-100 text-purple-800' :
                          user.role === Role.ANNONCEUR ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2">{user.companyName || '-'}</td>
                      <td className="p-2">
                        {user.annonceurRequestStatus ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.annonceurRequestStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            user.annonceurRequestStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.annonceurRequestStatus}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-2">
                        {user.adminRequestStatus ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.adminRequestStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            user.adminRequestStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.adminRequestStatus}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          {user.role === Role.ANNONCEUR && (
                            <Button
                              size="sm"
                              variant={user.isCertifiedAnnonceur ? 'default' : 'outline'}
                              onClick={() => toggleCertify(user.id, user.isCertifiedAnnonceur)}
                            >
                              {user.isCertifiedAnnonceur ? 'Certifié' : 'Certifier'}
                            </Button>
                          )}
                          {user.annonceurRequestStatus === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/requests?userId=${user.id}`)}
                            >
                              Voir KYC
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} sur {Math.ceil(total / limit)}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



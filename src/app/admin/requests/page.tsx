"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/avatar';

type Request = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  annonceurRequestStatus: string | null;
  adminRequestStatus: string | null;
  justificatifUrl: string | null;
  avatar: string | null;
  createdAt: string;
};

export default function AdminRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/requests', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Erreur lors du chargement des demandes');
      }
    } catch (e) {
      setError('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest(action: 'approve' | 'reject', userId: string, type: 'annonceur' | 'admin') {
    try {
      const res = await fetch(`/api/admin/requests/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type }),
      });
      
      if (res.ok) {
        await loadRequests();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (e) {
      alert('Erreur lors de la mise à jour');
    }
  }

  const annonceurRequests = requests.filter(r => r.annonceurRequestStatus === 'PENDING');
  const adminRequests = requests.filter(r => r.adminRequestStatus === 'PENDING');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gestion des demandes</h1>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Demandes Annonceur */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Demandes Annonceur ({annonceurRequests.length})</h2>
          {annonceurRequests.length === 0 ? (
            <p className="text-muted-foreground">Aucune demande en attente</p>
          ) : (
            <div className="space-y-4">
              {annonceurRequests.map(req => (
                <Card key={req.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={req.avatar}
                          alt={`${req.firstName} ${req.lastName}`}
                          name={req.firstName && req.lastName ? `${req.firstName} ${req.lastName}` : undefined}
                          email={req.email}
                          size="md"
                          clickable={true}
                          showModal={true}
                        />
                        <div>
                          <h3 className="font-semibold">
                            {req.firstName} {req.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{req.email}</p>
                          {req.companyName && (
                            <p className="text-sm font-medium mt-1">🏢 {req.companyName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequest('reject', req.id, 'annonceur')}
                        >
                          Refuser
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRequest('approve', req.id, 'annonceur')}
                        >
                          Accepter
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {req.justificatifUrl && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold mb-2">Justificatif :</p>
                        <a
                          href={req.justificatifUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Voir le document →
                        </a>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">
                      Demande créée le {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Demandes Admin */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Demandes Admin ({adminRequests.length})</h2>
          {adminRequests.length === 0 ? (
            <p className="text-muted-foreground">Aucune demande en attente</p>
          ) : (
            <div className="space-y-4">
              {adminRequests.map(req => (
                <Card key={req.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">
                          {req.firstName} {req.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{req.email}</p>
                        {req.phone && (
                          <p className="text-sm mt-1">📞 {req.phone}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequest('reject', req.id, 'admin')}
                        >
                          Refuser
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRequest('approve', req.id, 'admin')}
                        >
                          Accepter
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Demande créée le {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


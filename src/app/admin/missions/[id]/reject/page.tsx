"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type Mission = {
  id: string;
  title: string;
  description: string;
  status: string;
  owner: {
    email: string;
    displayName: string | null;
  };
};

export default function RejectMissionPage() {
  const router = useRouter();
  const params = useParams();
  const missionId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mission, setMission] = useState<Mission | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadMission();
  }, [missionId]);

  async function loadMission() {
    try {
      const res = await fetch(`/api/admin/missions/${missionId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMission(data.mission);
      } else if (res.status === 404) {
        setError('Mission introuvable');
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login');
      } else {
        setError('Erreur lors du chargement de la mission');
      }
    } catch (e) {
      setError('Erreur lors du chargement de la mission');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cette mission ? Cette action est irréversible.')) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/missions/${missionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: reason || undefined }),
      });

      if (res.ok) {
        router.push('/admin/missions?tab=archived');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors du rejet de la mission');
      }
    } catch (e) {
      setError('Erreur lors du rejet de la mission');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  if (error && !mission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/admin/missions">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!mission) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/missions">
          <Button variant="outline" size="sm" className="shadow-md hover:shadow-lg active:shadow-sm active:scale-[0.98] transition-all duration-200 border-2 border-border/50 hover:border-primary/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-destructive via-destructive/90 to-destructive/80 bg-clip-text text-transparent">
          Rejeter une mission
        </h1>
      </div>

      {error && (
        <Alert variant="destructive" className="border-2 border-destructive/70 bg-gradient-to-br from-destructive/10 via-destructive/5 to-destructive/10 shadow-xl shadow-destructive/20 ring-2 ring-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-l-4 border-l-destructive/50 shadow-xl shadow-destructive/10 hover:shadow-2xl hover:shadow-destructive/20 transition-all duration-300">
        <CardHeader className="bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-b-2 border-destructive/20">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-destructive/20 shadow-lg shadow-destructive/30 ring-2 ring-destructive/20">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <span className="bg-gradient-to-r from-destructive to-destructive/80 bg-clip-text text-transparent">
              Mission à rejeter
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="p-4 rounded-lg bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border-2 border-border/30 shadow-md hover:shadow-lg transition-all duration-200">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Titre
            </label>
            <p className="text-lg font-bold text-foreground">{mission.title}</p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border-2 border-border/30 shadow-md hover:shadow-lg transition-all duration-200">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Description
            </label>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {mission.description}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border-2 border-border/30 shadow-md hover:shadow-lg transition-all duration-200">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Propriétaire
            </label>
            <p className="text-base font-semibold text-foreground">
              {mission.owner.displayName || mission.owner.email}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border-2 border-border/30 shadow-md hover:shadow-lg transition-all duration-200">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Statut actuel
            </label>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-md ring-2 ring-offset-2 ring-offset-background transition-all duration-200 ${
              mission.status === 'PENDING' ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-950 ring-yellow-300/50 shadow-yellow-500/30' :
              mission.status === 'OPEN' ? 'bg-gradient-to-br from-green-400 to-green-500 text-green-950 ring-green-300/50 shadow-green-500/30' :
              mission.status === 'CLOSED' ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-gray-950 ring-gray-300/50 shadow-gray-500/30' :
              'bg-gradient-to-br from-red-400 to-red-500 text-red-950 ring-red-300/50 shadow-red-500/30'
            }`}>
              {mission.status}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl shadow-primary/10 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-2 border-border/70">
        <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b-2 border-primary/20">
          <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Raison du rejet (optionnel)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <label htmlFor="reason" className="text-sm font-bold text-foreground block">
              Expliquez pourquoi cette mission est rejetée
            </label>
            <Textarea
              id="reason"
              placeholder="Ex: Contenu inapproprié, critères non respectés, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              className="w-full border-2 border-border/50 bg-gradient-to-br from-background via-background to-muted/20 shadow-lg shadow-black/5 ring-2 ring-border/30 focus:ring-primary/50 focus:border-primary/50 focus:shadow-xl focus:shadow-primary/20 transition-all duration-200 resize-none"
            />
            <p className="text-xs text-muted-foreground font-medium">
              Cette raison sera enregistrée pour référence future.
            </p>
          </div>

          <Alert className="border-2 border-yellow-400/50 bg-gradient-to-br from-yellow-50/90 via-yellow-50/70 to-yellow-50/90 shadow-xl shadow-yellow-500/20 ring-2 ring-yellow-400/30">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="font-medium text-yellow-900">
              <strong className="text-yellow-950">Attention :</strong> Rejeter une mission la marquera comme archivée. 
              Cette action est irréversible. La mission ne sera plus visible publiquement.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4 pt-2">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting}
              className="flex-1 h-12 text-base font-bold shadow-xl shadow-destructive/40 hover:shadow-2xl hover:shadow-destructive/50 active:shadow-lg active:scale-[0.98] transition-all duration-200 border-2 border-destructive/30 bg-gradient-to-br from-destructive via-destructive to-destructive/90 ring-2 ring-destructive/20"
            >
              {submitting ? 'Rejet en cours...' : 'Rejeter la mission'}
            </Button>
            <Link href="/admin/missions">
              <Button 
                variant="outline" 
                disabled={submitting}
                className="h-12 px-6 text-base font-semibold shadow-lg hover:shadow-xl active:shadow-md active:scale-[0.98] transition-all duration-200 border-2 border-border/50 hover:border-primary/50"
              >
                Annuler
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


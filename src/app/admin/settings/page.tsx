"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type Settings = {
  slaDecisionH: number;
  slaRewardH: number;
  cgu: string;
  charte: string;
  xpRules: {
    followClub: number;
    acceptanceBase: number;
    acceptancePro: number;
    acceptanceSolid: number;
    bonusFollowedClub: number;
    decayThreshold: number;
  };
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<Settings>({
    slaDecisionH: 48,
    slaRewardH: 72,
    cgu: '',
    charte: '',
    xpRules: {
      followClub: 5,
      acceptanceBase: 20,
      acceptancePro: 60,
      acceptanceSolid: 60,
      bonusFollowedClub: 10,
      decayThreshold: 3,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || settings);
      } else if (res.status === 401) {
        setError('Non autorisé');
      } else {
        setError('Erreur lors du chargement des paramètres');
      }
    } catch (e) {
      setError('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccess('✅ Paramètres sauvegardés avec succès');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (e) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">SLA (Service Level Agreement)</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">SLA Décision (heures)</label>
              <Input
                type="number"
                value={settings.slaDecisionH}
                onChange={(e) => setSettings({ ...settings, slaDecisionH: parseInt(e.target.value) || 48 })}
                min={1}
                max={168}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">SLA Récompense (heures)</label>
              <Input
                type="number"
                value={settings.slaRewardH}
                onChange={(e) => setSettings({ ...settings, slaRewardH: parseInt(e.target.value) || 72 })}
                min={1}
                max={168}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">CGU / Charte</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">CGU (Conditions Générales d'Utilisation)</label>
            <Textarea
              value={settings.cgu}
              onChange={(e) => setSettings({ ...settings, cgu: e.target.value })}
              rows={10}
              placeholder="Texte des CGU..."
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Charte</label>
            <Textarea
              value={settings.charte}
              onChange={(e) => setSettings({ ...settings, charte: e.target.value })}
              rows={10}
              placeholder="Texte de la charte..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Règles XP (Gamification)</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">XP Follow Club</label>
              <Input
                type="number"
                value={settings.xpRules.followClub}
                onChange={(e) => setSettings({
                  ...settings,
                  xpRules: { ...settings.xpRules, followClub: parseInt(e.target.value) || 5 },
                })}
                min={0}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">XP Acceptance Base</label>
              <Input
                type="number"
                value={settings.xpRules.acceptanceBase}
                onChange={(e) => setSettings({
                  ...settings,
                  xpRules: { ...settings.xpRules, acceptanceBase: parseInt(e.target.value) || 20 },
                })}
                min={0}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">XP Acceptance PRO</label>
              <Input
                type="number"
                value={settings.xpRules.acceptancePro}
                onChange={(e) => setSettings({
                  ...settings,
                  xpRules: { ...settings.xpRules, acceptancePro: parseInt(e.target.value) || 60 },
                })}
                min={0}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">XP Acceptance SOLIDAIRE</label>
              <Input
                type="number"
                value={settings.xpRules.acceptanceSolid}
                onChange={(e) => setSettings({
                  ...settings,
                  xpRules: { ...settings.xpRules, acceptanceSolid: parseInt(e.target.value) || 60 },
                })}
                min={0}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Bonus XP Club Suivi</label>
              <Input
                type="number"
                value={settings.xpRules.bonusFollowedClub}
                onChange={(e) => setSettings({
                  ...settings,
                  xpRules: { ...settings.xpRules, bonusFollowedClub: parseInt(e.target.value) || 10 },
                })}
                min={0}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Seuil Décote (&gt;N acceptations/jour)</label>
              <Input
                type="number"
                value={settings.xpRules.decayThreshold}
                onChange={(e) => setSettings({
                  ...settings,
                  xpRules: { ...settings.xpRules, decayThreshold: parseInt(e.target.value) || 3 },
                })}
                min={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
        <Button variant="outline" onClick={loadSettings} disabled={saving}>
          Annuler
        </Button>
      </div>
    </div>
  );
}



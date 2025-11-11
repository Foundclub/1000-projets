"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface ApplicationActionsProps {
  missionId: string;
  applicationId: string;
  applicationStatus: string;
}

export function ApplicationActions({
  missionId,
  applicationId,
  applicationStatus,
}: ApplicationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'accept' | 'reject' | null>(null);

  const handleAccept = async () => {
    if (loading || action) return;
    
    setLoading(true);
    setAction('accept');
    
    try {
      const res = await fetch(
        `/api/missions/${missionId}/applications/${applicationId}/accept`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de l\'acceptation de la candidature');
        setLoading(false);
        setAction(null);
      }
    } catch (e) {
      alert('Erreur lors de l\'acceptation de la candidature');
      setLoading(false);
      setAction(null);
    }
  };

  const handleReject = async () => {
    if (loading || action) return;
    
    if (!confirm('Êtes-vous sûr de vouloir refuser cette candidature ?')) {
      return;
    }

    setLoading(true);
    setAction('reject');
    
    try {
      const res = await fetch(
        `/api/missions/${missionId}/applications/${applicationId}/reject`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors du refus de la candidature');
        setLoading(false);
        setAction(null);
      }
    } catch (e) {
      alert('Erreur lors du refus de la candidature');
      setLoading(false);
      setAction(null);
    }
  };

  if (applicationStatus !== 'PENDING') {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={handleAccept}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <Check className="w-4 h-4 mr-1" />
        Accepter
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleReject}
        disabled={loading}
      >
        <X className="w-4 h-4 mr-1" />
        Refuser
      </Button>
    </div>
  );
}



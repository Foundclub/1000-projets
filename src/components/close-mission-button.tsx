"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CloseMissionModal } from '@/components/close-mission-modal';
import { PublishModal } from '@/components/feed/publish-modal';
import { MissionStatus, Space } from '@prisma/client';

interface CloseMissionButtonProps {
  missionId: string;
  missionTitle: string;
  missionStatus: MissionStatus;
  space: Space;
}

export function CloseMissionButton({
  missionId,
  missionTitle,
  missionStatus,
  space,
}: CloseMissionButtonProps) {
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [feedPostId, setFeedPostId] = useState<string | null>(null);
  const router = useRouter();

  const handleCloseSuccess = (postId?: string) => {
    if (postId) {
      setFeedPostId(postId);
      // Petit délai pour s'assurer que le modal de clôture est bien fermé
      setTimeout(() => {
        setPublishModalOpen(true);
      }, 200);
    } else {
      // Recharger la page pour voir la mission clôturée
      router.refresh();
    }
  };

  const handlePublishSuccess = () => {
    router.refresh();
  };

  if (missionStatus !== MissionStatus.OPEN) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setCloseModalOpen(true)}
        className="w-full"
      >
        Clôturer la mission
      </Button>
      
      <CloseMissionModal
        open={closeModalOpen}
        onOpenChange={setCloseModalOpen}
        missionId={missionId}
        missionTitle={missionTitle}
        onCloseSuccess={handleCloseSuccess}
      />
      
      {feedPostId && (
        <PublishModal
          open={publishModalOpen}
          onOpenChange={setPublishModalOpen}
          postId={feedPostId}
          missionTitle={missionTitle}
          space={space}
          onPublished={handlePublishSuccess}
        />
      )}
    </>
  );
}


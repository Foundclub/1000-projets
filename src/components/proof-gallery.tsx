"use client";
import Image from 'next/image';
import { ClickableImage } from './clickable-image';

type Proof = {
  id: string;
  proofShotsSigned?: string[];
  proofUrl?: string;
  status: string;
  createdAt: string;
  comments?: string | null;
};

export function ProofGallery({ proofs }: { proofs: Proof[] }) {
  if (proofs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Preuves soumises</h2>
      <div className="space-y-4">
        {proofs.map((proof) => (
          <div key={proof.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Soumission du {new Date(proof.createdAt).toLocaleDateString('fr-FR')}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                proof.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                proof.status === 'REFUSED' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {proof.status}
              </span>
            </div>
            {proof.proofUrl && proof.proofUrl !== 'N/A' && (
              <div>
                <a href={proof.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  🔗 {proof.proofUrl}
                </a>
              </div>
            )}
            {proof.proofShotsSigned && proof.proofShotsSigned.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {proof.proofShotsSigned.map((url, idx) => {
                  const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().includes('.mp4');
                  return (
                    <div key={idx} className="relative aspect-video bg-gray-100 rounded overflow-hidden">
                      {isVideo ? (
                        <video src={url} controls className="w-full h-full object-cover" />
                      ) : (
                        <ClickableImage
                          src={url}
                          alt={`Preuve ${idx + 1}`}
                          containerClassName="relative w-full h-full"
                        >
                          <Image
                            src={url}
                            alt={`Preuve ${idx + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </ClickableImage>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {proof.comments && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs font-semibold text-gray-700 mb-1">💬 Commentaires</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{proof.comments}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


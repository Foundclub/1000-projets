"use client";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submissionCreateSchema } from '@/lib/validators';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabaseBrowser } from '@/lib/supabase';
import { useState } from 'react';

type FormValues = z.infer<typeof submissionCreateSchema> & { files?: FileList | null; shotsText?: string };

type SubmissionFormProps = {
  missionId: string;
  missionStatus?: 'OPEN' | 'CLOSED' | 'ARCHIVED' | 'PENDING';
  slotsTaken?: number;
  slotsMax?: number;
};

export function SubmissionForm({ missionId, missionStatus = 'OPEN', slotsTaken = 0, slotsMax = 0 }: SubmissionFormProps) {
  const isDisabled = missionStatus !== 'OPEN' || slotsTaken >= slotsMax;
  const disabledMessage = missionStatus === 'CLOSED' || missionStatus === 'ARCHIVED' || missionStatus === 'PENDING' 
    ? 'Mission fermée' 
    : slotsTaken >= slotsMax 
    ? 'Tous les slots sont occupés' 
    : '';
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(submissionCreateSchema),
    defaultValues: { missionId, proofUrl: '' },
    mode: 'onSubmit', // Only validate on submit, not on change
    shouldFocusError: true,
  });
  
  // Log pour debug
  console.log('SubmissionForm initialized with missionId:', missionId);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const files = watch('files'); // Watch files to check if they exist

  async function onSubmit(values: FormValues) {
    console.log('onSubmit called', { values, isDisabled, isSubmitting });
    setError('');
    setSuccess(false);
    
    if (isDisabled) {
      setError(disabledMessage || 'Mission non disponible');
      return;
    }
    
    // Validate: at least URL or files
    const hasUrl = values.proofUrl && values.proofUrl.trim() !== '';
    const hasFiles = values.files && values.files.length > 0;
    
    if (!hasUrl && !hasFiles) {
      setError('Veuillez fournir au moins une preuve : URL ou captures d\'écran');
      return;
    }
    
    // If URL is provided, validate it
    if (hasUrl && values.proofUrl) {
      try {
        new URL(values.proofUrl.trim());
      } catch {
        setError('L\'URL fournie n\'est pas valide');
        return;
      }
    }
    
    // Check if user is authenticated before submitting
    const supabase = supabaseBrowser();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setError('Vous devez être connecté pour soumettre une mission. Veuillez vous connecter.');
      return;
    }
    
    // Step 1: create submission to get its id
    console.log('Creating submission...', { missionId, proofUrl: values.proofUrl?.trim() || '' });
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Ensure cookies are sent
      body: JSON.stringify({ 
        missionId, 
        proofUrl: values.proofUrl?.trim() || '', 
        proofShots: [],
        comments: values.comments?.trim() || undefined
      })
    });
    console.log('Submission response:', { status: res.status, ok: res.ok });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      console.error('Submission error:', j);
      setError(j.error || 'Erreur lors de la soumission');
      return;
    }
    const { submission } = await res.json();
    const subId: string = submission.id;

    // Step 2: upload files (1–3 allowed)
    // Reuse supabase variable already declared above
    const files = Array.from(values.files ?? []).slice(0, 3);
    const uploadedPaths: string[] = [];
    if (files.length) {
      // Ensure user is known to build path
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        alert('Session requise pour upload');
        return;
      }
      for (const file of files) {
        // Validation taille : max 10Mo
        const maxSize = 10 * 1024 * 1024; // 10Mo en bytes
        if (file.size > maxSize) {
          setError(`Le fichier ${file.name} est trop volumineux (max 10Mo)`);
          return;
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        if (!['png','jpg','jpeg','mp4'].includes(ext)) continue;
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const objectPath = `proofs/${userId}/${subId}/${filename}`;
        const { error } = await supabase.storage.from('proofs').upload(objectPath, file, { upsert: true, cacheControl: '3600' });
        if (!error) uploadedPaths.push(objectPath);
      }
      // Step 3: attach paths to submission
      if (uploadedPaths.length) {
        await fetch(`/api/submissions/${subId}/shots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proofShots: uploadedPaths })
        });
      }
    }
    reset({ missionId, proofUrl: '', files: null, shotsText: '' });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
  }

  const onFormSubmit = handleSubmit(
    (data) => {
      console.log('Form submitted successfully:', data);
      // Ajouter les files manuellement car ils ne sont pas dans le schema Zod
      const formData: FormValues = {
        ...data,
        files: files || null,
      };
      onSubmit(formData);
    },
    (errors) => {
      console.error('Form validation errors:', errors);
      if (errors && Object.keys(errors).length > 0) {
        const firstError = Object.values(errors)[0];
        if (firstError && 'message' in firstError) {
          setError(firstError.message as string || 'Erreur de validation');
        } else {
          setError('Veuillez vérifier les champs du formulaire');
        }
      } else {
        // Pas d'erreurs mais callback appelé - c'est probablement un bug de React Hook Form
        // Forcer la soumission quand même
        console.log('No validation errors but callback called - forcing submit');
        const formData: FormValues = {
          missionId,
          proofUrl: '',
          files: files || null,
        };
        onSubmit(formData);
      }
    }
  );

  return (
    <form onSubmit={onFormSubmit} className="space-y-4 bg-white p-6 rounded-lg border shadow-sm">
      {isDisabled && (
        <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg mb-4">
          <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>{disabledMessage}</span>
          </p>
        </div>
      )}
      <input type="hidden" value={missionId} {...register('missionId')} />
      <div>
        <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
          <span>🔗</span>
          <span>Preuve (URL) <span className="text-xs font-normal text-muted-foreground">(optionnel si captures fournies)</span></span>
        </label>
        <Input 
          placeholder="https://github.com/username/repo ou https://vercel.app/..." 
          {...register('proofUrl')} 
          disabled={isSubmitting || isDisabled}
          className="w-full"
        />
        {(errors.proofUrl || error) && !files?.length && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <span>❌</span>
            <span>{errors.proofUrl?.message || error}</span>
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Lien vers votre dépôt GitHub, déploiement, ou autre preuve de réalisation (optionnel si vous uploadez des captures)
        </p>
      </div>
      <div>
        <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
          <span>💬</span>
          <span>Commentaires / Notes (optionnel)</span>
        </label>
        <Textarea
          {...register('comments')}
          placeholder="Ajoutez des informations complémentaires sur votre réalisation..."
          rows={4}
          disabled={isSubmitting || isDisabled}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Maximum 2000 caractères
        </p>
      </div>
      <div>
        <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
          <span>📸</span>
          <span>Captures d'écran (1–3 fichiers) <span className="text-xs font-normal text-muted-foreground">(optionnel si URL fournie)</span></span>
        </label>
        <input 
          type="file" 
          multiple 
          accept="image/png,image/jpeg,video/mp4" 
          {...register('files')} 
          disabled={isSubmitting || isDisabled}
          className="w-full text-sm border rounded-md p-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
        {files && files.length > 0 && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <span>✅</span>
            <span>{files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}</span>
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Formats acceptés : PNG, JPG, MP4 (max 3 fichiers)
        </p>
      </div>
      {success && (
        <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          <p className="text-sm text-green-800 font-medium flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>Soumission envoyée avec succès ! Vous recevrez une réponse sous 48h.</span>
          </p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <p className="text-sm text-red-800 font-medium flex items-center gap-2">
            <span className="text-lg">❌</span>
            <span>{error}</span>
          </p>
        </div>
      )}
      <Button 
        disabled={isSubmitting || isDisabled} 
        type="submit" 
        className="w-full mt-4"
        size="lg"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            <span>Envoi en cours...</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span>🚀</span>
            <span>Soumettre ma réalisation</span>
          </span>
        )}
      </Button>
    </form>
  );
}



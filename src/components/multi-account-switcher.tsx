"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import { 
  getStoredAccounts, 
  removeAccount, 
  switchToAccount, 
  saveCurrentAccount,
  type AccountSession 
} from '@/lib/multi-account';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Plus, X, User } from 'lucide-react';
import { InfoButton } from '@/components/info-button';

export function MultiAccountSwitcher() {
  const [accounts, setAccounts] = useState<AccountSession[]>([]);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState<AccountSession | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadAccounts();
    checkCurrentAccount();
  }, []);

  async function loadAccounts() {
    const stored = getStoredAccounts();
    setAccounts(stored);
    
    // Mettre à jour le compte actuel si nécessaire
    if (currentEmail) {
      const existingAccount = stored.find(a => a.email === currentEmail);
      if (existingAccount) {
        setCurrentAccount(existingAccount);
      }
    }
  }

  async function checkCurrentAccount() {
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || null;
      setCurrentEmail(email);
      
      // Si le compte actuel n'est pas dans la liste, le sauvegarder
      if (email) {
        const storedAccounts = getStoredAccounts();
        const existingAccount = storedAccounts.find(a => a.email === email);
        
        if (existingAccount) {
          setCurrentAccount(existingAccount);
        } else {
          // Sauvegarder le compte actuel
          await saveCurrentAccount();
          await loadAccounts();
          // Recharger pour obtenir le compte sauvegardé
          const updatedAccounts = getStoredAccounts();
          const savedAccount = updatedAccounts.find(a => a.email === email);
          if (savedAccount) {
            setCurrentAccount(savedAccount);
          }
        }
      } else {
        setCurrentAccount(null);
      }
    } catch (e) {
      setCurrentEmail(null);
      setCurrentAccount(null);
    }
  }

  async function handleSwitchAccount(email: string) {
    if (email === currentEmail) return;
    
    setLoading(true);
    try {
      // Sauvegarder le compte actuel avant de changer
      try {
        await saveCurrentAccount();
      } catch (saveError) {
        console.warn('Error saving current account (non-blocking):', saveError);
      }
      
      // Basculer vers le nouveau compte
      const result = await switchToAccount(email);
      
      if (result.success) {
        setCurrentEmail(email);
        // Recharger les comptes
        await loadAccounts();
        // Mettre à jour le compte actuel
        const updatedAccounts = getStoredAccounts();
        const newCurrentAccount = updatedAccounts.find(a => a.email === email);
        setCurrentAccount(newCurrentAccount || null);
        // Rafraîchir la page
        router.refresh();
        window.location.reload();
      } else {
        // Afficher un message d'erreur plus détaillé
        const errorMessage = result.error || 'Erreur lors du changement de compte';
        alert(errorMessage);
        
        // Si l'erreur indique que la session a expiré, proposer de supprimer le compte
        if (errorMessage.includes('expiré') || errorMessage.includes('reconnecter')) {
          if (confirm(`${errorMessage}\n\nVoulez-vous supprimer ce compte de la liste ?`)) {
            removeAccount(email);
            await loadAccounts();
          }
        }
      }
    } catch (e: any) {
      console.error('Error switching account:', e);
      const errorMessage = e.message || 'Erreur lors du changement de compte';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveAccount(email: string, e: React.MouseEvent) {
    e.stopPropagation();
    
    if (email === currentEmail) {
      if (!confirm('Vous ne pouvez pas supprimer le compte actuellement connecté. Voulez-vous vous déconnecter ?')) {
        return;
      }
      // Déconnecter et supprimer
      const supabase = supabaseBrowser();
      await supabase.auth.signOut();
      removeAccount(email);
      router.push('/login');
      router.refresh();
      return;
    }
    
    if (confirm(`Voulez-vous vraiment supprimer le compte ${email} ?`)) {
      removeAccount(email);
      await loadAccounts();
    }
  }

  async function handleAddAccount() {
    // Sauvegarder le compte actuel
    await saveCurrentAccount();
    // Rediriger vers la page de connexion
    router.push('/login?addAccount=true');
  }

  async function handleLogout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      const supabase = supabaseBrowser();
      await supabase.auth.signOut();
      setCurrentEmail(null);
      router.push('/login');
      router.refresh();
    }
  }

  if (accounts.length === 0 && !currentEmail) {
    return null;
  }

  const otherAccounts = accounts.filter(a => a.email !== currentEmail);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-2 py-1.5 h-auto"
        >
          <User className="w-4 h-4" />
          <span className="text-xs font-medium">
            {accounts.length > 0 ? `${accounts.length + (currentEmail && !accounts.find(a => a.email === currentEmail) ? 1 : 0)} comptes` : 'Comptes'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Comptes connectés</span>
          <InfoButton 
            content="Vous pouvez avoir jusqu'à 5 comptes connectés simultanément. Cliquez sur un compte pour basculer vers celui-ci. Le compte actuellement actif est indiqué par une coche."
            side="left"
            size="sm"
          />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Compte actuel */}
        {currentEmail && (
          <>
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50 border border-primary/20">
                <Avatar
                  src={currentAccount?.avatar}
                  alt={currentEmail}
                  name={currentAccount?.displayName || currentEmail}
                  email={currentEmail}
                  size="sm"
                  clickable={false}
                  showModal={false}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">
                      {currentAccount?.displayName || currentEmail}
                    </p>
                    <span className="text-xs text-primary font-medium">✓ Actif</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{currentEmail}</p>
                  {currentAccount?.role && (
                    <p className="text-xs text-muted-foreground">
                      {currentAccount.role}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Autres comptes */}
        {otherAccounts.length > 0 && (
          <>
            <div className="px-2 py-1.5 space-y-1 max-h-64 overflow-y-auto">
              {otherAccounts.map((account) => (
                <div
                  key={account.email}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors group"
                  onClick={() => handleSwitchAccount(account.email)}
                >
                  <Avatar
                    src={account.avatar}
                    alt={account.email}
                    name={account.displayName || account.email}
                    email={account.email}
                    size="sm"
                    clickable={false}
                    showModal={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {account.displayName || account.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                    {account.role && (
                      <p className="text-xs text-muted-foreground">{account.role}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleRemoveAccount(account.email, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                    aria-label={`Supprimer ${account.email}`}
                  >
                    <X className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Actions */}
        <div className="px-2 py-1.5 space-y-1">
          {accounts.length < 5 && (
            <DropdownMenuItem
              onClick={handleAddAccount}
              className="cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un compte
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


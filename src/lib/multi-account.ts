"use client";

import { supabaseBrowser } from './supabase';

export interface AccountSession {
  id: string;
  email: string;
  displayName?: string;
  avatar?: string;
  role?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  lastUsed: number;
}

const STORAGE_KEY = 'multi_account_sessions';
const MAX_ACCOUNTS = 5;

export function getStoredAccounts(): AccountSession[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading stored accounts:', e);
    return [];
  }
}

export function saveAccount(account: AccountSession): void {
  if (typeof window === 'undefined') return;
  
  try {
    const accounts = getStoredAccounts();
    const existingIndex = accounts.findIndex(a => a.email === account.email);
    
    if (existingIndex >= 0) {
      // Mettre à jour le compte existant
      accounts[existingIndex] = account;
    } else {
      // Ajouter un nouveau compte
      if (accounts.length >= MAX_ACCOUNTS) {
        // Supprimer le compte le moins récemment utilisé
        accounts.sort((a, b) => a.lastUsed - b.lastUsed);
        accounts.shift();
      }
      accounts.push(account);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Error saving account:', e);
  }
}

export function removeAccount(email: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const accounts = getStoredAccounts();
    const filtered = accounts.filter(a => a.email !== email);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error removing account:', e);
  }
}

export async function switchToAccount(email: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') return { success: false, error: 'Window is not defined' };
  
  try {
    const accounts = getStoredAccounts();
    const account = accounts.find(a => a.email === email);
    
    if (!account) {
      console.error('Account not found:', email);
      return { success: false, error: 'Compte non trouvé' };
    }
    
    const supabase = supabaseBrowser();
    
    // Vérifier si le token est encore valide (avec une marge de 5 minutes)
    const now = Date.now();
    const expiresAtWithMargin = account.expiresAt - (5 * 60 * 1000); // 5 minutes avant expiration
    
    if (expiresAtWithMargin < now) {
      // Essayer de rafraîchir le token
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: account.accessToken,
          refresh_token: account.refreshToken,
        });
        
        if (error || !data.session) {
          console.error('Error refreshing session:', error);
          // Ne pas supprimer le compte immédiatement, laisser l'utilisateur réessayer
          return { 
            success: false, 
            error: error?.message || 'Impossible de rafraîchir la session. Veuillez vous reconnecter.' 
          };
        }
        
        // Mettre à jour les tokens
        account.accessToken = data.session.access_token;
        account.refreshToken = data.session.refresh_token;
        account.expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 3600000;
        saveAccount(account);
      } catch (refreshError: any) {
        console.error('Error during token refresh:', refreshError);
        return { 
          success: false, 
          error: 'La session a expiré. Veuillez vous reconnecter avec ce compte.' 
        };
      }
    } else {
      // Utiliser les tokens existants
      try {
        const { error } = await supabase.auth.setSession({
          access_token: account.accessToken,
          refresh_token: account.refreshToken,
        });
        
        if (error) {
          console.error('Error setting session:', error);
          // Si l'erreur indique que le token est invalide, essayer de rafraîchir
          if (error.message?.includes('expired') || error.message?.includes('invalid')) {
            // Essayer de rafraîchir une dernière fois
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.setSession({
                access_token: account.accessToken,
                refresh_token: account.refreshToken,
              });
              
              if (refreshError || !refreshData.session) {
                return { 
                  success: false, 
                  error: 'La session a expiré. Veuillez vous reconnecter avec ce compte.' 
                };
              }
              
              // Mettre à jour les tokens
              account.accessToken = refreshData.session.access_token;
              account.refreshToken = refreshData.session.refresh_token;
              account.expiresAt = refreshData.session.expires_at ? refreshData.session.expires_at * 1000 : Date.now() + 3600000;
              saveAccount(account);
            } catch (retryError: any) {
              return { 
                success: false, 
                error: 'Impossible de restaurer la session. Veuillez vous reconnecter.' 
              };
            }
          } else {
            return { 
              success: false, 
              error: error.message || 'Erreur lors du changement de compte' 
            };
          }
        }
      } catch (sessionError: any) {
        console.error('Error setting session:', sessionError);
        return { 
          success: false, 
          error: sessionError.message || 'Erreur lors du changement de compte' 
        };
      }
    }
    
    // Mettre à jour lastUsed
    account.lastUsed = Date.now();
    saveAccount(account);
    
    return { success: true };
  } catch (e: any) {
    console.error('Error switching account:', e);
    return { 
      success: false, 
      error: e.message || 'Une erreur inattendue est survenue' 
    };
  }
}

export async function saveCurrentAccount(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const supabase = supabaseBrowser();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session || !session.user.email) {
      console.error('No active session to save');
      return;
    }
    
    // Récupérer les données utilisateur
    const res = await fetch('/api/user/me', { credentials: 'include' });
    let userData: any = null;
    if (res.ok) {
      userData = await res.json();
    }
    
    const account: AccountSession = {
      id: session.user.id,
      email: session.user.email,
      displayName: userData?.displayName || userData?.firstName && userData?.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : session.user.email,
      avatar: userData?.avatar || null,
      role: userData?.role || 'MISSIONNAIRE',
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000,
      lastUsed: Date.now(),
    };
    
    saveAccount(account);
  } catch (e) {
    console.error('Error saving current account:', e);
  }
}

export function getCurrentAccountEmail(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const supabase = supabaseBrowser();
    // On ne peut pas utiliser getSession() de manière synchrone côté client
    // Cette fonction sera utilisée avec un état React
    return null;
  } catch (e) {
    return null;
  }
}




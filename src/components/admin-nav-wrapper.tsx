"use client";

import dynamic from 'next/dynamic';
import { AdminNav } from './admin-nav';

// Charger AdminNav uniquement côté client pour éviter les problèmes d'hydratation
const AdminNavClient = dynamic(
  () => import('./admin-nav').then(mod => ({ default: mod.AdminNav })),
  { 
    ssr: false,
    loading: () => null
  }
);

export function AdminNavWrapper() {
  return <AdminNavClient />;
}



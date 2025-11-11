"use client";
import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileRedirectProps {
  userId: string;
  children?: React.ReactNode;
}

export function ProfileRedirect({ userId, children }: ProfileRedirectProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          credentials: 'include',
        });

        if (res.ok) {
          const userData = await res.json();
          setUserRole(userData.role);
        }
      } catch (e) {
        console.error('Error fetching user role:', e);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchUserRole();
    }
  }, [userId]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (userRole === 'ANNONCEUR') {
      router.push(`/annonceurs/${userId}`);
    } else {
      router.push(`/profile/${userId}`);
    }
  }, [userId, userRole, router]);

  if (!children) {
    return null;
  }

  // Envelopper les enfants dans un élément cliquable
  return (
    <div onClick={handleClick} className="cursor-pointer">
      {children}
    </div>
  );
}

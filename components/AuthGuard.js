'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]); // <-- Tambahkan router di sini

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000',
        color: '#f97316',
        fontSize: '1.2rem',
        fontWeight: 'bold'
      }}>
        Loading...
      </div>
    );
  }

  return children;
}
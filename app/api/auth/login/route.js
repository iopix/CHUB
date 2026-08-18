import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function POST(req) {
  try {
    const { username, pin } = await req.json();

    if (!username || !pin) {
      return NextResponse.json(
        { error: 'Username dan PIN wajib diisi' },
        { status: 400 }
      );
    }

    // Cari user di tabel profiles berdasarkan username
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Username tidak ditemukan' },
        { status: 401 }
      );
    }

    // Verifikasi PIN (asumsi kolom namanya 'pin' atau 'password')
    // Sesuaikan dengan nama kolom di tabel kamu
    if (profile.pin !== pin && profile.password !== pin) {
      return NextResponse.json(
        { error: 'PIN salah' },
        { status: 401 }
      );
    }

    // Hapus data sensitif sebelum dikirim ke frontend
    const { pin: _, password: __, ...safeProfile } = profile;

    return NextResponse.json({
      success: true,
      user: safeProfile,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
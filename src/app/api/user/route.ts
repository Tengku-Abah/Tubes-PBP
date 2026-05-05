import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { dbHelpers, getStoredAssetUrl } from '@/lib/supabase';
import { generateToken } from '@/lib/jwt-auth';
import { getApiUser, getCookieUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_avatar?: string | null;
  user_avatar_url?: string | null;
  Provinsi?: string | null;
  Kota?: string | null;
  Kode_pose?: string | null;
}

interface LoginResponse {
  success: boolean;
  data?: {
    user: UserResponse;
    token: string;
    expiresIn: string;
  };
  message: string;
}

interface RegistrationData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role?: 'admin' | 'user';
}

const formatUserResponse = (user: any): UserResponse => ({
  id: String(user.id),
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  address: user.address ?? null,
  role: user.role === 'admin' ? 'admin' : 'user',
  is_active: user.is_active !== false,
  created_at: user.created_at,
  updated_at: user.updated_at,
  user_avatar: user.user_avatar ?? null,
  user_avatar_url: user.user_avatar ? (getStoredAssetUrl(user.user_avatar, '') || null) : null,
  Provinsi: user.Provinsi ?? null,
  Kota: user.Kota ?? null,
  Kode_pose: user.Kode_pose ?? null,
});

async function addAdminUserToDatabase() {
  try {
    const adminEmail = 'admin@gmail.com';
    const { data: existingAdmin } = await dbHelpers.getUserByEmail(adminEmail);

    if (!existingAdmin) {
      await dbHelpers.registerUser({
        email: adminEmail,
        password: '$2b$10$voXgrTXntv2g17ERAGbfo.VdpIWNwn9PIb29g8M3FvOTlxP3.nrMi',
        name: 'Admin User',
        role: 'admin'
      });
    }
  } catch (error) {
    console.error('Error adding admin user:', error);
  }
}

const getRequestUser = (request: NextRequest) => getApiUser(request) || getCookieUser(request);

// POST endpoint untuk login dan registrasi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, action } = body;

    if (action === 'register') {
      await addAdminUserToDatabase();

      const phoneNumber = body.phone || body.phoneNumber || '';

      if (!email || !password || !name || !phoneNumber) {
        return NextResponse.json(
          { success: false, message: 'Name, email, phone and password are required' },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Please enter a valid email address' },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }

      const { data: existingUser } = await dbHelpers.getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Email already registered' },
          { status: 409 }
        );
      }

      const phoneDigits = String(phoneNumber).replace(/\D/g, '');
      if (phoneDigits.length < 6 || phoneDigits.length > 20) {
        return NextResponse.json(
          { success: false, message: 'Please enter a valid phone number' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUserData: RegistrationData = {
        email: String(email).trim(),
        password: hashedPassword,
        name: String(name).trim(),
        phone: String(phoneNumber).trim(),
        role: 'user'
      };

      const { data: newUser, error: insertError } = await dbHelpers.registerUser({
        ...newUserData,
        role: 'user'
      });

      if (insertError || !newUser) {
        console.error('Database insert error:', insertError);
        return NextResponse.json(
          { success: false, message: 'Failed to register user' },
          { status: 500 }
        );
      }

      const responseUser = formatUserResponse(newUser);

      return NextResponse.json({
        success: true,
        data: responseUser,
        message: 'Registration successful'
      });
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { data: userData } = await dbHelpers.getUserByEmail(String(email).trim());

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (userData.is_active === false) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated' },
        { status: 401 }
      );
    }

    const rememberMe = body.rememberMe === true;
    const responseUser = formatUserResponse(userData);

    const jwtToken = generateToken(
      {
        id: String(userData.id),
        email: userData.email,
        role: userData.role,
        name: userData.name
      },
      rememberMe
    );

    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(jwtToken) as any;
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = decoded.exp - now;
    const hours = Math.floor(expiresInSeconds / 3600);
    const minutes = Math.floor((expiresInSeconds % 3600) / 60);
    const seconds = expiresInSeconds % 60;
    const expiresInFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const loginResponse: LoginResponse = {
      success: true,
      data: {
        user: responseUser,
        token: jwtToken,
        expiresIn: expiresInFormatted
      },
      message: 'Login successful'
    };

    const response = NextResponse.json(loginResponse);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint untuk mendapatkan user profile atau semua users (admin only)
export async function GET(request: NextRequest) {
  try {
    const requestUser = getRequestUser(request);
    const { searchParams } = new URL(request.url);
    const requestedId = searchParams.get('id');

    if (requestedId) {
      if (!requestUser) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        );
      }

      if (requestUser.role !== 'admin' && String(requestUser.id) !== requestedId) {
        return NextResponse.json(
          { success: false, message: 'Forbidden' },
          { status: 403 }
        );
      }

      const { data: user, error } = await dbHelpers.getUserById(requestedId);

      if (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to retrieve user' },
          { status: 500 }
        );
      }

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: formatUserResponse(user),
        message: 'User retrieved successfully'
      });
    }

    if (!requestUser || requestUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const { data: users, error } = await dbHelpers.getAllUsers();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (users || []).map(formatUserResponse),
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint untuk update user
export async function PUT(request: NextRequest) {
  try {
    const requestUser = getRequestUser(request);
    const body = await request.json();
    const { id, name, email, phone, address, role, is_active, user_avatar, Provinsi, Kota, Kode_pose } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!requestUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (requestUser.role !== 'admin' && String(requestUser.id) !== String(id)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    const updateData = {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(role !== undefined && requestUser.role === 'admin' && { role }),
      ...(is_active !== undefined && requestUser.role === 'admin' && { is_active }),
      ...(user_avatar !== undefined && { user_avatar }),
      ...(Provinsi !== undefined && { Provinsi }),
      ...(Kota !== undefined && { Kota }),
      ...(Kode_pose !== undefined && { Kode_pose })
    };

    const { data: updatedUser, error } = await dbHelpers.updateUser(String(id), updateData);

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update user' },
        { status: 500 }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatUserResponse(updatedUser),
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint untuk menghapus user
export async function DELETE(request: NextRequest) {
  try {
    const requestUser = getRequestUser(request);

    if (!requestUser || requestUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: deletedUser, error } = await dbHelpers.deleteUser(id);

    if (error) {
      console.error('Database delete error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete user' },
        { status: 500 }
      );
    }

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatUserResponse(deletedUser),
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

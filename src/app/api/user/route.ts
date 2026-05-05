import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbHelpers } from '@/lib/supabase';
import { generateToken } from '@/lib/jwt-auth';

// Force dynamic rendering 
export const dynamic = 'force-dynamic';
export const revalidate = 0;


// Interface untuk User response
interface UserResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_avatar?: string | null;
}

// Interface untuk Login response
interface LoginResponse {
  success: boolean;
  data?: {
    user: UserResponse;
    token: string;
    expiresIn: string;
  };
  message: string;
}

// Interface untuk Registration data
interface RegistrationData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role?: 'admin' | 'user';
}

// Helper function untuk menambahkan admin user ke database
async function addAdminUserToDatabase() {
  try {
    const adminData = {
      email: 'admin@gmail.com',
      password: '$2b$10$voXgrTXntv2g17ERAGbfo.VdpIWNwn9PIb29g8M3FvOTlxP3.nrMi',
      name: 'Admin User',
      role: 'admin' as const
    };

    // Cek apakah admin sudah ada
    const { data: existingAdmin } = await dbHelpers.getUserByEmail('admin@gmail.com');

    if (!existingAdmin) {
      // Tambahkan admin ke database
      const { data, error } = await dbHelpers.registerUser(adminData);

      if (error) {
        console.error('Failed to add admin user:', error);
      } else {
      }
    }
  } catch (error) {
    console.error('Error adding admin user:', error);
  }
}

// POST endpoint untuk login dan registrasi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone, action } = body;

    // Jika action adalah 'register', lakukan registrasi
    if (action === 'register') {
      // Pastikan admin user ada di database
      await addAdminUserToDatabase();

      // Validasi input untuk registrasi
      const phoneNumber = body.phone || body.phoneNumber || '';

      if (!email || !password || !name || !phoneNumber) {
        return NextResponse.json(
          { success: false, message: 'Name, email, phone and password are required' },
          { status: 400 }
        );
      }

      // Validasi email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Please enter a valid email address' },
          { status: 400 }
        );
      }

      // Validasi password length
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }

      // Cek apakah email sudah ada di database
      const { data: existingUser, error: checkError } = await dbHelpers.getUserByEmail(email);

      if (checkError && (checkError as any).code !== 'PGRST116') {
        console.error('Database check failed:', checkError);
        return NextResponse.json(
          { success: false, message: 'Database error occurred' },
          { status: 500 }
        );
      }

      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Email already registered' },
          { status: 409 }
        );
      }

      // Basic phone number validation (digits, length 6..20)
      const phoneDigits = phoneNumber.replace(/\D/g, '');
      if (phoneDigits.length < 6 || phoneDigits.length > 20) {
        return NextResponse.json(
          { success: false, message: 'Please enter a valid phone number' },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Buat user baru untuk database
      const newUserData: RegistrationData = {
        email: email,
        password: hashedPassword,
        name: name,
        phone: phoneNumber,
        role: 'user' as const // Default role untuk user yang registrasi
      };

      // Simpan ke database
      const { data: newUser, error: insertError } = await dbHelpers.registerUser({
        ...newUserData,
        role: newUserData.role === 'user' ? 'user' : newUserData.role
      });

      if (insertError) {
        console.error('Database insert error:', insertError);
        const errorMessage = (insertError as any)?.message || 'Gagal mendaftarkan user';
        return NextResponse.json(
          { success: false, message: errorMessage },
          { status: 500 }
        );
      }

      // Return user data tanpa password
      const { password: _, ...userWithoutPassword } = newUser;

      return NextResponse.json({
        success: true,
        data: userWithoutPassword as UserResponse,
        message: 'Registration successful'
      });
    }

    // Jika action adalah 'login' atau tidak ada action, lakukan login
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Cari user berdasarkan email di database
    const { data: userData, error: userError } = await dbHelpers.getUserByEmail(email);

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Cek apakah user aktif
    const isActive = userData.is_active !== undefined ? userData.is_active : userData.isActive;
    if (!isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Get rememberMe flag from request
    const rememberMe = body.rememberMe === true;

    // Return user data (tanpa password)
    const { password: _, ...userWithoutPassword } = userData;

    // Generate JWT token with user data
    const jwtToken = generateToken(
      {
        id: String(userData.id),
        email: userData.email,
        role: userData.role,
        name: userData.name
      },
      rememberMe
    );

    // Decode token to get expiration details
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(jwtToken) as any;
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = decoded.exp - now;

    // Calculate hours, minutes, seconds
    const hours = Math.floor(expiresInSeconds / 3600);
    const minutes = Math.floor((expiresInSeconds % 3600) / 60);
    const seconds = expiresInSeconds % 60;

    // Format as HH:MM:SS
    const expiresInFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const loginResponse: LoginResponse = {
      success: true,
      data: {
        user: userWithoutPassword as UserResponse,
        token: jwtToken, // Real JWT token with signature
        expiresIn: expiresInFormatted // Format: HH:MM:SS
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

// GET endpoint untuk mendapatkan semua users (admin only)
export async function GET(request: NextRequest) {
  try {
    // In production, verify JWT token here
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Get all users from database
    const { data: users, error } = await dbHelpers.getAllUsers();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve users' },
        { status: 500 }
      );
    }

    // Return users without passwords
    const usersWithoutPasswords = users?.map((user: any) => {
      const { password, ...rest } = user;
      return rest as UserResponse;
    }) || [];

    return NextResponse.json({
      success: true,
      data: usersWithoutPasswords,
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
    const body = await request.json();
    const { id, name, email, phone, address, role, is_active, user_avatar, Provinsi, Kota, Kode_pose } = body;

    // Validasi input
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update user in database
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(role && { role }),
      ...(is_active !== undefined && { is_active }),
      ...(user_avatar !== undefined && { user_avatar }),
      ...(Provinsi !== undefined && { Provinsi }),
      ...(Kota !== undefined && { Kota }),
      ...(Kode_pose !== undefined && { Kode_pose })
    };

    const { data: updatedUser, error } = await dbHelpers.updateUser(id, updateData);

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

    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword as UserResponse,
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete user from database
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

    const { password, ...userWithoutPassword } = deletedUser;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword as UserResponse,
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

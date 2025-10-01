import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbHelpers, ApiResponse, User } from '../../../lib/supabase';

// Dummy user data (akan diganti dengan database)
const dummyUsers = [
  {
    id: 1,
    email: 'admin@gmail.com',
    password: '$2b$10$voXgrTXntv2g17ERAGbfo.VdpIWNwn9PIb29g8M3FvOTlxP3.nrMi', // Admin08
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 2,
    email: 'user@gmail.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    name: 'Regular User',
    role: 'pembeli',
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

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
    const { email, password, name, action } = body;

    // Jika action adalah 'register', lakukan registrasi
    if (action === 'register') {
      // Pastikan admin user ada di database
      await addAdminUserToDatabase();

      // Validasi input untuk registrasi
      if (!email || !password || !name) {
        return NextResponse.json(
          { success: false, message: 'Name, email and password are required' },
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

      // Cek apakah email sudah ada di database (case-sensitive)
      const { data: existingUser, error: checkError } = await dbHelpers.getUserByEmail(email);

      // Jika database error, fallback ke dummy data
      if (checkError && (checkError as any).code !== 'PGRST116') {
        console.warn('Database check failed, using dummy data fallback:', checkError);
        const dummyUser = dummyUsers.find(u => u.email === email);
        if (dummyUser) {
          return NextResponse.json(
            { success: false, message: 'Email already registered' },
            { status: 409 }
          );
        }
      } else if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Email already registered' },
          { status: 409 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Buat user baru untuk database
      const newUserData = {
        email: email,
        password: hashedPassword,
        name: name,
        role: 'pembeli' as const // Default role untuk user yang registrasi
        // is_active: true // Kolom ini belum ada di database
      };

      // Simpan ke database
      const { data: newUser, error: insertError } = await dbHelpers.registerUser(newUserData);

      if (insertError) {
        console.error('Database insert error, using dummy data fallback:', insertError);

        // Fallback ke dummy data jika database error
        const newId = Math.max(...dummyUsers.map(u => u.id)) + 1;
        const fallbackUser = {
          id: newId,
          email: email,
          password: hashedPassword,
          name: name,
          role: 'pembeli', // Default role untuk user yang registrasi
          createdAt: new Date().toISOString(),
          isActive: true
        };

        dummyUsers.push(fallbackUser);

        const { password: _, ...userWithoutPassword } = fallbackUser;

        return NextResponse.json({
          success: true,
          data: {
            user: userWithoutPassword,
            message: 'Registration successful (using fallback storage)'
          }
        });
      }

      // Return user data tanpa password
      const { password: _, ...userWithoutPassword } = newUser;

      return NextResponse.json({
        success: true,
        data: {
          user: userWithoutPassword,
          message: 'Registration successful'
        }
      });
    }

    // Jika action adalah 'login' atau tidak ada action, lakukan login
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Cari user berdasarkan email di database (case-sensitive)
    const { data: user, error: userError } = await dbHelpers.getUserByEmail(email);

    let userData = user;

    // Jika database error, fallback ke dummy data
    if (userError && (userError as any).code !== 'PGRST116') {
      console.warn('Database login failed, using dummy data fallback:', userError);
      userData = dummyUsers.find(u => u.email === email);
    }

    if (!userData) {
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

    // Return user data (tanpa password)
    const { password: _, ...userWithoutPassword } = userData;

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token: 'dummy-jwt-token-' + user.id, // In production, use real JWT
        expiresIn: '24h'
      },
      message: 'Login successful'
    });

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

    // Return users without passwords
    const usersWithoutPasswords = dummyUsers.map(({ password, ...user }) => user);

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
    const { id, name, email, role, isActive } = body;

    // Validasi input
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const userIndex = dummyUsers.findIndex(u => u.id === parseInt(id));

    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update user data
    dummyUsers[userIndex] = {
      ...dummyUsers[userIndex],
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive })
    };

    const { password, ...updatedUser } = dummyUsers[userIndex];

    return NextResponse.json({
      success: true,
      data: updatedUser,
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

    const userIndex = dummyUsers.findIndex(u => u.id === parseInt(id));

    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const deletedUser = dummyUsers.splice(userIndex, 1)[0];
    const { password, ...userWithoutPassword } = deletedUser;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
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

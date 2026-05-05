'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import React from "react";

interface HeaderProps {
    searchTerm?: string;
    onSearchChange?: (v: string) => void;
    onSearchSubmit?: (e: React.FormEvent) => void;
}

const getBrowserUser = () => {
    try {
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
            return JSON.parse(sessionUser);
        }

        const rememberedUser = localStorage.getItem('user');
        const rememberMe = localStorage.getItem('rememberMe');
        if (rememberedUser && rememberMe === 'true') {
            return JSON.parse(rememberedUser);
        }
    } catch (error) {
        console.error('Error reading user from browser storage:', error);
    }

    return null;
};

export default function Header({ searchTerm = '', onSearchChange, onSearchSubmit }: HeaderProps){
    const [user, setUser] = useState<any | null>(null);
    const [cartCount, setCartCount] = useState<number>(0);
    const router = useRouter();

    useEffect(() => {
        const refreshUser = () => {
            setUser(getBrowserUser());
        };

        refreshUser();

        const handleStorage = (e: StorageEvent) => {
            if (!e.key || ['user', 'rememberMe', 'loginTime'].includes(e.key)) {
                refreshUser();
            }
        };

        const handleFocus = () => refreshUser();
        const handleUserUpdate = () => refreshUser();

        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('userAvatarUpdated', handleUserUpdate as EventListener);
        document.addEventListener('visibilitychange', handleFocus);

        return() => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('userAvatarUpdated', handleUserUpdate as EventListener);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, []);

    useEffect(() =>{
        if(!user){
            setCartCount(0);
            return;
        }

        const fetchCartCount = async () => {
            if (!user?.id) {
                setCartCount(0);
                return;
            }

            try {
                const response = await fetch(`/api/cart?user_id=${user.id}`);
                const data = await response.json();

                if (data.success && data.data) {
                    const totalItems = data.data.reduce((sum: number, item: any) => sum + item.quantity, 0);
                    setCartCount(totalItems);
                } else {
                    setCartCount(0);
                }
            } catch (error) {
                console.error('Error fetching cart count:', error);
                setCartCount(0);
            }
        };

        fetchCartCount();

        const handleCartUpdate = () => {
            fetchCartCount();
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, [user]);

    const handleLogout = async () => {
        const currentUserStr = sessionStorage.getItem('user');
        const currentRole = (() => {
            try { return currentUserStr ? JSON.parse(currentUserStr)?.role : null; } catch { return null; }
        })();

        sessionStorage.clear();

        try {
            localStorage.removeItem('user');
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('loginTime');

            if (currentRole === 'admin') {
                document.cookie = 'admin-auth-token=; path=/Admin; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            } else {
                document.cookie = 'user-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        } catch (e) {
            console.error('Logout cleanup error:', e);
        }
        setUser(null);
        router.push('/');
    };

    return(
        <header className="bg-primary-700 border-b border-primary-800">
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link href="/" className="text-xl font-bold text-white">
                        OctaMart
                    </Link>

                    <form onSubmit={onSearchSubmit} className="w-full max-w-md">
                        <div className="flex gap-2">
                            <input
                                aria-label="Search products"
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-md bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-shadow duration-150 ease-in-out"
                            />
                            <button aria-label="Submit search" type="submit" className="px-3 py-2 bg-white text-gray-700 text-sm rounded-md border border-gray-200 hover:bg-gray-100 transition-colors duration-150 ease-in-out">Search</button>
                        </div>
                    </form>
                </div>

                <nav className="flex items-center gap-4 w-full md:w-auto transition-all duration-200 ease-in-out">
                    <Link href="/cart" className="text-white flex items-center gap-2 hover:text-primary-200 transition-colors duration-200">
                        <div className="relative">
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </div>
                        <span className="hidden sm:inline">Cart</span>
                        {cartCount > 0 && (
                            <span className="sm:hidden text-xs">({cartCount})</span>
                        )}
                    </Link>

                    {user && (
                        <Link href="/profile" className="text-white hover:text-primary-200 transition-colors">Profile</Link>
                    )}

                    {user ? (
                        <button onClick={handleLogout}
                            className="text-sm px-3 py-1 border border-white rounded bg-red-600 text-white hover:bg-red-700 transition-colors">
                            Logout
                        </button>
                    ) : (
                        <Link href="/Login" className="text-sm px-3 py-1 border border-white rounded bg-white text-gray-700 hover:bg-gray-50 transition-colors">Login</Link>
                    )}
                </nav>
            </div>
        </header>
    );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, logout } from '@/lib/api';

const topLevelLinks = [
    { name: 'Dashboard', href: '/home' },
    { name: 'Sales', href: '/sales' },
    { name: 'Sales Details', href: '/sales-details' },
    { name: 'Customers', href: '/customers' },
    { name: 'Locations', href: '/locations' },
    { name: 'Administration', href: '/admin' }
];

const inventorySubLinks = [
    { name: 'Products', href: '/products' },
    { name: 'Categories', href: '/categories' },
    { name: 'Inventories', href: '/inventories' },
    { name: 'Suppliers', href: '/suppliers' },
    { name: 'Purchase Orders', href: '/purchase-orders' },
    { name: 'PO Details', href: '/purchase-order-details' },
    { name: 'Stock Movements', href: '/stock-movements' },
];

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [inventoryOpen, setInventoryOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            router.push('/login');
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setInventoryOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setInventoryOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isInventoryActive = inventorySubLinks.some(l => pathname === l.href);

    if (!isAuthenticated) return null;

    const navLinkStyle = (active: boolean) => ({
        color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
        fontWeight: active ? 700 : 500,
        fontSize: '0.95rem',
        transition: 'all 0.3s ease',
        position: 'relative' as const,
        padding: '0.5rem 0'
    });

    const activeBar = (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: '#ffffff',
            borderRadius: '2px',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
        }}></div>
    );

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-dark)' }}>
            {/* Decorative gradient background elements */}
            <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>
            <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>

            <nav style={{
                padding: '1.25rem 3rem',
                background: 'linear-gradient(135deg, #0c4a6e, #0284c7, #38bdf8)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                margin: '1rem',
                borderRadius: '20px',
                boxShadow: '0 10px 40px -10px rgba(2, 132, 199, 0.4), 0 4px 12px rgba(0, 0, 0, 0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3.5rem' }}>
                    <h2 style={{
                        fontFamily: 'var(--font-outfit)',
                        color: '#ffffff',
                        fontWeight: 900,
                        margin: 0,
                        fontSize: '1.5rem',
                        letterSpacing: '-0.02em',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}>
                        Inventory App
                    </h2>

                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        {/* Dashboard link */}
                        <Link href="/home" style={navLinkStyle(pathname === '/home')}>
                            Dashboard
                            {pathname === '/home' && activeBar}
                        </Link>

                        {/* Inventory dropdown */}
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setInventoryOpen(prev => !prev)}
                                style={{
                                    ...navLinkStyle(isInventoryActive),
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Inventory
                                <svg
                                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                                    style={{
                                        transition: 'transform 0.25s ease',
                                        transform: inventoryOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        opacity: 0.5
                                    }}
                                >
                                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {isInventoryActive && activeBar}
                            </button>

                            {/* Dropdown menu */}
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 0.75rem)',
                                left: '50%',
                                transform: `translateX(-50%) scale(${inventoryOpen ? 1 : 0.95})`,
                                minWidth: '200px',
                                background: 'linear-gradient(135deg, rgba(12, 74, 110, 0.95), rgba(2, 132, 199, 0.95))',
                                backdropFilter: 'blur(24px)',
                                WebkitBackdropFilter: 'blur(24px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '16px',
                                padding: '0.5rem',
                                boxShadow: '0 20px 50px -10px rgba(2, 132, 199, 0.35), 0 4px 12px rgba(0, 0, 0, 0.1)',
                                opacity: inventoryOpen ? 1 : 0,
                                pointerEvents: inventoryOpen ? 'auto' as const : 'none' as const,
                                transition: 'opacity 0.2s ease, transform 0.2s ease',
                                zIndex: 200,
                            }}>
                                {inventorySubLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        style={{
                                            display: 'block',
                                            padding: '0.7rem 1rem',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            fontWeight: pathname === link.href ? 700 : 500,
                                            color: pathname === link.href ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                                            background: pathname === link.href ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (pathname !== link.href) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (pathname !== link.href) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Sales & Admin links */}
                        {topLevelLinks.filter(l => l.href !== '/home').map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={navLinkStyle(pathname === link.href)}
                            >
                                {link.name}
                                {pathname === link.href && activeBar}
                            </Link>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right', display: 'none' }} className="responsive-hide-mobile">
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>System Active</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--secondary)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem' }}>
                            <span style={{ width: '6px', height: '6px', background: 'var(--secondary)', borderRadius: '50%' }}></span> Verified Session
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '0.6rem 1.25rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            background: 'rgba(255, 255, 255, 0.15)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            fontFamily: 'var(--font-outfit)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
                    >
                        Sign Out
                    </button>
                </div>
            </nav>

            <main style={{
                position: 'relative',
                zIndex: 1,
                padding: '1rem 2rem 5rem',
                maxWidth: '1500px',
                margin: '0 auto'
            }}>
                {children}
            </main>
        </div>
    );
}

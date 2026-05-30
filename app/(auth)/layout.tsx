'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, getUserRole, getUserFullName, logout } from '@/lib/api';

const topLevelLinks = [
    { name: 'Dashboard', href: '/home' },
    { name: 'Reports',   href: '/reports', roles: ['Admin', 'Accountant'] },
    { name: 'Users',     href: '/users',   roles: ['Admin'] },
    { name: 'Admin',     href: '/admin',   roles: ['Admin'] }
];

const masterControlLinks = [
    { name: 'Categories', href: '/categories' },
    { name: 'Warehouses', href: '/locations' },
    { name: 'Suppliers', href: '/suppliers' },
    { name: 'Customers', href: '/customers' },
    { name: 'Products', href: '/products' }
];

const inventoryControlLinks = [
    { name: 'Inventory List', href: '/inventories' },
    { name: 'Purchase Requisitions', href: '/purchase-requisitions' },
    { name: 'Purchase Orders', href: '/purchase-orders' },
    { name: 'Goods Received (GRN)', href: '/grns' }
];

const salesControlLinks = [
    { name: 'Sales Orders', href: '/sales' },
    { name: 'Delivery Notes', href: '/delivery-notes' },
    { name: 'Sales Invoices', href: '/sales-invoices' }
];

const stockControlLinks = [
    { name: 'Stock Adjustments', href: '/stock-adjustments' },
    { name: 'Stock Transfers',   href: '/stock-transfers' },
    { name: 'Stock Movements',   href: '/stock-movements' }
];

function NavGroup({ title, links, pathname }: { title: string; links: any[]; pathname: string }) {
    return (
        <div>
            <div style={{ padding: '0.5rem 1rem 0.25rem', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {title}
            </div>
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    style={{
                        display: 'block',
                        padding: '0.6rem 1rem',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: pathname === link.href ? 700 : 500,
                        color: pathname === link.href ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                        background: pathname === link.href ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        transition: 'all 0.15s ease',
                    }}
                >
                    {link.name}
                </Link>
            ))}
        </div>
    );
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState('User');
    const [userName, setUserName] = useState('User');
    const [lookupOpen, setLookupOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            router.push('/login');
        } else {
            setIsAuthenticated(true);
            setUserRole(getUserRole());
            setUserName(getUserFullName());
        }
    }, [router]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setLookupOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setLookupOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isLookupActive = [
        ...masterControlLinks, 
        ...inventoryControlLinks, 
        ...salesControlLinks, 
        ...stockControlLinks
    ].some(l => pathname === l.href);

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

                        {/* Lookup dropdown */}
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setLookupOpen(prev => !prev)}
                                style={{
                                    ...navLinkStyle(isLookupActive),
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Lookup
                                <svg
                                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                                    style={{
                                        transition: 'transform 0.25s ease',
                                        transform: lookupOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        opacity: 0.5
                                    }}
                                >
                                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {isLookupActive && activeBar}
                            </button>

                            {/* Dropdown menu */}
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 0.75rem)',
                                left: '50%',
                                transform: `translateX(-50%) scale(${lookupOpen ? 1 : 0.95})`,
                                minWidth: '560px',
                                background: 'linear-gradient(135deg, rgba(12, 74, 110, 0.98), rgba(2, 132, 199, 0.98))',
                                backdropFilter: 'blur(24px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '16px',
                                padding: '1.25rem',
                                boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.5)',
                                opacity: lookupOpen ? 1 : 0,
                                pointerEvents: lookupOpen ? 'auto' : 'none',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                zIndex: 200,
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.5rem 1.5rem',
                            }}>
                                <div>
                                    <NavGroup title="Master Control" links={masterControlLinks} pathname={pathname} />
                                    <div style={{ margin: '0.5rem 0', height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                                    <NavGroup title="Sales Control" links={salesControlLinks} pathname={pathname} />
                                </div>
                                <div>
                                    <NavGroup title="Inventory Control" links={inventoryControlLinks} pathname={pathname} />
                                    <div style={{ margin: '0.5rem 0', height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                                    <NavGroup title="Stock Control" links={stockControlLinks} pathname={pathname} />
                                </div>
                            </div>
                        </div>

                        {/* Sales & Admin links */}
                        {topLevelLinks
                            .filter(l => l.href !== '/home')
                            .filter(l => !l.roles || l.roles.includes(userRole))
                            .map((link) => (
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
                    <div style={{ textAlign: 'right' }} className="responsive-hide-mobile">
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, color: 'white' }}>{userName}</p>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem' }}>
                            <span style={{ width: '6px', height: '6px', background: '#38bdf8', borderRadius: '50%' }}></span> {userRole}
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

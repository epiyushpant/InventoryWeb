'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, getUserRole, getUserFullName, logout } from '@/lib/api';

const topLevelLinks = [
    { name: 'Dashboard', href: '/home' },
    { name: 'Reports',   href: '/reports' },
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

function getIcon(name: string) {
    switch(name) {
        case 'Dashboard':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="9" />
                    <rect x="14" y="3" width="7" height="5" />
                    <rect x="14" y="12" width="7" height="9" />
                    <rect x="3" y="16" width="7" height="5" />
                </svg>
            );
        case 'Categories':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
            );
        case 'Warehouses':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" />
                    <path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1H3" />
                    <path d="M19 21V11a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10" />
                </svg>
            );
        case 'Suppliers':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
            );
        case 'Customers':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            );
        case 'Products':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
            );
        case 'Inventory List':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
            );
        case 'Purchase Requisitions':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            );
        case 'Purchase Orders':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
            );
        case 'Goods Received (GRN)':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="8 17 12 21 16 17" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
                </svg>
            );
        case 'Sales Orders':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
            );
        case 'Delivery Notes':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
            );
        case 'Sales Invoices':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            );
        case 'Stock Adjustments':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
            );
        case 'Stock Transfers':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
            );
        case 'Stock Movements':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                </svg>
            );
        case 'Reports':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
            );
        case 'Users':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                </svg>
            );
        case 'Admin':
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            );
        default:
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
            );
    }
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState('User');
    const [userName, setUserName] = useState('User');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

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

    // Handle route-specific toggle behavior on mobile
    useEffect(() => {
        // Automatically close sidebar on mobile screen size after page change
        if (window.innerWidth <= 1024) {
            setSidebarOpen(false);
        }
    }, [pathname]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (!isAuthenticated) return null;

    return (
        <div className="app-container">
            {/* Decorative background gradients */}
            <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>
            <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>

            {/* Sidebar overlay backdrop for mobile */}
            <div 
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
                onClick={() => setSidebarOpen(false)}
            />

            {/* Left Sidebar Menu */}
            <aside className={`app-sidebar ${sidebarOpen ? 'open-mobile' : 'collapsed'}`}>
                {/* Logo and App Title */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="sidebar-logo-text">INVENTORY SHARE</span>
                </div>

                {/* Sidebar scrollable links */}
                <div className="sidebar-menu">
                    {/* General Section */}
                    <Link href="/home" className={`sidebar-link ${pathname === '/home' ? 'active' : ''}`}>
                        {getIcon('Dashboard')}
                        <span>Dashboard</span>
                    </Link>
                    <Link href="/reports" className={`sidebar-link ${pathname === '/reports' ? 'active' : ''}`}>
                        {getIcon('Reports')}
                        <span>Reports</span>
                    </Link>

                    {/* Master Control Section */}
                    <div className="sidebar-group-title">Master Control</div>
                    {masterControlLinks.map(link => (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                        >
                            {getIcon(link.name)}
                            <span>{link.name}</span>
                        </Link>
                    ))}

                    {/* Inventory Control Section */}
                    <div className="sidebar-group-title">Inventory Control</div>
                    {inventoryControlLinks.map(link => (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                        >
                            {getIcon(link.name)}
                            <span>{link.name}</span>
                        </Link>
                    ))}

                    {/* Sales Control Section */}
                    <div className="sidebar-group-title">Sales Control</div>
                    {salesControlLinks.map(link => (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                        >
                            {getIcon(link.name)}
                            <span>{link.name}</span>
                        </Link>
                    ))}

                    {/* Stock Control Section */}
                    <div className="sidebar-group-title">Stock Control</div>
                    {stockControlLinks.map(link => (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                        >
                            {getIcon(link.name)}
                            <span>{link.name}</span>
                        </Link>
                    ))}

                    {/* Admin Section */}
                    {userRole === 'Admin' && (
                        <>
                            <div className="sidebar-group-title">Admin Controls</div>
                            {topLevelLinks
                                .filter(link => link.href !== '/home' && link.href !== '/reports')
                                .filter(link => !link.roles || link.roles.includes(userRole))
                                .map(link => (
                                    <Link 
                                        key={link.href} 
                                        href={link.href} 
                                        className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                                    >
                                        {getIcon(link.name)}
                                        <span>{link.name}</span>
                                    </Link>
                                ))
                            }
                        </>
                    )}
                </div>
            </aside>

            {/* Main Application Area */}
            <div className="app-main">
                {/* Header/Topbar */}
                <header className="app-topbar">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {/* Hamburger toggle button */}
                        <button 
                            className="topbar-toggle-btn" 
                            onClick={() => setSidebarOpen(prev => !prev)}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        {/* Page Title */}
                        <span className="topbar-title">
                            {pathname === '/home' 
                                ? 'Dashboard Overview' 
                                : pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                            }
                        </span>
                    </div>

                    {/* User profile & exit area */}
                    <div className="topbar-user-area">
                        <div className="topbar-profile">
                            <div className="topbar-avatar">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ textAlign: 'left' }} className="responsive-hide-mobile">
                                <p className="topbar-username">{userName}</p>
                                <p className="topbar-role">{userRole}</p>
                            </div>
                        </div>

                        {/* Exit icon logout button matching Mero Share visual style */}
                        <button 
                            className="topbar-logout-btn" 
                            onClick={handleLogout}
                            title="Sign Out"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Subpage Content */}
                <main className="app-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

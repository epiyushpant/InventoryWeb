'use client';

import Link from 'next/link';
import { useCapabilities } from '@/components/CapabilityProvider';
import PageHeader from '@/components/PageHeader';

const CARDS = [
  {
    href: '/admin/capabilities',
    title: 'Modules & pages',
    desc: 'Choose a business preset, then pick the modules, pages, reports and fields this shop uses.',
  },
  {
    href: '/roles',
    title: 'Roles & permissions',
    desc: 'Decide which pages and reports each role may open. A role can only be granted what the shop has enabled.',
  },
  {
    href: '/users',
    title: 'Users',
    desc: 'Create staff logins and assign their roles.',
  },
  {
    href: '/admin/shops',
    title: 'Provision a shop',
    desc: 'Create another tenant with its own Admin. Existing shop data stays isolated.',
  },
];

export default function AdminPage() {
  const { preset, tenantName } = useCapabilities();

  return (
    <div className="animate-fade">
      <PageHeader
        title="Administration"
        subtitle={`Settings for ${tenantName || 'this shop'}. Stock safety, VAT, PAN and document locks stay always on.`}
      />

      <div className="admin-hub">
        {CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="admin-hub-card">
            <strong>{card.title}</strong>
            <span>{card.desc}</span>
          </Link>
        ))}
      </div>

      <p style={{ marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Active preset: <strong style={{ color: 'var(--text-main)' }}>{preset || 'Full'}</strong>
      </p>
    </div>
  );
}

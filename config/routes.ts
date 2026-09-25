export const navigationItems = [
  { label: 'Overview', path: '/dashboard/category', expectedText: 'Overview' },
  { label: 'All Drafts', path: '/dashboard/category/draft', expectedText: 'All Drafts' },
  { label: 'Bin', path: '/dashboard/category/bin', expectedText: 'Bin' },
  { label: 'Tenant Management', path: '/dashboard/tenant', expectedText: 'Tenant Management' },
  { label: 'Messages', path: '/dashboard/message', expectedText: 'Messages' },
  { label: 'Damage Reports', path: '/dashboard/damage-report', expectedText: 'Damage Reports' },
  { label: 'Documents', path: '/dashboard/folder-document', expectedText: 'Documents' },
  { label: 'Service Providers', path: '/dashboard/service-provider', expectedText: 'Service Providers' },
  { label: 'Data', path: '/dashboard/data', expectedText: 'Data' },
  { label: 'Settings', path: '/dashboard/setting', expectedText: 'Settings' },
] as const;

export const criticalPaths = [
  { path: '/dashboard', expectedText: 'Overview' },
  ...navigationItems,
] as const;

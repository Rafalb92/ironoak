export interface NavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Products' },
  { to: '/collections', label: 'Collections' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function useSiteNavigation() {
  const route = useRoute();

  // '/' musi być dokładne — inaczej byłoby aktywne na każdej stronie
  function isActive(to: string): boolean {
    if (to === '/') return route.path === '/';
    return route.path === to || route.path.startsWith(`${to}/`);
  }

  return { items: NAV_ITEMS, isActive };
}

export const colors = {
  primary: '#3B82F6',
  primaryLight: '#EFF6FF',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  success: '#10B981',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  border: '#ddd',
  borderLight: '#eee',
  divider: '#f0f0f0',
  bg: { white: '#fff', page: '#f8f9fa', input: '#fafafa', muted: '#F3F4F6' },
  text: { primary: '#111', body: '#333', secondary: '#555', muted: '#666', hint: '#999', disabled: '#bbb' },
} as const;

export const radius = { sm: 4, md: 8, lg: 12, pill: 20 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const font = { xs: 11, sm: 12, md: 13, base: 14, lg: 15, xl: 16, '2xl': 18, '3xl': 22 } as const;

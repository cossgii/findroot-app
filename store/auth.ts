import { atom } from 'jotai';

export type AppUser = { id: string; name: string; email: string };

export const userAtom = atom<AppUser | null>(null);

import { atom } from 'jotai';

export type AppUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export const userAtom = atom<AppUser | null>(null);

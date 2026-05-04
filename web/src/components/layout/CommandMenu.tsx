'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  Search,
  MapPin,
  Ticket,
  HelpCircle,
  LogIn,
  User,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/shadcn/command';

interface CommandMenuProps {
  readonly locale: string;
}

export function CommandMenu({ locale }: CommandMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function go(path: string): void {
    router.push(`/${locale}${path}`);
    setOpen(false);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Navigation rapide"
      description="Cherchez une page ou une action"
    >
      <CommandInput placeholder="Tapez une commande ou recherchez…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go('')}>
            <Home className="h-4 w-4" />
            <span>Accueil</span>
            <CommandShortcut>⌘H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('/search')}>
            <Search className="h-4 w-4" />
            <span>Rechercher un trajet</span>
          </CommandItem>
          <CommandItem onSelect={() => go('/tracking')}>
            <MapPin className="h-4 w-4" />
            <span>Suivre mon voyage</span>
          </CommandItem>
          <CommandItem onSelect={() => go('/account/bookings')}>
            <Ticket className="h-4 w-4" />
            <span>Mes réservations</span>
          </CommandItem>
          <CommandItem onSelect={() => go('/help')}>
            <HelpCircle className="h-4 w-4" />
            <span>Centre d&apos;aide</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Compte">
          <CommandItem onSelect={() => go('/login')}>
            <LogIn className="h-4 w-4" />
            <span>Connexion</span>
          </CommandItem>
          <CommandItem onSelect={() => go('/account')}>
            <User className="h-4 w-4" />
            <span>Mon compte</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

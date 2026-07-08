import { AppItem, Category, UserItem } from './types';

export const MOCK_USERS: UserItem[] = [
  { id: '1', email: 'admin@nexusplay.com', name: 'Admin Nexus', role: 'admin', status: 'active', joinedAt: '2026-05-01' },
  { id: '2', email: 'dev@studio.com', name: 'Studio Dev', role: 'developer', status: 'active', joinedAt: '2026-05-10' },
  { id: '3', email: 'gamer_x@email.com', name: 'GamerX', role: 'user', status: 'active', joinedAt: '2026-05-12' },
  { id: '4', email: 'spam@fake.com', name: 'Spam Bot', role: 'user', status: 'suspended', joinedAt: '2026-05-13' },
];

export const MOCK_REPORTS = [
  { id: '1', type: 'app', target: 'Free Fire', reason: 'Contenido inapropiado', status: 'pending', user: 'GamerX' },
  { id: '2', type: 'review', target: 'Reseña en Roblox', reason: 'Spam/Bots', status: 'reviewed', user: 'System' },
  { id: '3', type: 'user', target: 'Spam Bot', reason: 'Cuentas múltiples', status: 'pending', user: 'GamerX' }
];

export const MOCK_DEVREQS = [
  { id: '1', user: 'Dev Elite', email: 'elite@dev.com', status: 'pending', date: '2026-05-14' },
  { id: '2', user: 'Indie Games', email: 'indie@games.com', status: 'pending', date: '2026-05-13' }
];

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Juegos', icon: 'Gamepad2', color: 'bg-blue-500/20 text-blue-500' },
  { id: '2', name: 'Herramientas', icon: 'Wrench', color: 'bg-orange-500/20 text-orange-500' },
  { id: '3', name: 'Educación', icon: 'BookOpen', color: 'bg-red-500/20 text-red-500' },
  { id: '4', name: 'Productividad', icon: 'Briefcase', color: 'bg-indigo-500/20 text-indigo-500' },
  { id: '5', name: 'Entretenimiento', icon: 'Film', color: 'bg-pink-500/20 text-pink-500' },
  { id: '6', name: 'IA', icon: 'Brain', color: 'bg-purple-500/20 text-purple-500' },
  { id: '7', name: 'Social', icon: 'Users', color: 'bg-green-500/20 text-green-500' },
  { id: '8', name: 'Utilidades', icon: 'Box', color: 'bg-teal-500/20 text-teal-500' },
  { id: '9', name: 'Música', icon: 'Music', color: 'bg-yellow-500/20 text-yellow-500' },
  { id: '10', name: 'Personalización', icon: 'Monitor', color: 'bg-cyan-500/20 text-cyan-500' }
];

export const DEMO_APPS: AppItem[] = [
  {
    id: 'minecraft',
    name: 'Minecraft',
    developer: 'Mojang Studios',
    rating: 4.6,
    downloads: '100M+',
    category: 'aventura',
    icon: 'https://images.sftcdn.net/images/t_app-icon-m/p/4cc96f7e-96d1-11e6-a059-00163ed833e7/3103239276/minecraft-pocket-edition-icon.png',
    price: 'Gratis',
    status: 'published',
  },
  {
    id: 'freefire',
    name: 'Free Fire',
    developer: 'Garena',
    rating: 4.4,
    downloads: '500M+',
    category: 'acción',
    icon: 'https://images.sftcdn.net/images/t_app-icon-m/p/a9e701ba-b2cb-4654-8975-6842fcd6200f/1761899120/garena-free-fire-icon.png',
    price: 'Gratis',
    status: 'published',
  },
  {
    id: 'roblox',
    name: 'Roblox',
    developer: 'Roblox Corporation',
    rating: 4.4,
    downloads: '500M+',
    category: 'aventura',
    icon: 'https://images.sftcdn.net/images/t_app-icon-m/p/5a0c3672-9b2f-11e6-ba7e-00163ed833e7/3932822464/roblox-icon.png',
    price: 'Gratis',
    status: 'published',
  },
  {
    id: 'clashroyale',
    name: 'Clash Royale',
    developer: 'Supercell',
    rating: 4.3,
    downloads: '100M+',
    category: 'estrategia',
    icon: 'https://images.sftcdn.net/images/t_app-icon-m/p/3b128522-a4de-11e6-b605-00163ed833e7/3847849175/clash-royale-icon.png',
    price: 'Gratis',
    status: 'published',
  },
];

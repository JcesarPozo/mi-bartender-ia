/**
 * lib/plans.ts
 * Definición de planes, límites y utilidades de suscripción.
 */

export type Plan = 'free' | 'premium';

export interface PlanConfig {
  id: Plan;
  name: string;
  nameEn: string;
  emoji: string;
  price: number;          // USD/mes
  cocktailsPerDay: number; // -1 = ilimitado
  catalogMax: number;      // -1 = ilimitado
  proMode: boolean;
  imageRegen: boolean;
  shareCard: boolean;
  color: string;
  colorLight: string;
}

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Gratis',
    nameEn: 'Free',
    emoji: '🍺',
    price: 0,
    cocktailsPerDay: 5,
    catalogMax: 20,
    proMode: false,
    imageRegen: false,
    shareCard: false,
    color: 'text-[#f5c842]/60',
    colorLight: 'text-[#8B6914]/60',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    nameEn: 'Premium',
    emoji: '🥂',
    price: 9.99,
    cocktailsPerDay: -1,
    catalogMax: -1,
    proMode: true,
    imageRegen: true,
    shareCard: true,
    color: 'text-[#f5c842]',
    colorLight: 'text-[#8B6914]',
  },
};

export function canCreateCocktail(plan: Plan, todayCount: number): boolean {
  const config = PLANS[plan];
  if (config.cocktailsPerDay === -1) return true;
  return todayCount < config.cocktailsPerDay;
}

export function remainingToday(plan: Plan, todayCount: number): number {
  const config = PLANS[plan];
  if (config.cocktailsPerDay === -1) return Infinity;
  return Math.max(0, config.cocktailsPerDay - todayCount);
}

export function canAddToCatalog(plan: Plan, catalogCount: number): boolean {
  const config = PLANS[plan];
  if (config.catalogMax === -1) return true;
  return catalogCount < config.catalogMax;
}

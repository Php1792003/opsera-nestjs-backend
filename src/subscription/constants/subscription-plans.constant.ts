export enum SubscriptionPlan {
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export interface PlanLimits {
  qrCodes: number;
  users: number;
  projects: number;
  storage: number; // in GB
  pricePerMonth: number; // in VND
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanLimits> = {
  [SubscriptionPlan.STARTER]: {
    qrCodes: 100,
    users: 5,
    projects: 3,
    storage: 1,
    pricePerMonth: 299000, // 299k VND
  },
  [SubscriptionPlan.PRO]: {
    qrCodes: 500,
    users: 20,
    projects: 15,
    storage: 5,
    pricePerMonth: 899000, // 899k VND
  },
  [SubscriptionPlan.ENTERPRISE]: {
    qrCodes: 2000,
    users: 9999, // Unlimited
    projects: 9999, // Unlimited
    storage: 20,
    pricePerMonth: 2499000, // 2.499M VND
  },
};

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return SUBSCRIPTION_PLANS[plan];
}

export function checkPlanLimit(
  plan: SubscriptionPlan,
  type: 'qrCodes' | 'users' | 'projects',
  current: number,
): boolean {
  const limits = getPlanLimits(plan);
  return current < limits[type];
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  ctaLabel: string;
  /** 'start' opens the sign-up flow; 'contact' is a real mailto link, never a fake checkout. */
  ctaAction: 'start' | 'contact';
  highlighted?: boolean;
}

/** Single source of truth for plan copy so pricing isn't duplicated across components. */
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/ forever',
    features: ['Local WASM WebContainer', 'Monaco Code Editor', '3D Spatial Node Graph'],
    ctaLabel: 'Start Free',
    ctaAction: 'start',
  },
  {
    id: 'pro',
    name: 'Pro Developer',
    price: '$29',
    period: '/ month',
    features: [
      'Everything in Free',
      'Unlimited Supabase RBAC Sync',
      'AI Coding Agent & GLSL Shader Studio',
      'Security Backup Snapshot Vault',
    ],
    ctaLabel: 'Get Pro Access',
    ctaAction: 'start',
    highlighted: true,
  },
  {
    id: 'team',
    name: 'Team Enterprise',
    price: '$99',
    period: '/ month',
    features: ['Custom Vercel Deploy Keys', 'Dedicated GitHub REST Bridge', '24/7 Priority Support'],
    ctaLabel: 'Contact Sales',
    ctaAction: 'contact',
  },
];

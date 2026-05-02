import { Check } from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  monthly_limit: number;
  price: number;
  description: string;
  features: string[];
}

interface PricingCardProps {
  plan: Plan;
  current?: boolean;
  onUpgrade?: (planId: number) => void;
}

export default function PricingCard({ plan, current = false, onUpgrade }: PricingCardProps) {
  return (
    <div className={`relative bg-card dark:bg-card-dark rounded-xl border-2 p-6 flex flex-col transition-shadow hover:shadow-lg ${current ? 'border-primary dark:border-teal shadow-md' : 'border-rule dark:border-rule-dark'}`}>
      {current && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary dark:bg-teal text-white dark:text-void text-xs font-heading font-bold px-3 py-0.5 rounded-full">
          Current
        </div>
      )}
      <h3 className="font-heading text-xl font-bold text-ink dark:text-cream mb-1">{plan.name}</h3>
      <p className="text-sm text-faded dark:text-ash mb-4">{plan.description}</p>
      <div className="mb-4">
        <span className="font-heading text-4xl font-bold text-ink dark:text-cream">${plan.price}</span>
        <span className="text-faded dark:text-ash text-sm">/mo</span>
      </div>
      <div className="text-sm text-faded dark:text-ash mb-4 font-mono">
        {plan.monthly_limit.toLocaleString()} calls/month
      </div>
      <ul className="flex-1 space-y-2 mb-6">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink dark:text-cream">
            <Check size={16} strokeWidth={1.5} className="text-primary dark:text-teal mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={() => onUpgrade?.(plan.id)}
        disabled={current}
        className={`w-full py-2.5 rounded-lg font-heading font-semibold text-sm transition-all ${current ? 'bg-rule dark:bg-rule-dark text-faded dark:text-ash cursor-not-allowed' : 'bg-primary dark:bg-teal text-white dark:text-void hover:opacity-90'}`}
      >
        {current ? 'Current Plan' : 'Upgrade'}
      </button>
    </div>
  );
}
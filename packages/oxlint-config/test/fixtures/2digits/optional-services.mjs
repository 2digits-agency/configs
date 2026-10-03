import * as Fx from 'effect/Effect';
import * as Opt from 'effect/Option';

// Shopify-budget-style optional dependency: only consume it when present.
Fx.gen(function* () {
  const budget = Opt.getOrUndefined(yield* Fx.serviceOption(ShopifyCostBudget));
  if (budget) {
    yield* budget.acquire(cost);
  }
});

// WorkflowScope-style absence handling is an explicit initialization contract.
Fx.gen(function* () {
  const scope = yield* Fx.serviceOption(WorkflowScope);
  if (Opt.isNone(scope)) {
    return yield* Fx.die(new Error('Workflow scope not initialized'));
  }
  return Opt.getOrThrow(scope);
});

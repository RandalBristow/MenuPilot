export type PricingModifierOption = {
  id: string;
  price_delta: number;
};

export type PricingModifierGroup = {
  id: string;
  modifier_options: PricingModifierOption[];
  included_quantity?: number;
  is_swappable?: boolean;
  charge_for_extra?: boolean;
};

export type PricingSelectedModifier = {
  optionId: string;
  multiplier: number;
  placement?: "left" | "whole" | "right";
};

type CalculateProductTotalInput = {
  basePrice: number;
  modifierGroups: PricingModifierGroup[];
  selectedModifiers: Record<string, PricingSelectedModifier>;
};

export function calculateProductTotal({
  basePrice,
  modifierGroups,
  selectedModifiers,
}: CalculateProductTotalInput) {
  const modifierTotal = modifierGroups.reduce((groupSum, group) => {
    const selectedForGroup = Object.values(selectedModifiers).filter(
      (selected) =>
        group.modifier_options.some(
          (option) => option.id === selected.optionId,
        ),
    );

    const selectedWithPrices = selectedForGroup
      .map((selected) => {
        const option = group.modifier_options.find(
          (modifierOption) => modifierOption.id === selected.optionId,
        );

        if (!option) return null;

        const totalUnits = selected.multiplier ?? 1;

        return {
          selected,
          option,
          totalUnits,
          unitPrice: Number(option.price_delta),
        };
      })
      .filter(Boolean) as {
      selected: PricingSelectedModifier;
      option: PricingModifierOption;
      totalUnits: number;
      unitPrice: number;
    }[];

    const includedQuantity = group.included_quantity ?? 0;
    const chargeForExtra = group.charge_for_extra ?? true;

    if (!chargeForExtra || includedQuantity <= 0) {
      return (
        groupSum +
        selectedWithPrices.reduce(
          (sum, item) => sum + item.unitPrice * item.totalUnits,
          0,
        )
      );
    }

    let remainingCredits = includedQuantity;

    const sortedByPrice = [...selectedWithPrices].sort(
      (a, b) => b.unitPrice - a.unitPrice,
    );

    let groupTotal = 0;

    for (const item of sortedByPrice) {
      const units = item.totalUnits;

      if (remainingCredits <= 0) {
        groupTotal += units * item.unitPrice;
        continue;
      }

      if (units <= remainingCredits) {
        // fully covered by included credits
        remainingCredits -= units;
      } else {
        // partially covered
        const paidUnits = units - remainingCredits;
        groupTotal += paidUnits * item.unitPrice;
        remainingCredits = 0;
      }
    }

    return groupSum + groupTotal;
  }, 0);

  return basePrice + modifierTotal;
}

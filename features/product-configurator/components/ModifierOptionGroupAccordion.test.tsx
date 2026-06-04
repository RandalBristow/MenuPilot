import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ModifierOptionGroupAccordion } from "./ModifierOptionGroupAccordion"

const veggies = {
  id: "veggies",
  name: "Veggies",
  description: null,
  is_enabled: true,
  sort_order: 1,
}

const proteins = {
  id: "proteins",
  name: "Proteins",
  description: "Add a protein",
  is_enabled: true,
  sort_order: 2,
}

const group = {
  id: "toppings",
  supports_placement: true,
  supports_multiplier: true,
  min_multiplier: 1,
  max_multiplier: 2,
  multiplier_step: 1,
  modifier_options: [
    {
      id: "tomato",
      name: "Tomato",
      price_delta: 0,
      is_enabled: true,
      sort_order: 1,
      modifier_option_group_id: "veggies",
      modifier_option_groups: veggies,
    },
    {
      id: "chicken",
      name: "Chicken",
      price_delta: 2,
      is_enabled: true,
      sort_order: 1,
      modifier_option_group_id: "proteins",
      modifier_option_groups: proteins,
    },
  ],
}

function renderAccordion(
  selectedModifiers: Parameters<
    typeof ModifierOptionGroupAccordion
  >[0]["selectedModifiers"] = {}
) {
  return render(
    <ModifierOptionGroupAccordion
      group={group}
      selectedModifiers={selectedModifiers}
      getDisplayPriceDelta={(option) => Number(option.price_delta)}
      onToggleOption={vi.fn()}
      onUpdateModifier={vi.fn()}
      placementLabels={[
        ["left", "Left side"],
        ["whole", "Whole pizza"],
        ["right", "Right side"],
      ]}
    />
  )
}

describe("ModifierOptionGroupAccordion", () => {
  it("opens the first option group when no options are selected", () => {
    renderAccordion()

    expect(screen.getByRole("button", { name: /tomato/i })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /chicken/i })
    ).not.toBeInTheDocument()
  })

  it("opens selected option groups by default", () => {
    renderAccordion({
      chicken: {
        optionId: "chicken",
        placement: "whole",
        multiplier: 1,
      },
    })

    expect(screen.getByRole("button", { name: /proteins/i }))
      .toHaveAttribute("aria-expanded", "true")
    expect(
      screen.getByRole("button", { name: /chicken/i, pressed: true })
    ).toBeInTheDocument()
  })

  it("shows the selected count in the option group header", () => {
    renderAccordion({
      chicken: {
        optionId: "chicken",
        placement: "whole",
        multiplier: 1,
      },
    })

    expect(screen.getByText("1 selected")).toBeInTheDocument()
  })

  it("preserves selected state after a selected group is collapsed and reopened", () => {
    renderAccordion({
      chicken: {
        optionId: "chicken",
        placement: "whole",
        multiplier: 1,
      },
    })

    fireEvent.click(screen.getByRole("button", { name: /proteins/i }))
    expect(
      screen.queryByRole("button", { name: /chicken/i })
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /proteins/i }))
    expect(
      screen.getByRole("button", { name: /chicken/i, pressed: true })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: /set chicken placement to whole pizza/i,
      })
    ).toBeInTheDocument()
  })
})

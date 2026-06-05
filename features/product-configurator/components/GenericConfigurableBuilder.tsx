"use client"

import {
  StandardItemBuilder,
  type StandardItemBuilderProps,
} from "@/features/product-configurator/components/StandardItemBuilder"

export function GenericConfigurableBuilder(props: StandardItemBuilderProps) {
  return <StandardItemBuilder {...props} />
}

"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { ThemedButton } from "@/components/themed/ThemedButton"
import { ThemedCard } from "@/components/themed/ThemedCard"
import { ThemedSwitch } from "@/components/themed/ThemedSwitch"
import { useThemedToast } from "@/components/themed/ThemedToastProvider"
import { savePlatformBusinessPage, type SavePlatformBusinessPageState } from "@/features/platform-admin/actions/save-platform-business-page"
import type { PlatformBusinessDetail, PlatformBusinessLocation } from "@/features/platform-admin/types/platform-admin"
import type { BusinessPricingSettings } from "@/lib/pricing/business-pricing-settings"

const initialState: SavePlatformBusinessPageState = { ok: false, message: "" }
function StatusToggle({ name, initialStatus, subject }: { name: string; initialStatus: string; subject: string }) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus)
  const active = currentStatus === "active"

  return (
    <div className="float-right ml-4 space-y-1">
      <input type="hidden" name={name} value={currentStatus} />
      <ThemedSwitch
        label={active ? "Active" : "Paused"}
        aria-label={`${subject} status: ${active ? "Active" : "Paused"}`}
        checked={active}
        onCheckedChange={(checked) =>
          setCurrentStatus(checked ? "active" : "paused")
        }
      />
    </div>
  )
}

function Input({ label, name, value, type = "text" }: { label: string; name: string; value?: string | null; type?: string }) {
  return <label className="grid gap-2"><span className="text-sm font-medium">{label}</span><input name={name} type={type} defaultValue={value ?? ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm" /></label>
}

function Checkbox({ label, name, checked, description }: { label: string; name: string; checked: boolean; description?: string }) {
  return <label className="flex items-start gap-3 rounded-md border bg-card p-3 text-sm"><input type="checkbox" name={name} value="true" defaultChecked={checked} className="mt-1 size-4 rounded border" /><span><span className="block font-medium">{label}</span>{description ? <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span> : null}</span></label>
}

function LocationFields({ businessId, location }: { businessId: string; location: PlatformBusinessLocation }) {
  const suffix = `_${location.id}`
  return <ThemedCard className="p-4"><input type="hidden" name="locationIds" value={location.id} /><input type="hidden" name={`oldLocationSlug${suffix}`} value={location.slug} /><div className="space-y-4"><StatusToggle name={`locationStatus${suffix}`} initialStatus={location.status} subject="Location" /><div><h3 className="text-base font-semibold">{location.name}</h3><p className="mt-1 text-sm text-muted-foreground">Location details and ordering controls.</p></div><div className="grid gap-4 sm:grid-cols-2"><Input label="Location name" name={`locationName${suffix}`} value={location.name} /><Input label="Location slug" name={`locationSlug${suffix}`} value={location.slug} /><Input label="Address line 1" name={`addressLine1${suffix}`} value={location.addressLine1} /><Input label="Address line 2" name={`addressLine2${suffix}`} value={location.addressLine2} /><Input label="City" name={`city${suffix}`} value={location.city} /><Input label="State" name={`state${suffix}`} value={location.state} /><Input label="Postal code" name={`postalCode${suffix}`} value={location.postalCode} /><Input label="Phone" name={`locationPhone${suffix}`} value={location.phone} type="tel" /><Input label="Email" name={`locationEmail${suffix}`} value={location.email} type="email" /><Input label="Timezone" name={`timezone${suffix}`} value={location.timezone} /></div><div className="grid gap-2 sm:grid-cols-2"><Checkbox label="Accepting orders" name={`acceptingOrders${suffix}`} checked={location.acceptingOrders} /><Checkbox label="Pickup enabled" name={`pickupEnabled${suffix}`} checked={location.pickupEnabled} /><Checkbox label="Delivery enabled" name={`deliveryEnabled${suffix}`} checked={location.deliveryEnabled} /></div><p className="text-xs leading-5 text-muted-foreground">Accepting orders is saved as off unless this location is active and has pickup or delivery enabled.</p><input type="hidden" name={`businessId${suffix}`} value={businessId} /></div></ThemedCard>
}

export function PlatformBusinessPageForm({ business, pricingSettings }: { business: PlatformBusinessDetail; pricingSettings: BusinessPricingSettings }) {
  const router = useRouter()
  const { showToast } = useThemedToast()
  const [state, action, pending] = useActionState(savePlatformBusinessPage, initialState)
  const [serviceFeeType, setServiceFeeType] = useState(pricingSettings.serviceFeeType)

  useEffect(() => {
    if (state.ok) {
      showToast({ title: state.message, kind: "success" })
      router.refresh()
    }
  }, [router, showToast, state])

  return <form action={action} className="space-y-3"><input type="hidden" name="businessId" value={business.id} /><input type="hidden" name="oldBusinessSlug" value={business.slug} />
    {state.message && !state.ok ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p> : null}
    <ThemedCard className="p-4"><div className="space-y-4"><StatusToggle name="businessStatus" initialStatus={business.status} subject="Business" /><div><h2 className="text-base font-semibold">Business Details</h2><p className="mt-1 text-sm text-muted-foreground">Identity, contact information, and platform status.</p></div><div className="grid gap-4 sm:grid-cols-2"><Input label="Business name" name="businessName" value={business.name} /><Input label="Business slug" name="businessSlug" value={business.slug} /><Input label="Legal name" name="legalName" value={business.legalName} /><Input label="Primary contact name" name="primaryContactName" value={business.primaryContactName} /><Input label="Primary contact email" name="primaryContactEmail" value={business.primaryContactEmail} type="email" /><Input label="Primary phone" name="primaryPhone" value={business.primaryPhone} type="tel" /></div><label className="grid gap-2"><span className="text-sm font-medium">Description</span><textarea name="description" defaultValue={business.description ?? ""} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm" /></label></div></ThemedCard>
    <section className="space-y-2"><h2 className="text-base font-semibold">Locations</h2>{business.locations.length ? business.locations.map((location) => <LocationFields key={location.id} businessId={business.id} location={location} />) : <ThemedCard className="p-4"><p className="text-sm text-muted-foreground">No locations have been created for this business yet.</p></ThemedCard>}</section>
    <ThemedCard className="p-4"><div className="space-y-3"><div><h2 className="text-base font-semibold">Pricing Settings</h2><p className="mt-1 text-sm text-muted-foreground">Business-level pizza, tax, service fee, and tip rules.</p></div><input type="hidden" name="pizzaHalfToppingRoundingMode" value="floor_to_cent" /><Checkbox name="pizzaHalfToppingPricingEnabled" label="Half toppings use half price" description="Left- or right-side pizza toppings charge half the effective modifier price." checked={pricingSettings.pizzaHalfToppingPricingEnabled} /><Checkbox name="pizzaHalfToppingIncludedWeightEnabled" label="Half toppings consume half an included slot" description="Left- or right-side toppings count as 0.5 selections toward included limits." checked={pricingSettings.pizzaHalfToppingIncludedWeightEnabled} /><div className="grid gap-3 border-t pt-3 sm:grid-cols-2"><Input label="Sales tax rate %" name="salesTaxRatePercent" value={String(pricingSettings.salesTaxRatePercent)} type="number" /><label className="grid gap-2"><span className="text-sm font-medium">Service fee type</span><select name="serviceFeeType" value={serviceFeeType} onChange={(event) => setServiceFeeType(event.target.value as typeof serviceFeeType)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="none">No service fee</option><option value="fixed">Fixed amount</option><option value="percentage">Percentage</option></select></label>{serviceFeeType !== "none" ? <Input label={serviceFeeType === "percentage" ? "Service fee %" : "Service fee amount"} name="serviceFeeValue" value={String(pricingSettings.serviceFeeValue)} type="number" /> : <input type="hidden" name="serviceFeeValue" value="0" />}</div><Checkbox name="tipsEnabled" label="Enable checkout tips" description="Checkout offers the configured tip options." checked={pricingSettings.tipsEnabled} /></div></ThemedCard>
    <div className="flex justify-end border-t pt-3"><ThemedButton type="submit" disabled={pending} className="gap-1.5"><Check aria-hidden="true" className="size-4" />{pending ? "Saving all changes..." : "Save Changes"}</ThemedButton></div>
  </form>
}

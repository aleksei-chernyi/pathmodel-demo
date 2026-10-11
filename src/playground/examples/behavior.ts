import { FormBase, FormOptions, Nested, Schema } from "@aleksei-chernyi/pathmodel"
import Wrapper from "@aleksei-chernyi/pathmodel/src/layout/Wrapper.vue"
import { TextInput } from "@aleksei-chernyi/pathmodel/fields"

// Behavior shared by both addresses. Dot paths are absolute, so each subclass declares its fields.
abstract class AddressForm extends FormBase {
  city!: string | null
  street!: string | null

  get label() {
    return [this.street, this.city].filter(Boolean).join(", ")
  }

  sameAs(other: AddressForm) {
    return this.city === other.city && this.street === other.street
  }

  copyFrom(other: AddressForm) {
    this.city = other.city
    this.street = other.street
  }

  clear() {
    this.city = null
    this.street = null
  }
}

@FormOptions({ title: "Shipping" })
class ShippingForm extends AddressForm {
  @Schema({
    component: TextInput,
    dotPath: "shipping.city",
    props: { label: "City" },
    options: { required: true },
  })
  city!: string | null

  @Schema({
    component: TextInput,
    dotPath: "shipping.street",
    props: { label: "Street" },
    options: { required: true },
  })
  street!: string | null
}

@FormOptions({ title: "Billing" })
class BillingForm extends AddressForm {
  @Schema({ component: TextInput, dotPath: "billing.city", props: { label: "City" } })
  city!: string | null

  @Schema({ component: TextInput, dotPath: "billing.street", props: { label: "Street" } })
  street!: string | null
}

class CheckoutForm extends FormBase {
  @Schema({ component: Wrapper, options: { title: "Shipping" } })
  @Nested({ type: ShippingForm })
  shipping!: ShippingForm

  @Schema({ component: Wrapper, options: { title: "Billing" } })
  @Nested({ type: BillingForm })
  billing!: BillingForm

  get billingMatchesShipping() {
    return this.billing.sameAs(this.shipping)
  }

  useShippingForBilling() {
    this.billing.copyFrom(this.shipping)
  }
}

// Playground only: `actions` become buttons above the form, and `display` values are shown
// live. Both are called with the reactive root form, as a template would.
export const actions = {
  "Same as shipping": (form: CheckoutForm) => form.useShippingForBilling(),
  "Clear billing": (form: CheckoutForm) => form.billing.clear(),
}

export const display = {
  "Ships to": (form: CheckoutForm) => form.shipping.label,
  "Billing matches shipping": (form: CheckoutForm) => form.billingMatchesShipping,
}

export default CheckoutForm

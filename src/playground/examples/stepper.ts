import { FormCase, FormSwitch, FormOptions, Schema, NestedArray } from "@aleksei-chernyi/pathmodel"
import Stepper from "@aleksei-chernyi/pathmodel/src/layout/Stepper.vue"
import { TextInput, Select } from "@aleksei-chernyi/pathmodel/fields"
import { z } from "zod"

@FormOptions({ title: "Contacts", namespace: "contacts" })
class ContactsStep extends FormCase {
  protected _case = "contacts"

  @Schema({
    component: TextInput,
    dotPath: "contacts.email",
    props: { label: "Email" },
    options: { required: true, rules: z.email("Invalid email") },
  })
  email!: string | null
}

@FormOptions({ title: "Delivery", namespace: "delivery" })
class DeliveryStep extends FormCase {
  protected _case = "delivery"

  @Schema({
    component: Select,
    dotPath: "delivery.method",
    props: { label: "Method", options: ["courier", "pickup"] },
    options: { required: true },
  })
  method!: string | null
}

@FormOptions({ title: "Payment", namespace: "payment" })
class PaymentStep extends FormCase {
  protected _case = "payment"

  @Schema({
    component: TextInput,
    dotPath: "payment.card",
    props: { label: "Card number" },
    options: { required: true, rules: z.string().regex(/^\d{16}$/, "16 digits") },
  })
  card!: string | null
}

class Checkout extends FormSwitch {
  @Schema({ component: Stepper })
  @NestedArray({ items: [ContactsStep, DeliveryStep, PaymentStep] })
  cases!: FormCase[]
}

const form = new Checkout({ title: "Checkout" })
form.setActiveCaseIndex(0)
// Steps after the reached index are locked; unlock all so clicking forward validates the step.
form.unlockCaseIndex(2)

export default form

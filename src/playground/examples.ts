export interface Example {
  id: string
  name: string
  code: string
}

const basic = `import { FormBase, Schema, Row } from "@aleksei-chernyi/pathmodel"
import { TextInput, NumberInput, Select, Checkbox } from "@aleksei-chernyi/pathmodel/fields"
import { z } from "zod"

class ProfileForm extends FormBase {
  @Schema({
    component: TextInput,
    dotPath: "name",
    props: { label: "Name", placeholder: "Ada Lovelace" },
    options: { required: true, rules: z.string().min(2, "At least 2 characters") },
  })
  name!: string | null

  @Schema({
    component: TextInput,
    dotPath: "email",
    props: { label: "Email", type: "email" },
    options: { required: true, rules: z.email("Invalid email") },
  })
  email!: string | null

  @Schema({
    component: NumberInput,
    dotPath: "age",
    props: { label: "Age (optional)" },
    options: { rules: z.number().int().min(18, "Must be 18 or older") },
  })
  age!: number | null

  @Schema({
    component: Select,
    dotPath: "role",
    props: { label: "Role", options: ["admin", "editor", "viewer"] },
    options: { default: "viewer" },
  })
  role!: string

  @Schema({
    component: Checkbox,
    dotPath: "terms",
    props: { label: "I accept the terms" },
    // false is not "empty", so the rule runs (null would skip it)
    options: { default: false, rules: z.literal(true, "You must accept the terms") },
  })
  terms!: boolean
}

export default ProfileForm
`

const nested = `import { FormBase, FormOptions, Schema, Nested, Wrapper, Row } from "@aleksei-chernyi/pathmodel"
import { TextInput } from "@aleksei-chernyi/pathmodel/fields"
import { z } from "zod"

@FormOptions({ title: "Address" })
class AddressForm extends FormBase {
  @Schema({ component: TextInput, dotPath: "address.city", props: { label: "City" },
    options: { required: true } })
  city!: string | null

  @Schema({ component: TextInput, dotPath: "address.zip", props: { label: "ZIP" },
    options: { rules: z.string().regex(/^\\d{5}$/, "5 digits") } })
  zip!: string | null
}

@FormOptions({ title: "Account" })
class AccountForm extends FormBase {
  @Schema({ component: TextInput, dotPath: "account.password",
    props: { label: "Password", type: "password" },
    options: { required: true, rules: z.string().min(8, "At least 8 characters") } })
  password!: string | null

  @Schema({ component: TextInput, dotPath: "account.confirm",
    props: { label: "Confirm password", type: "password" }, options: { required: true } })
  confirm!: string | null
}

class SignupForm extends FormBase {
  @Schema({ component: Wrapper, options: { title: "Address" } })
  @Nested({ type: AddressForm })
  address!: AddressForm

  @Schema({ component: Wrapper, options: { title: "Account" } })
  @Nested({ type: AccountForm })
  account!: AccountForm
}

const form = new SignupForm({ title: "Signup" })

// A schema for the whole value: checks that involve several fields.
form.setValueSchema(
  z
    .object({
      account: z.object({ password: z.string().nullable(), confirm: z.string().nullable() }),
    })
    .refine((v) => v.account.password === v.account.confirm, {
      message: "Passwords do not match",
      path: ["account", "confirm"],
    })
)

export default form
`

const stepper = `import { FormCase, FormSwitch, FormOptions, Schema, NestedArray, Stepper } from "@aleksei-chernyi/pathmodel"
import { TextInput, Select } from "@aleksei-chernyi/pathmodel/fields"
import { z } from "zod"

@FormOptions({ title: "Contacts", namespace: "contacts" })
class ContactsStep extends FormCase {
  protected _case = "contacts"

  @Schema({ component: TextInput, dotPath: "contacts.email", props: { label: "Email" },
    options: { required: true, rules: z.email("Invalid email") } })
  email!: string | null
}

@FormOptions({ title: "Delivery", namespace: "delivery" })
class DeliveryStep extends FormCase {
  protected _case = "delivery"

  @Schema({ component: Select, dotPath: "delivery.method",
    props: { label: "Method", options: ["courier", "pickup"] }, options: { required: true } })
  method!: string | null
}

@FormOptions({ title: "Payment", namespace: "payment" })
class PaymentStep extends FormCase {
  protected _case = "payment"

  @Schema({ component: TextInput, dotPath: "payment.card", props: { label: "Card number" },
    options: { required: true, rules: z.string().regex(/^\\d{16}$/, "16 digits") } })
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
`

const tabs = `import { FormCase, FormSwitch, FormOptions, Schema, NestedArray, Switch } from "@aleksei-chernyi/pathmodel"
import { TextInput } from "@aleksei-chernyi/pathmodel/fields"
import { z } from "zod"

// keepInValue: false — an inactive case is left out of getFormValue().
@FormOptions({ title: "Person", keepInValue: false })
class PersonCase extends FormCase {
  protected _case = "person"

  @Schema({ component: TextInput, dotPath: "customer.fullName", props: { label: "Full name" },
    options: { required: true } })
  fullName!: string | null
}

@FormOptions({ title: "Company", keepInValue: false })
class CompanyCase extends FormCase {
  protected _case = "company"

  @Schema({ component: TextInput, dotPath: "customer.company", props: { label: "Company" },
    options: { required: true } })
  company!: string | null

  @Schema({ component: TextInput, dotPath: "customer.vat", props: { label: "VAT number" },
    options: { rules: z.string().regex(/^[A-Z]{2}\\d{8,12}$/, "e.g. DE123456789") } })
  vat!: string | null
}

class Customer extends FormSwitch {
  @Schema({ component: Switch })
  @NestedArray({ items: [PersonCase, CompanyCase] })
  cases!: FormCase[]
}

const form = new Customer({ title: "Customer" })
form.toggleActiveCase("person")

export default form
`

export const examples: Example[] = [
  { id: "basic", name: "Basic fields", code: basic },
  { id: "nested", name: "Nested + value schema", code: nested },
  { id: "tabs", name: "Switch (tabs)", code: tabs },
  { id: "stepper", name: "Stepper", code: stepper },
]

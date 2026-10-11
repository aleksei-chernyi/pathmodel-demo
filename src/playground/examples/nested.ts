import { FormBase, FormOptions, Schema, Nested } from "@aleksei-chernyi/pathmodel"
import Wrapper from "@aleksei-chernyi/pathmodel/src/layout/Wrapper.vue"
import { TextInput } from "@aleksei-chernyi/pathmodel/fields"
import { z } from "zod"

@FormOptions({ title: "Address" })
class AddressForm extends FormBase {
  @Schema({
    component: TextInput,
    dotPath: "address.city",
    props: { label: "City" },
    options: { required: true },
  })
  city!: string | null

  @Schema({
    component: TextInput,
    dotPath: "address.zip",
    props: { label: "ZIP" },
    options: { rules: z.string().regex(/^\d{5}$/, "5 digits") },
  })
  zip!: string | null
}

@FormOptions({ title: "Account" })
class AccountForm extends FormBase {
  @Schema({
    component: TextInput,
    dotPath: "account.password",
    props: { label: "Password", type: "password" },
    options: { required: true, rules: z.string().min(8, "At least 8 characters") },
  })
  password!: string | null

  @Schema({
    component: TextInput,
    dotPath: "account.confirm",
    props: { label: "Confirm password", type: "password" },
    options: { required: true },
  })
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

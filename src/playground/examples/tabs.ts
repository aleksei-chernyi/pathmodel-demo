import { FormCase, FormSwitch, FormOptions, Schema, NestedArray } from "@aleksei-chernyi/pathmodel"
import Switch from "@aleksei-chernyi/pathmodel/src/layout/Switch.vue"
import { TextInput } from "@aleksei-chernyi/pathmodel/fields"
import { z } from "zod"

// keepInValue: false — an inactive case is left out of getFormValue().
@FormOptions({ title: "Person", keepInValue: false })
class PersonCase extends FormCase {
  protected _case = "person"

  @Schema({
    component: TextInput,
    dotPath: "customer.fullName",
    props: { label: "Full name" },
    options: { required: true },
  })
  fullName!: string | null
}

@FormOptions({ title: "Company", keepInValue: false })
class CompanyCase extends FormCase {
  protected _case = "company"

  @Schema({
    component: TextInput,
    dotPath: "customer.company",
    props: { label: "Company" },
    options: { required: true },
  })
  company!: string | null

  @Schema({
    component: TextInput,
    dotPath: "customer.vat",
    props: { label: "VAT number" },
    options: { rules: z.string().regex(/^[A-Z]{2}\d{8,12}$/, "e.g. DE123456789") },
  })
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

import { FormBase, Schema } from "@aleksei-chernyi/pathmodel"
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

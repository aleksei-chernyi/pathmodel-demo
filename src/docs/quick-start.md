## Overview

pathmodel describes the shape of your data as a **tree of TypeScript classes**. Each field is
decorated with `@Schema` and bound to a **dot path** (`"address.city"`) in the resulting value.

- The classes can hold behavior too: getters and methods that work on their own part of the
  tree, re-rendered reactively (see **Models with behavior**).
- Fields that share a dot path stay in sync, even across nested forms.
- Validation errors are stored by dot path, so server errors map back onto fields.
- `buildSchema()` turns the classes into a tree of layout and field nodes, and the bundled
  **Vue 3** components render that tree as a form.
- Validation rules come from any [Standard Schema](https://standardschema.dev) library: Zod,
  Valibot, ArkType, and others.

## Installation

```bash
npm install @aleksei-chernyi/pathmodel reflect-metadata
npm install zod   # or any other Standard Schema library, for validation rules
```

`vue` (^3.3) is a peer dependency, so your app provides it. Import `reflect-metadata` once at
startup:

```ts
// main.ts
import "reflect-metadata"
```

## Configuration

Enable legacy decorators and decorator metadata in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "useDefineForClassFields": false
  }
}
```

Class fields **must** use TypeScript's legacy semantics (`useDefineForClassFields: false`).
Otherwise a declaration with no initializer, such as `address!: AddressForm`, resets the nested
form that `FormBase` created to `undefined`.

Vite 8 compiles TypeScript with Oxc, which needs one more setting:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
  oxc: {
    assumptions: { setPublicClassFields: true },
    typescript: { removeClassFieldsWithoutInitializer: true },
  },
})
```

The `.vue` components ship as source, so your bundler must compile SFCs with
`<script setup lang="ts">` and `<style lang="scss">` (Vite with `@vitejs/plugin-vue` and `sass`).

## Your first form

### 1. Write a field component

pathmodel has no inputs of its own: you bring your UI kit. A field component receives the
`node` prop and reads and writes its value through it.

```vue
<!-- TextInput.vue -->
<script setup lang="ts">
import { FieldNode } from "@aleksei-chernyi/pathmodel"

const props = defineProps<{ node: FieldNode; hasError?: boolean }>()
const fieldProps = props.node.getProps() as { label?: string }
</script>

<template>
  <label>
    {{ fieldProps.label }}
    <input
      :class="{ invalid: hasError }"
      :value="node.getValue() ?? ''"
      @input="node.setValue(($event.target as HTMLInputElement).value)"
    />
  </label>
</template>
```

### 2. Describe the model

```ts
import { FormBase, FormOptions, Nested, Schema } from "@aleksei-chernyi/pathmodel"
import Row from "@aleksei-chernyi/pathmodel/src/layout/Row.vue"
import TextInput from "./TextInput.vue"
import { z } from "zod"

@FormOptions({ title: "Address" })
class AddressForm extends FormBase {
  @Schema({ component: TextInput, dotPath: "address.city", props: { label: "City" } })
  city!: string | null
}

export class UserForm extends FormBase {
  @Schema({
    component: TextInput,
    dotPath: "email",
    props: { label: "Email" },
    options: { required: true, rules: z.email("Invalid email") },
  })
  email!: string | null

  @Schema({ component: Row })
  @Nested({ type: AddressForm })
  address!: AddressForm
}
```

### 3. Render it

```vue
<script setup lang="ts">
import { reactive } from "vue"
import SchemaRenderer from "@aleksei-chernyi/pathmodel/src/template/SchemaRenderer.vue"
import { UserForm } from "./UserForm"

// `reactive()` returns an unwrapped type; the cast keeps the class type for `:root`.
const form = reactive(new UserForm({ title: "User" })) as UserForm
const nodes = form.buildSchema()

async function submit() {
  if (await form.validate()) {
    console.log(form.getFormValue()) // { email: "...", address: { city: "..." } }
  }
}
</script>

<template>
  <SchemaRenderer :nodes="nodes" :root="form" />
  <button @click="submit">Save</button>
</template>
```

### 4. Read and write values

```ts
form.setFormValue({ email: "ada@example.com", address: { city: "London" } })
form.getFormValue() // { email: "ada@example.com", address: { city: "London" } }
```

Call `buildSchema()` before you read or write values: it fills the dot path map.

[Try the basic example in the playground →](#/playground?example=basic)

## Models with behavior

A form class is an ordinary TypeScript class, so it can hold **behavior next to its data**:
getters that derive values, and methods that change the class's own fields or call into its
nested forms. Wrap the root in `reactive()` once, and every change made anywhere in the tree
re-renders the form.

Take a checkout with a shipping and a billing address, a "same as shipping" button, and a
one-line label of the shipping address.

### With a Pinia store

The state is a plain object, and all behavior for the whole tree lives on the store:

```ts
// stores/checkout.ts
import { defineStore } from "pinia"

export const useCheckoutStore = defineStore("checkout", {
  state: () => ({
    shipping: { city: null as string | null, street: null as string | null },
    billing: { city: null as string | null, street: null as string | null },
    errors: {} as Record<string, string[]>,
  }),
  getters: {
    shippingLabel: (state) =>
      [state.shipping.street, state.shipping.city].filter(Boolean).join(", "),
  },
  actions: {
    useShippingForBilling() {
      this.billing = { ...this.shipping }
    },
    validate() {
      // check each field yourself and fill `this.errors`
    },
  },
})
```

Each field is written out in the template, with its own binding and error markup:

```vue
<template>
  <fieldset>
    <legend>Shipping</legend>
    <label>City <input v-model="store.shipping.city" /></label>
    <span v-if="store.errors['shipping.city']">{{ store.errors["shipping.city"][0] }}</span>
    <label>Street <input v-model="store.shipping.street" /></label>
    <!-- ...and the same again for billing -->
  </fieldset>
  <button @click="store.useShippingForBilling()">Same as shipping</button>
  <p>Ships to: {{ store.shippingLabel }}</p>
</template>
```

### With pathmodel

Each part of the tree is a class that owns its fields, rules and behavior. The parent composes
its children and calls their methods:

```ts
import { FormBase, FormOptions, Nested, Schema } from "@aleksei-chernyi/pathmodel"
import Wrapper from "@aleksei-chernyi/pathmodel/src/layout/Wrapper.vue"
import TextInput from "./TextInput.vue"

// Behavior shared by both addresses. Dot paths are absolute, so each subclass declares its fields.
abstract class AddressForm extends FormBase {
  city!: string | null
  street!: string | null

  get label() {
    return [this.street, this.city].filter(Boolean).join(", ")
  }

  copyFrom(other: AddressForm) {
    this.city = other.city
    this.street = other.street
  }
}

@FormOptions({ title: "Shipping" })
class ShippingForm extends AddressForm {
  @Schema({ component: TextInput, dotPath: "shipping.city", props: { label: "City" } })
  city!: string | null

  @Schema({ component: TextInput, dotPath: "shipping.street", props: { label: "Street" } })
  street!: string | null
}

@FormOptions({ title: "Billing" })
class BillingForm extends AddressForm {
  @Schema({ component: TextInput, dotPath: "billing.city", props: { label: "City" } })
  city!: string | null

  @Schema({ component: TextInput, dotPath: "billing.street", props: { label: "Street" } })
  street!: string | null
}

export class CheckoutForm extends FormBase {
  @Schema({ component: Wrapper, options: { title: "Shipping" } })
  @Nested({ type: ShippingForm })
  shipping!: ShippingForm

  @Schema({ component: Wrapper, options: { title: "Billing" } })
  @Nested({ type: BillingForm })
  billing!: BillingForm

  useShippingForBilling() {
    this.billing.copyFrom(this.shipping)
  }
}
```

The template renders the whole tree and calls the model directly:

```vue
<script setup lang="ts">
import { reactive } from "vue"
import SchemaRenderer from "@aleksei-chernyi/pathmodel/src/template/SchemaRenderer.vue"
import { CheckoutForm } from "./CheckoutForm"

const form = reactive(new CheckoutForm({ title: "Checkout" })) as CheckoutForm
const nodes = form.buildSchema()
</script>

<template>
  <SchemaRenderer :nodes="nodes" :root="form" />
  <button @click="form.useShippingForBilling()">Same as shipping</button>
  <p>Ships to: {{ form.shipping.label }}</p>
</template>
```

[Try it in the playground →](#/playground?example=behavior)

### Comparison

|            | Pinia store                                                | pathmodel                                                          |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| Data       | A plain object in `state`                                  | A tree of class instances; `getFormValue()` gives the plain object |
| Behavior   | Getters and actions on the store, for the whole tree       | Getters and methods on the class that owns the data                |
| Reuse      | Repeat the state shape and actions, or extract composables | Classes and base classes carry fields, rules and behavior together |
| Rendering  | A binding and error markup per field in the template       | `buildSchema()` + `SchemaRenderer`                                 |
| Validation | Your own code                                              | Field rules and a value schema; errors stored by dot path          |
| Reactivity | The store is reactive                                      | `reactive(new Form())` makes the whole tree reactive               |
| Scope      | App-wide shared state, with devtools, SSR and plugins      | One form or model                                                  |

They don't exclude each other: a Pinia store is still the place for app-wide state, such as
the value a form submitted.

### Things to keep in mind

- Call methods on the reactive form, not on the object you passed to `reactive()`. A change
  made through the raw object updates the value but doesn't re-render.
- A plain assignment like `this.city = "London"` changes one field. To also clear that dot
  path's error and update other fields that share the dot path, use
  `await this.root.setValueByDotPath("shipping.city", "London")`.
- Dot paths are absolute, so a class belongs to one place in the value. Share behavior
  between places through a base class, as `AddressForm` does above.

## Decorators

| Decorator                 | Target   | Purpose                                                                                                              |
| ------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `@Schema(options)`        | property | A field `{ component, dotPath, props?, options? }`, or a layout container `{ component, label?, props?, options? }`. |
| `@Nested({ type })`       | property | The property is a nested form of class `type`. It is created automatically.                                          |
| `@NestedArray({ items })` | property | An array of nested forms, one instance per class in `items`, in order.                                               |
| `@FormOptions(options)`   | class    | The options passed to this class when it is created as a nested form.                                                |

A nested property needs both decorators: `@Schema` with a **layout** component decides how it
renders, and `@Nested` / `@NestedArray` decides what it contains.

### Field options

| Option            | Type            | Description                             |
| ----------------- | --------------- | --------------------------------------- |
| `default`         | `unknown`       | The initial value. Otherwise `null`.    |
| `required`        | `boolean`       | An empty value is an error.             |
| `requiredMessage` | `string`        | Error text for an empty required field. |
| `rules`           | Standard Schema | Checks the value when it is not empty.  |

### Field props

`props` are passed to your component through `node.getProps()`. A **function** value is called
with the owning form instance, which makes props dynamic:

```ts
@Schema({
  component: Select,
  dotPath: "city",
  props: { options: (form: AddressForm) => citiesOf(form.country) },
})
```

Two prop keys have special meaning for the renderer:

- `validationErrorPaths: string[]`: sub-paths under the field's `dotPath` whose errors also
  belong to this field. Useful for composite fields such as an address picker.
- `inlineError: true`: the field renders its own error, so the renderer skips its default
  `.field-error` block.

### Form options

`FormOptionsInterface`, set with `@FormOptions` or passed to the root constructor:

| Option         | Description                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `title`        | Shown as the tab or step label of array items.                                                                                   |
| `namespace?`   | Dot path prefix used to count a step's validation errors.                                                                        |
| `keepInValue?` | Defaults to `true`. If `false`, the form's fields are left out of `getFormValue()`; for a `FormCase`, unless the case is active. |

## Components

Every node has a Vue `component`, which is either a **field** or a **layout**.

**Field components** receive these props:

| Prop                   | Description                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| `node`                 | The `FieldNode`: `getValue()`, `setValue(v)`, `getProps()`, `isRequired()` |
| `root`                 | The root form                                                              |
| `error` / `fieldError` | The current error text                                                     |
| `hasError`             | `true` when the field has an error                                         |

**Layout components** declare their kind and render children through the default slot:

```vue
<script setup lang="ts">
import { COMPONENT_KIND } from "@aleksei-chernyi/pathmodel"

defineOptions({ __kind: COMPONENT_KIND.LAYOUT })
</script>

<template>
  <fieldset class="my-group"><slot /></fieldset>
</template>
```

### Bundled layouts

| Layout        | Renders                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------- |
| `Row` / `Col` | A `div.form__row` / `div.form__col`                                                       |
| `Wrapper`     | A `div` with `options.className` (default `form-wrapper`) and an optional `options.title` |
| `Switch`      | Tabs, one per case of a `FormSwitch`                                                      |
| `Stepper`     | Numbered steps that validate before moving forward                                        |
| `Empty`       | Nothing. A field that uses it is skipped.                                                 |

All of them are imported by path, for example
`@aleksei-chernyi/pathmodel/src/layout/Wrapper.vue`.

## Dot paths

Each field's `dotPath` is its key in the form value. Several fields, even in different nested
forms, can share one dot path. They stay in sync: `setValueByDotPath` writes every instance
mapped to that path.

```ts
class A extends FormBase {
  @Schema({ component: TextInput, dotPath: "user.name" }) name!: string
}
class B extends FormBase {
  @Schema({ component: TextInput, dotPath: "user.name" }) displayName!: string
}
// Typing into either field updates both.
```

## Switch and stepper

Extend `FormSwitch` for the container and `FormCase` for each case. Put the cases on a
`@NestedArray` property named `cases`, and render it with `Switch` (tabs) or `Stepper`
(numbered steps).

```ts
import { FormCase, FormOptions, FormSwitch, NestedArray, Schema } from "@aleksei-chernyi/pathmodel"
import Stepper from "@aleksei-chernyi/pathmodel/src/layout/Stepper.vue"

@FormOptions({ title: "Contacts", namespace: "contacts" })
class ContactsStep extends FormCase {
  protected _case = "contacts"
  // ...fields under "contacts.*"
}

class Checkout extends FormSwitch {
  @Schema({ component: Stepper, options: { showHeader: true } })
  @NestedArray({ items: [ContactsStep, DeliveryStep, PaymentStep] })
  cases!: FormCase[]
}
```

| Method                    | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `toggleActiveCase(value)` | Activates the case whose `_case` equals `value`. |
| `setActiveCaseIndex(i)`   | Activates a case by position.                    |
| `unlockCaseIndex(i)`      | Lets the stepper reach steps up to `i`.          |
| `resetCaseProgress()`     | Locks all steps after the first again.           |

The stepper moves forward only when `validate()` passes for the current step. Each step shows
a badge with its error count, matched by field dot paths, `validationErrorPaths` and the case
`namespace`. Both layouts accept `showHeader` (default `true`) and `hideWhenNoActive`.

`Stepper` is styled with host CSS variables: `--var-main-color`, `--var-button-bg-100`,
`--var-button-bg-400`, `--var-button-active-bg`, `--var-text-color-disabled`, `--var-danger`
and `--var-border-radius-big`.

[Try the tabs example →](#/playground?example=tabs) · [Try the stepper example →](#/playground?example=stepper)

## Validation

pathmodel has no rules of its own. Install any
[Standard Schema](https://standardschema.dev) library: [Zod](https://zod.dev),
[Valibot](https://valibot.dev), [ArkType](https://arktype.io), and others.

### Field rules

For each field:

1. An empty value (`null`, `undefined`, a blank string, `[]`) is an error if the field is
   `required`, and valid otherwise.
2. A non-empty value is checked against `rules`. Rules never see empty values, so optional
   fields don't need `.nullable()` or `.optional()`.

```ts
@Schema({
  component: AddressInput,
  dotPath: "contacts.address",
  props: { validationErrorPaths: ["city", "street"] },
  // Issue paths are appended to the field's dot path: "contacts.address.city"
  options: { rules: z.object({ city: z.string().min(1), street: z.string().min(1) }) },
})
address!: { city: string; street: string } | null
```

### Value schema

For rules that involve several fields, set a schema for the whole value. It is checked against
`getFormValue()`, and each issue path becomes the error's dot path:

```ts
form.setValueSchema(
  z
    .object({ account: z.object({ password: z.string(), confirm: z.string() }) })
    .refine((v) => v.account.password === v.account.confirm, {
      message: "Passwords do not match",
      path: ["account", "confirm"],
    })
)
```

[Try the value schema example →](#/playground?example=nested)

### Running validation

```ts
const ok = await form.validate() // whole form; replaces all errors
const stepOk = await form.validate(step.children) // only these nodes
```

With `nodes`, only errors at or under those nodes' dot paths are replaced. Other errors, such
as server errors on other steps, are kept.

`validateWithSchema(schema, value, basePath?)` validates any value and returns errors keyed by
dot path.

### Server errors

All errors live on the root form as `Record<dotPath, string[]>`, so a server response maps
straight onto fields:

```ts
form.setValidationErrors({ "contacts.email": ["This email is already registered"] })
```

## API reference

### FormBase

| Method                                   | Description                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `buildSchema()`                          | Builds the node tree and the dot path map. Call it first.                                   |
| `getFormValue()` / `setFormValue(value)` | Reads or writes the whole value.                                                            |
| `setValueByDotPath(path, value)`         | Writes every field mapped to the path and clears that path's errors.                        |
| `validate(nodes?)`                       | Runs field rules and the value schema, stores errors, resolves to `true` if there are none. |
| `setValueSchema(schema)`                 | Sets or clears (`null`) the schema for the whole value.                                     |

### Errors

| Method                                                   | Description                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| `setValidationErrors(errors)`                            | Sets errors, for example from a server. Call it on the root form. |
| `getValidationError(path)` / `getValidationErrors()`     | The first error for a path, or all errors.                        |
| `getValidationErrorByPaths(paths)`                       | The first error across several paths. `*` matches one segment.    |
| `getValidationErrorsCount(ns)`                           | Counts errors under a namespace prefix.                           |
| `getValidationErrorsCountByPaths(paths)`                 | Counts errors across paths (wildcards allowed).                   |
| `clearValidationError(path)` / `clearValidationErrors()` | Clears one path, or all errors.                                   |

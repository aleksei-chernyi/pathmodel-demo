<template>
  <div class="qs">
    <header class="hero">
      <div class="hero__text">
        <p class="hero__eyebrow">TypeScript · Vue 3 · Standard Schema</p>
        <h1>Forms as classes,<br />values as dot paths.</h1>
        <p class="hero__lead">
          Describe your data as a tree of decorated TypeScript classes. pathmodel binds every
          field to a dot path, validates it with Zod or any Standard Schema library, and renders
          the whole tree as a Vue form.
        </p>
        <div class="hero__cta">
          <RouterLink to="/playground" class="pg-button pg-button--primary pg-button--large">
            Open the playground
          </RouterLink>
          <a href="#installation" class="pg-button pg-button--large" @click.prevent="go('installation')">
            Get started
          </a>
        </div>
      </div>

      <div class="hero__demo">
        <div class="hero__tabs">
          <span class="hero__tab">SignupForm.ts</span>
          <span class="hero__tab hero__tab--muted">live result</span>
        </div>
        <div class="hero__split">
          <pre class="hero__code"><code class="hljs" v-html="heroHtml"></code></pre>
          <Suspense>
            <LiveDemo :code="heroCode" />
            <template #fallback><div class="live live--loading">Loading…</div></template>
          </Suspense>
        </div>
      </div>
    </header>

    <div class="doc">
      <aside class="doc__toc">
        <nav>
          <div class="doc__toc-title">On this page</div>
          <a
            v-for="h in headings"
            :key="h.id"
            :href="`#${h.id}`"
            class="doc__toc-link"
            :class="[`doc__toc-link--h${h.depth}`, { 'doc__toc-link--active': h.id === activeId }]"
            @click.prevent="go(h.id)"
          >
            {{ h.text }}
          </a>
        </nav>
      </aside>
      <article ref="article" class="doc__body markdown" v-html="html"></article>
    </div>

    <footer class="footer">
      pathmodel · MIT ·
      <RouterLink to="/playground">Playground</RouterLink>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from "vue"
import source from "../docs/quick-start.md?raw"
import { highlight, render } from "../docs/markdown"

// The live demo runs the playground compiler, so it loads after the page text.
const LiveDemo = defineAsyncComponent(() => import("./LiveDemo.vue"))

const heroCode = `import { FormBase, Schema } from "@aleksei-chernyi/pathmodel"
import { TextInput, Select } from "./fields"
import { z } from "zod"

class SignupForm extends FormBase {
  @Schema({
    component: TextInput,
    dotPath: "user.email",
    props: { label: "Email" },
    options: {
      required: true,
      requiredMessage: "Email is required",
      rules: z.email("Invalid email"),
    },
  })
  email!: string | null

  @Schema({
    component: Select,
    dotPath: "user.plan",
    props: { label: "Plan", options: ["free", "pro"] },
    options: { default: "free" },
  })
  plan!: string
}

export default SignupForm
`
const heroHtml = highlight(heroCode, "ts")

const { html, headings } = render(source)

const article = ref<HTMLElement | null>(null)
const activeId = ref(headings[0]?.id ?? "")

// In-page anchors are scrolled by hand: the hash belongs to the router.
function go(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  activeId.value = id
}

let observer: IntersectionObserver | null = null
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
      if (visible.length) activeId.value = visible[0].target.id
    },
    { rootMargin: "-70px 0px -70% 0px" }
  )
  article.value?.querySelectorAll("h2[id], h3[id]").forEach((h) => observer!.observe(h))
})
onBeforeUnmount(() => observer?.disconnect())
</script>

import { createRouter, createWebHashHistory } from "vue-router"
import QuickStart from "./pages/QuickStart.vue"

// Hash history: the site is plain static files and needs no server rewrites.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "quick-start", component: QuickStart, meta: { title: "Quick start" } },
    {
      path: "/playground",
      name: "playground",
      // The playground bundles the TypeScript compiler; load it only when opened.
      component: () => import("./pages/Playground.vue"),
      meta: { title: "Playground" },
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
})

router.afterEach((to) => {
  document.title = `${to.meta.title} · pathmodel`
})

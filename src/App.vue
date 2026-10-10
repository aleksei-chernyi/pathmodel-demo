<template>
  <div class="app" :class="{ 'app--fixed': route.name === 'playground' }">
    <nav class="nav">
      <RouterLink to="/" class="nav__brand">
        <span class="nav__logo">a.b</span>
        pathmodel
      </RouterLink>
      <div class="nav__links">
        <RouterLink to="/" class="nav__link" exact-active-class="nav__link--active">
          Quick start
        </RouterLink>
        <RouterLink to="/playground" class="nav__link" active-class="nav__link--active">
          Playground
        </RouterLink>
      </div>
    </nav>
    <RouterView class="app__page" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router"

const route = useRoute()
</script>

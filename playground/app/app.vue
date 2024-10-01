<template>
  <div class="app">
    <svg-icon name="logo-com" width="400"></svg-icon>
    <svg-icon name="logo-de" sprite="global" width="300"></svg-icon>
    <svg-icon
      class="localrent"
      name="logo-pl"
      sprite="main"
      width="200"
    ></svg-icon>
  </div>
  <nuxt-island name="MainSprite" />
</template>

<script setup lang="ts"></script>
<style>
.app {
  background-color: gray;
}
.localrent {
  stroke: black;
}
</style>

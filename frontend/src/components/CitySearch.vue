<template>
  <div id="city-search">
    <form @submit.prevent="updateCoordinates">
      <input type="text" id="cityName" v-model="cityName">
      <button type="submit">Aktualisieren</button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      cityName: 'Düsseldorf'
    };
  },
  methods: {
    // Emit the update-coordinates event with the city name
    updateCoordinates() {
      this.$emit('update-coordinates', this.cityName);
    }
  }
};
</script>

<style scoped>
#city-search {
  display: flex;
  flex-direction: row;
  justify-content: flex-start; /* Aligns content to the right */
}

input{
  margin-right: 10px; /* Adds some space between elements */
  background-color: var(--primary-color);
  height: 30px;
  transition: transform 0.5s ease-in-out;
}

input:hover {
  transform: scale(2) translateX(+40px);
}

button{
  height: 30px;
  margin-left: 100px;
}
</style>

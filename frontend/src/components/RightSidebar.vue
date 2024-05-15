<template>
  <div class="right-sidebar">
    <div class="top-box">
    </div>
    <div class="bottom-box">
      <iframe
        width="600"
        height="600"
        frameborder="0" style="border:0"
        referrerpolicy="no-referrer-when-downgrade"
        :src="iframeSrc"
        allowfullscreen>
      </iframe>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      iframeSrc: '',
      //iframeSrc: `https://www.google.com/maps/embed/v1/view?key=AIzaSyA8L6nbvtOasMavozQMIdjxvvIbc4j2kjU&center=51.244001,6.7946256&zoom=19&maptype=satellite`,
    };
  },
  methods: {
    showNavigation(placeName) {
      this.iframeSrc = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyA8L6nbvtOasMavozQMIdjxvvIbc4j2kjU
      &origin=Düsseldorf
      &destination=${placeName}
      &zoom=13
      &mode=walking`;
    },
  },
};
</script>

<style scoped>
.right-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid black;
  background-color: #A5EE80;
}

.top-box{
  flex: 1;
  border: 1px solid black;
  margin: 10px;
  background-color: white;
  background-image: url('@/assets/tempRating.png');
  background-size:contain; /* ensures the image covers the entire container */
  background-position: center; /* centers the image */
}

.bottom-box {
  flex: 1;
  border: 1px solid black;
  margin: 10px;
  background-color: white;
  background-image: url('@/assets/tempNavigation.png');
  background-size: cover; /* ensures the image covers the entire container */
  background-position: center; /* centers the image */
}
</style>

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
      &mode=transit`;
    },
  },
};
</script>

<style scoped>
.right-sidebar {
  grid-area: right;
  padding: 20px;
  margin: 20px;
  background-color: var(--secondary-color);
  color: white;
  border-radius: var(--border-radius);
  box-shadow: 4px 8px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
  width: 23vw;
}

.right-sidebar:hover {
  transform: translateX(-20px);
}

@media (max-width: 768px) {
  .right-sidebar {
    transform: translateX(0);
  }
}

.top-box{
  flex: 1;
  border: 1px solid black;
  margin: 10px;
  margin-bottom: 20px;
  background-color: white;
  background-image: url('@/assets/tempRating3.png');
  background-size: cover; /* ensures the image covers the entire container */
  background-position: center; /* centers the image */
  height: 40vh;
  transition: transform 0.3s ease-in-out;
}

.top-box:hover {
  transform: scale(1.1);
}

.bottom-box {
  flex: 1;
  border: 1px solid black;
  margin: 10px;
  background-color: white;
  background-image: url('@/assets/tempNavigation2.png');
  background-size: cover; /* ensures the image covers the entire container */
  background-position: center; /* centers the image */
  transition: transform 0.3s ease-in-out;
}

.bottom-box:hover {
  transform: scale(1.1);
}
</style>

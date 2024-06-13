<template>
  <div class="right-sidebar">
    <div class="top-box">
      <div class="input-container">
        <label id="ratingText" class="input-label">{{ ratingText }}</label>
        <input type="text" id="submitRating" />
        <button @click="confirmRatingText">Senden</button>
      </div>
    </div>
    <div class="bottom-box">
      <iframe
        width="567"
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
import axios from 'axios';

export default {
  data() {
    return {
      iframeSrc: '',
      ratingText: '',
    };
  },
  methods: {
    showNavigation(placeName) {
      this.iframeSrc = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyA8L6nbvtOasMavozQMIdjxvvIbc4j2kjU
      &origin=Düsseldorf
      &destination=${placeName}
      &zoom=14
      &mode=transit`;
    },

    async showRating(placeName) {
      try {
        const response = await axios.get('http://localhost:3000/showRating', {
          params: {
            placeName,
          },
        });
        console.log('Ratingdaten:', response.data.ratings);
        this.ratingText = response.data.ratings[0].text;
      } catch (error) {
        console.error('Fehler beim Abrufen der Ratingdaten:', error);
      }
    },

    updateRatingText(event) {
      this.ratingText = event.target.value;
    },

    confirmRatingText() {
      alert(`Confirmed rating text: ${this.ratingText}`);
      // Here you can add additional logic to handle the confirmed rating text
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

.top-box {
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

.input-container {
  margin-bottom: 10px;
}

.input-label {
  background-color: rgba(255, 255, 255, 0.9);
  color: black;
  padding: 5px;
}

.input-container label,
.input-container input,
.input-container button {
  display: block;
  margin: 5px 0;
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

<template>
  <div class="left-sidebar">
    <!-- City Search at the top -->
    <div class="city-search">
      <CitySearch @update-coordinates="forwardUpdateCoordinates"/>
    </div>

    <!-- Profile image -->
    <div class="profile-image">
      <img src="../assets/profilePicture.png" alt="Profile Picture" />
    </div>

    <!-- Horizontal layout for "Benutzername" and "Rang" -->
    <div class="horizontal-layout">
      <div class="benutzername">
        Benutzername
      </div>
      
      <div class="rang">
        Rang
      </div>
    </div>

    <!-- Main content block for "Premium Partner" and "Karten" -->
    <div class="main-content">
      <div class="premium-partner">
        Premium Partner
      </div>
      
      <div class="karten">
        Karten
      </div>
    </div>

    <!-- Smaller sections with sub-items -->
    <div class="smaller-sections">
      <div class="events">Events</div>
      <div class="recommendations">Empfehlungen</div>
      <div class="socials">Socials & Freunde</div>
      <div class="contact">Kontakt / Feedback</div>
      <div class="settings">Einstellungen</div>
    </div>
  </div>
</template>

<script>
import CitySearch from './CitySearch.vue';

export default {
  components: {
    CitySearch,
  },
  methods: {
    forwardUpdateCoordinates(data) {
      // Forward the event to the parent component
      this.$emit('update-coordinates', data);
    },
  },
};
</script>

<style scoped>
.left-sidebar {
  display: flex;
  flex-direction: column;
  flex: 1;
  border: 1px solid black;
  padding: 10px;
}

.city-search {
  padding-bottom: 30px;
}

.profile-image {
  text-align: center;
  margin-bottom: 10px;
}

.profile-image img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  padding-bottom: 10px;
}

.horizontal-layout {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-bottom: 30px;
}

.benutzername {
  /* Set to take up 3/5 of the width */
  flex: 3;  /* 3/5 of the total flex space */
  border: 1px solid black;
  padding: 10px;
  margin-right: 30px;
}

.rang {
  /* Set to take up 2/5 of the width */
  flex: 2;  /* 2/5 of the total flex space */
  border: 1px solid black;
  padding: 10px;
  background-color: white;
}
.main-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.premium-partner {
  /* Set to take up 2/3 of the main content area */
  flex: 2;  /* 2/3 of the total flex space */
  border: 1px solid black;
  padding: 10px;
  margin-bottom: 10px;
}

.karten {
  /* Set to take up 1/3 of the main content area */
  flex: 1;  /* 1/3 of the total flex space */
  border: 1px solid black;
  padding: 10px;
  margin-bottom: 10px;
}

.events {
  /* Styles for the Events section */
  padding: 10px;
}

.smaller-sections > div {
  border: 1px solid black; 
  padding: 10px;
}
</style>

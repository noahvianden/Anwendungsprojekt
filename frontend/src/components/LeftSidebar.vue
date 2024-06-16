<!-- LeftSidebar.vue -->
<template>
  <div class="left-sidebar">
    <!-- City Search at the top -->
    <div class="city-search">
      <CitySearch @update-coordinates="forwardUpdateCoordinates"/>
    </div>

    <!-- Profile image -->
    <div class="profile-image">
      <img src="../assets/profilePicture2.png" alt="Profile Picture" />
    </div>

    <!-- Horizontal layout for "Benutzername" and "Rang" -->
    <div class="horizontal-layout">
      <div class="benutzername">
        Noah Vianden
      </div>
      
      <div class="rang">
        <label id="rangText">{{ rangText }}</label>
      </div>
    </div>

    <!-- Main content block for "Premium Partner" and "Karten" -->
    <div class="main-content">
      <div class="premium-partner">
        <label id="premiumPartner" class="list-label" v-html="premiumText"></label>
      </div>
      
      <div class="karten">
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
import axios from 'axios';

export default {
  components: {
    CitySearch,
  },
  data() {
    return {
      rangText: "",
      premiumText: "",
    };
  },
  mounted() {
    this.list_premium_partners();
  },
  methods: {
    forwardUpdateCoordinates(data) {
      // Forward the event to the parent component
      this.$emit('update-coordinates', data);
    },
    async list_premium_partners() {
      try {
        console.log('Fetching Premium Partner');
        const response = await axios.get('http://localhost:3000/list_premium_partners');
        const partners = response.data.partnersWithName;
        // Beispiel: Annahme, dass response.data.partners ein Array von Premium-Partnern ist
        for (const partner of partners) {
          this.premiumText = `<br>${this.premiumText}<br><br>${partner.name}<br><br>${partner.discount}<br>`;
        }
      } catch (error) {
        console.error('Fehler beim Abrufen der PremiumPartner', error);
      }
    },
    addPoints(points) {
      if (points == 10) {
        this.rangText = "Beginner";
      } else if (points == 20) {
        this.rangText = "Learner";
      } else if (points == 50) {
        this.rangText = "Explorer";
      } else if (points == 100) {
        this.rangText = "Adventurer";
      }
    }
  },
};
</script>


<style scoped>
.left-sidebar {
  grid-area: left;
  margin: 20px;
  padding: 20px;
  background-color: var(--secondary-color);
  border-radius: var(--border-radius);
  box-shadow: 4px 8px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
  width: 18vw;
}

.left-sidebar:hover {
  transform: translateX(+20px);
}

.city-search {
  padding-top: 20px;
  padding-bottom: 30px;
}

.profile-image {
  text-align: left;
  margin-bottom: 10px;
}

.profile-image img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  padding-bottom: 10px;
  transition: transform 0.4s ease-in-out;
}

.profile-image img:hover {
  transform: scale(3.1) translateX(+50px) translateY(+50px);
}

.horizontal-layout {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-bottom: 20px;
}

.benutzername {
  /* Set to take up 3/5 of the width */
  flex: 3;  /* 3/5 of the total flex space */
  border: 1px solid black;
  padding: 10px;
  margin-right: 30px;
  background-color: var(--primary-color);
}

.rang {
  /* Set to take up 2/5 of the width */
  flex: 2;  /* 2/5 of the total flex space */
  border: 1px solid black;
  padding: 10px;
  background-color: var(--primary-color);
}

.main-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 50vh;
}

.premium-partner {
  /* Set to take up 2/3 of the main content area */
  flex: 4;  /* 2/3 of the total flex space */
  border: 1px solid black;
  padding: 10px;
  margin-bottom: 20px;
  background-color: white;
  background-image: url('@/assets/premiumPartners2.png');
  background-size: cover; /* ensures the image covers the entire
  background-position: center; /* centers the image */
  flex-direction: column;
  transition: transform 0.3s ease-in-out;
}

.premium-partner:hover {
  transform: scale(1.1);
}

.karten {
  /* Set to take up 1/3 of the main content area */
  flex: 1;  /* 1/3 of the total flex space */
  border: 1px solid black;
  padding: 10px;
  margin-bottom: 20px;
  background-color: white;
  background-image: url('@/assets/savedMaps.png');
  background-size: contain; /* ensures the image covers the entire container */
  background-position: center; /* centers the image */
  transition: transform 0.3s ease-in-out;
}

.karten:hover {
  transform: scale(1.1);
}

.events {
  /* Styles for the Events section */
  padding: 10px;
}

.smaller-sections > div {
  border: 1px solid black; 
  padding: 10px;
  background-color: var(--primary-color);
  transition: transform 0.3s ease-in-out;
}

.smaller-sections > div:hover {
  transform: scale(1.1);
}

.list-label {
  background-color: rgba(255, 255, 255, 0.9);
  color: black;
  padding: 5px;
}

</style>

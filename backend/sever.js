const express = require('express');
const axios = require('axios');
const app = express();

const GOOGLE_PLACES_API_KEY = 'AIzaSyA8L6nbvtOasMavozQMIdjxvvIbc4j2kjU';

app.use(express.json());

app.get('/restaurants', async (req, res) => {
  try {
    const { location, radius } = req.query;
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location,
        radius,
        type: 'restaurant',
        key: GOOGLE_PLACES_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Fehler beim Abrufen der Restaurantdaten:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

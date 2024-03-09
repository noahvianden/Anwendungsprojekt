const express = require('express');
const axios = require('axios');
const app = express();

const GOOGLE_PLACES_API_KEY = 'AIzaSyA8L6nbvtOasMavozQMIdjxvvIbc4j2kjU';

app.use(express.json());

app.get('/restaurants', async (req, res) => {
  try {
    const { location, radius } = req.query;
    console.log('Received request to fetch restaurants with location:', location, 'and radius:', radius);
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location,
        radius,
        type: 'restaurant',
        key: GOOGLE_PLACES_API_KEY
      }
    });
    console.log('Successfully fetched restaurant data:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching restaurant data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

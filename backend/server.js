const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors'); // Importieren Sie das CORS-Paket

app.use(cors()); // Aktivieren Sie CORS
const GOOGLE_PLACES_API_KEY = 'AIzaSyA8L6nbvtOasMavozQMIdjxvvIbc4j2kjU';

app.use(express.json());

// Route für die Weiterleitung von Anfragen an die Google Places API
app.get('/places', async (req, res) => {
  try {
    // Extrahieren Sie die erforderlichen Parameter aus der Anfrage, z. B. die Position und den Radius
    const { latitude, longitude, radius } = req.query;
    
    // Senden Sie eine Anfrage an die Google Places API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${latitude},${longitude}`,
        radius: 3000,
        key: GOOGLE_PLACES_API_KEY
      }
    });
    
    // Senden Sie die Antwort von der Google Places API an den Client zurück
    res.json(response.data);
  } catch (error) {
    console.error('Fehler beim Weiterleiten der Anfrage an die Google Places API:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

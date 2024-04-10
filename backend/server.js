const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const cors = require('cors'); // Importieren Sie das CORS-Paket

app.use(cors()); // Aktivieren Sie CORS
const GOOGLE_PLACES_API_KEY = 'AIzaSyA8L6nbvtOasMavozQMIdjxvvIbc4j2kjU';
const latitude = 51.2277;
const longitude = 6.7735;
const radius = 20000;

// Verbindung zur SQLite-Datenbank herstellen
const db = new sqlite3.Database('data.db');

app.use(express.json());

db.serialize(() => {
  //db.run("DROP TABLE places")
  db.run("CREATE TABLE IF NOT EXISTS places (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, latitude REAL, longitude REAL, type TEXT, vicinity TEXT, open BOOL)");
  fetchPlacesData();
});

async function fetchPlacesData(){
  try{
  // Holen Sie Daten aus der SQLite-Datenbank
  db.all("SELECT * FROM places", async (err, rows) => {
    if (err) {
      console.error('Fehler beim Abrufen von Orten aus der Datenbank:', err);
    } else {
      if (rows.length > 0) {
        try {
          // Senden Sie eine Anfrage an die Google Places API
          const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
            params: {
              location: `${latitude},${longitude}`,
              radius: radius,
              type: 'restaurant',
              key: GOOGLE_PLACES_API_KEY
            }
          });

          // Daten von der Google Places API erhalten
          const places = response.data.results;

          // Aktualisieren Sie die vorhandenen Orte in der Datenbank, falls erforderlich
          rows.forEach(async row => {
            const matchingPlace = places.find(place => place.name === row.name);
            if (matchingPlace) {
              if (matchingPlace.geometry.location.lat !== row.latitude ||
                  matchingPlace.geometry.location.lng !== row.longitude ||
                  matchingPlace.types.join(', ') !== row.type) {
                // Die Werte unterscheiden sich, also aktualisieren Sie den Datensatz
                await db.run("UPDATE places SET latitude = ?, longitude = ?, type = ?, vicinity = ?, open = ? WHERE name = ?",
                  [matchingPlace.geometry.location.lat, 
                    matchingPlace.geometry.location.lng, 
                    matchingPlace.types.join(', '), 
                    matchingPlace.vicinity, 
                    matchingPlace.opening_hours && matchingPlace.opening_hours.open_now ? 1 : 0, // Setzt den Wert auf 1, wenn open_now true ist, andernfalls auf 0
                    row.name]);
              }
            }
          });
          
          // Daten, die noch nicht in der DB sind, einfügen
          const notInDatabasePlaces = places.filter(place => !rows.some(row => row.name === place.name));
          if (notInDatabasePlaces.length > 0) {
              notInDatabasePlaces.forEach(async place => {
                  await db.run("INSERT INTO places (name, latitude, longitude, type, vicinity, open) VALUES (?, ?, ?, ?, ?, ?)",
                      [place.name, 
                        place.geometry.location.lat, 
                        place.geometry.location.lng, 
                        place.types.join(', '), 
                        place.vicinity, 
                        place.opening_hours && matchingPlace.opening_hours.open_now ? 1 : 0]);
              });
          }
        } catch (error) {
          console.error('Fehler beim Abrufen von Orten von der Google Places API:', error);
        }
      } else {
        // Wenn keine Daten in der Datenbank vorhanden sind, senden Sie eine Anfrage an die Google Places API
        // und fügen Sie die erhaltenen Orte direkt in die Datenbank ein
        axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
          params: {
            location: `${latitude},${longitude}`,
            radius: radius,
            type: 'restaurant',
            key: GOOGLE_PLACES_API_KEY
          }
        })
        .then(response => {
          // Daten von der Google Places API erhalten
          const places = response.data.results;

          // Daten in die SQLite-Datenbank einfügen
          places.forEach(place => {
            db.run("INSERT INTO places (name, latitude, longitude, type, vicinity, open) VALUES (?, ?, ?, ?, ?, ?)",
              [place.name, 
                place.geometry.location.lat, 
                place.geometry.location.lng, 
                place.types.join(', '), 
                place.vicinity, 
                place.opening_hours && place.opening_hours.open_now ? 1 : 0]);
          });

        })
        .catch(error => {
          console.error('Fehler beim Abrufen von Orten von der Google Places API:', error);
        });
      }
    }
  });
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
  }
};

// Route zum Einladen der Google Places API-Daten in die data.db
app.get('/places', async (req, res) => {
  try {    
    console.log("places")
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.get('/list_places', (req, res) => {
  try {
    // Holen Sie Daten aus der SQLite-Datenbank
    db.all("SELECT * FROM places", (err, rows) => {
      if (err) {
        console.error('Fehler beim Abrufen von Orten aus der Datenbank:', err);
        res.status(500).json({ error: 'Interner Serverfehler' });
      } else {
        // Daten an den Client senden
        res.json(rows);
      }
    });
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

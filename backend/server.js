const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const cors = require('cors'); // Importieren Sie das CORS-Paket

app.use(cors()); // Aktivieren Sie CORS
const GOOGLE_PLACES_API_KEY = 'AIzaSyA8L6nbvtOasMavozQMIdjxvvIbc4j2kjU';
const latitude = 51.2277;
const longitude = 6.7735;
const radius = 15000;

// Verbindung zur SQLite-Datenbank herstellen
const db = new sqlite3.Database('data.db');

app.use(express.json());

db.serialize(() => {
  //db.run("DROP TABLE places")
  db.run("CREATE TABLE IF NOT EXISTS places (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, latitude REAL, longitude REAL, type TEXT, vicinity TEXT, open BOOL)");
  db.run("CREATE TABLE IF NOT EXISTS districts (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255),latitude REAL, longitude REAL)")
  fetchPlacesData();
});

async function fetchPlacesData() {
  try {
    // Holen Sie Daten aus der SQLite-Datenbank
    const rows = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM places", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    // Daten von der Google Places API abrufen
    // Verwenden Sie die Funktion fetchAllPlaces() um alle Orte abzurufen
    const places = await fetchAllPlaces();

    // Aktualisieren Sie vorhandene Orte in der Datenbank
    for (const row of rows) {
      const matchingPlace = places.find(place => place.name === row.name); //Laufzeit überprüfen & Namen identisch -> PlaceiD aus Api
      if (matchingPlace) {
        if (
          matchingPlace.geometry.location.lat !== row.latitude ||
          matchingPlace.geometry.location.lng !== row.longitude ||
          matchingPlace.types.join(', ') !== row.type
        ) {
          // Die Werte unterscheiden sich, also aktualisieren Sie den Datensatz
          await db.run("UPDATE places SET latitude = ?, longitude = ?, type = ?, vicinity = ?, open = ? WHERE name = ?",
            [
              matchingPlace.geometry.location.lat,
              matchingPlace.geometry.location.lng,
              matchingPlace.types.join(', '),
              matchingPlace.vicinity,
              matchingPlace.opening_hours && matchingPlace.opening_hours.open_now ? 1 : 0, // Setzen Sie den Wert auf 1, wenn open_now true ist, andernfalls auf 0
              row.name
            ]);
        }
      }
    }

    // Fügen Sie Daten hinzu, die noch nicht in der DB sind
    const notInDatabasePlaces = places.filter(place => !rows.some(row => row.name === place.name));
    for (const place of notInDatabasePlaces) {
      await db.run("INSERT INTO places (name, latitude, longitude, type, vicinity, open) VALUES (?, ?, ?, ?, ?, ?)",
        [
          place.name,
          place.geometry.location.lat,
          place.geometry.location.lng,
          place.types.join(', '),
          place.vicinity,
          place.opening_hours && place.opening_hours.open_now ? 1 : 0
        ]);
    }
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
  }
};

async function fetchAllPlaces() {
  const allPlaces = [];
  // Holen Sie Daten aus der SQLite-Datenbank
  const districts = await new Promise((resolve, reject) => {
    db.all("SELECT name FROM districts", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
  for (const district of districts) {
    let nextPageToken = null;
    //let i = 0;
    //console.log(district.name);
    do {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: 'restaurants "' + district.name + '"',
          key: GOOGLE_PLACES_API_KEY,
          pagetoken: nextPageToken

        }
      });

      allPlaces.push(...response.data.results);

      nextPageToken = response.data.next_page_token;
      //console.log("Seite " + i);
      //console.log(nextPageToken);
      // Warten Sie eine Weile, da die nächste Seite möglicherweise noch nicht verfügbar ist
      //await new Promise(resolve => setTimeout(resolve, 1000)); // Warten Sie 2 Sekunden zwischen den Anfragen, um die API-Beschränkungen einzuhalten
      //i++;
    } while (nextPageToken);
  }

  //console.log("Alle Places");
  return allPlaces;
}

app.get('/places', async (req, res) => {
  const { latitude, longitude } = req.query;

  try {
    const restaurants = await new Promise((resolve, reject) => {
      // Führen Sie eine SELECT-Abfrage mit den übergebenen Koordinaten und einem Radius von 2 km aus
      db.all("SELECT * FROM places WHERE type LIKE '%restaurant%' AND (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) <= 2", [latitude, longitude, latitude], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    //console.log("Gefundene Restaurants:", restaurants);

    res.json({ restaurants });
  } catch (error) {
    console.error('Fehler beim Abrufen der Restaurants aus der Datenbank:', error);
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

const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

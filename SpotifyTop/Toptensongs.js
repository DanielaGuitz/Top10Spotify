// Token de Spotify 
const token = "";

// Clase para la cola con prioridad
class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(track, priority = 0) {
        const song = {
            name: track.name,
            artists: track.artists.map(artist => artist.name).join(", "),
            spotifyUrl: track.external_urls.spotify,
            previewUrl: track.preview_url,
            priority: priority,
            addedAt: new Date()
        };

        // Insertar basado en prioridad
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            if (song.priority > this.items[i].priority) {
                this.items.splice(i, 0, song);
                added = true;
                break;
            }
        }

        if (!added) {
            this.items.push(song);
        }

        this.updateDisplay();
    }

    dequeue() {
        if (this.isEmpty()) {
            alert("La cola está vacía");
            return null;
        }
        const song = this.items.shift();
        this.updateDisplay();
        return song;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    updateDisplay() {
        const queueContainer = document.getElementById('queue-container');
        if (!queueContainer) return;

        queueContainer.innerHTML = '';
        this.items.forEach((song, index) => {
            const songElement = document.createElement('div');
            songElement.className = 'song-item';
            songElement.innerHTML = `
                <div class="song-info">
                    <span class="song-number">${index + 1}</span>
                    <div class="song-details">
                        <div class="song-title">${song.name}</div>
                        <div class="song-artist">${song.artists}</div>
                    </div>
                    ${song.priority > 0 ? `<span class="priority-badge">Prioridad: ${song.priority}</span>` : ''}
                </div>
                <div class="song-controls">
                    <button onclick="changePriority(${index})" class="priority-btn">
                        Cambiar Prioridad
                    </button>
                    <a href="${song.spotifyUrl}" target="_blank" class="spotify-btn">
                        Abrir en Spotify
                    </a>
                </div>
            `;
            queueContainer.appendChild(songElement);
        });

        // Actualizar contador de canciones
        const queueCount = document.getElementById('queue-count');
        if (queueCount) {
            queueCount.textContent = this.items.length;
        }
    }
}

// Funciones de la API de Spotify
async function fetchWebApi(endpoint, method, body = null) {
    try {
        const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            method,
            body: body ? JSON.stringify(body) : null,
        });

        if (!res.ok) {
            throw new Error(`Error: ${res.status} - ${res.statusText}`);
        }

        return await res.json();
    } catch (error) {
        console.error("Error al obtener los datos:", error.message);
        return null;
    }
}

async function getTopTracks() {
    const data = await fetchWebApi("me/top/tracks?time_range=long_term&limit=10", "GET");
    return data ? data.items : [];
}

// Variables globales
let queue;
let currentlyPlaying = null;

// Funciones de la interfaz
async function initializeQueue() {
    queue = new PriorityQueue();
    const topTracks = await getTopTracks();

    if (topTracks.length === 0) {
        alert("No se pudieron obtener las canciones. Verifica tu token de acceso.");
        return;
    }

    topTracks.forEach(track => queue.enqueue(track));
    updateNowPlaying(null);
}

function playNext() {
    const nextSong = queue.dequeue();
    if (nextSong) {
        currentlyPlaying = nextSong;
        updateNowPlaying(nextSong);
    }
}

function updateNowPlaying(song) {
    const nowPlayingContainer = document.getElementById('now-playing');
    if (!nowPlayingContainer) return;

    if (song) {
        nowPlayingContainer.innerHTML = `
            <div class="now-playing-info">
                <h3>Reproduciendo ahora:</h3>
                <div class="song-title">${song.name}</div>
                <div class="song-artist">${song.artists}</div>
            </div>
        `;
    } else {
        nowPlayingContainer.innerHTML = '<p>No hay canción reproduciéndose</p>';
    }
}

function changePriority(index) {
    const newPriority = prompt("Ingresa la nueva prioridad (0-10):", "0");

    if (newPriority !== null) {
        const priority = parseInt(newPriority);
        if (!isNaN(priority) && priority >= 0 && priority <= 10) {
            // Guardamos la canción y la eliminamos de la cola
            let song = queue.items[index];

            // Eliminamos la canción de la cola sin perder la referencia
            queue.items.splice(index, 1);

            // Actualizamos la prioridad sin alterar los demás datos
            song.priority = priority;
            song.addedAt = new Date(); // Asegurar orden en caso de empate

            // Insertamos la canción en la posición correcta
            queue.enqueue(song, priority);

            // Volver a actualizar la vista
            queue.updateDisplay();

            console.log("✅ Prioridad actualizada:", song);
        } else {
            alert("Por favor, ingresa un número válido entre 0 y 10.");
        }
    }
}
    



// Inicializar cuando se carga la página
window.onload = initializeQueue;

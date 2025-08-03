console.log('lets write the javascript'); // Log that script has started

let currentsong = new Audio(); // Create a new Audio object to play songs
let songs = []; // Array to hold list of songs
let currFolder; // Variable to store current folder name (used for playlists)

// Convert seconds to MM:SS format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00"; // Handle invalid time
    }

    const minutes = Math.floor(seconds / 60); // Get full minutes
    const remainingSeconds = Math.floor(seconds % 60); // Get remaining seconds

    // Pad with leading 0 if needed and return in MM:SS
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Fetch songs from a given folder on the local server
async function getSongs(folder) {
    currFolder = folder; // Save current folder globally
    let a = await fetch(`/${folder}/`); // Fetch directory listing
    let response = await a.text(); // Get text response (HTML)

    let div = document.createElement("div"); // Create a dummy div to parse HTML
    div.innerHTML = response;

    let as = div.getElementsByTagName("a"); // Get all anchor tags from parsed HTML
    let songsList = []; // Temporary list to store song names

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) { // Only add mp3 files
            songsList.push(element.href.split(`/${folder}/`)[1]); // Extract song name
        }
    }

    songs = songsList; // Update global songs list

    // Show songs in playlist UI
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = ""; // Clear existing songs

    for (const song of songs) {
        songUL.innerHTML += `
        <li>
            <img class="invert" src="img/music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>harrry</div>
            </div>
            <div class="playnow">
                <span>play now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`;
    }

    // Add click event to each song item
    Array.from(songUL.getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            let track = e.querySelector(".info").firstElementChild.innerHTML.trim(); // Get song name
            playMusic(track); // Play the selected song
        });
    });
    return songs
}

// Function to load and play a selected track
const playMusic = (track, pause = false) => {
    currentsong.src = `/${currFolder}/` + track; // Set source path
    if (!pause) {
        currentsong.play(); // Play if pause is false
        document.getElementById("play").src = "img/pause.svg"; // Change button to pause
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track); // Show song name
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"; // Reset time display
};

async function displayAlbums() {
    console.log("displaying albums")
    let a = await fetch(`/songs/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a")
    let cardContainer = document.querySelector(".cardContainer")
    let array = Array.from(anchors)
    for (let index = 0; index < array.length; index++) {
        const e = array[index]; 
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").slice(-2)[0]
            // Get the metadata of the folder
            let a = await fetch(`/songs/${folder}/info.json`)
            let response = await a.json(); 
            cardContainer.innerHTML = cardContainer.innerHTML + ` <div data-folder="${folder}" class="card">
            <div class="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                        stroke-linejoin="round" />
                </svg>
            </div>

            <img src="/songs/${folder}/cover.jpg" alt="">
            <h2>${response.title}</h2>
            <p>${response.description}</p>
        </div>`
        }
    }

    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => { 
        e.addEventListener("click", async item => {
            console.log("Fetching Songs")
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)  
            playMusic(songs[0])

        })
    })
}



// Main function that runs the app
async function main() {
    // Get the list of all the songs
    await getSongs("songs/ncs")
    playMusic(songs[0], true)

    // Display all the albums on the page
    await displayAlbums()
    const play = document.getElementById("play"); // Play button
    const previous = document.getElementById("previous"); // Previous button
    const next = document.getElementById("next"); // Next button

    await getSongs("songs/ncs"); // Load songs from default folder
    playMusic(songs[0], true); // Play first song but paused

    // Play/Pause toggle
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "img/pause.svg"; // Show pause icon
        } else {
            currentsong.pause();
            play.src = "img/play.svg"; // Show play icon
        }
    });

    // Previous song button
    previous.addEventListener("click", () => {
        currentsong.pause();
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]); // Find current song index
        if (index > 0) {
            playMusic(songs[index - 1]); // Play previous song
        }
    });

    // Next song button
    next.addEventListener("click", () => {
        currentsong.pause();
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]); // Find current song index
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]); // Play next song
        }
    });

    // Update time and progress bar as song plays
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    // Seekbar click to jump in song
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = (currentsong.duration * percent) / 100; // Jump to time
    });

    // Mute/Unmute toggle
    document.querySelector(".volume > img").addEventListener("click", e => {
        const img = e.target;
        if (img.src.includes("volume.svg")) {
            img.src = img.src.replace("volume.svg", "mute.svg"); // Change to mute icon
            currentsong.volume = 0;
            document.querySelector(".range input").value = 0; // Set slider to 0
        } else {
            img.src = img.src.replace("mute.svg", "volume.svg"); // Change to volume icon
            currentsong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });

    // Volume slider control
    document.querySelector(".range input").addEventListener("input", e => {
        currentsong.volume = parseInt(e.target.value) / 100; // Update volume
    });

    // Hamburger menu open (mobile view)
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"; // Show sidebar
    });

    // Close sidebar menu
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"; // Hide sidebar
    });

    // Load songs when album card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`); // Load songs from folder
            playMusic(songs[0], true); // Play first song from selected folder
        });
    });
}

main(); // Start the app

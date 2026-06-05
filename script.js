const audioUpload = document.getElementById('audio-upload');
const lrcEnUpload = document.getElementById('lrc-en-upload');
const lrcPtUpload = document.getElementById('lrc-pt-upload');
const audioPlayer = document.getElementById('audio-player');
const lyricsContainer = document.getElementById('lyrics-container');

let parsedLyricsEn = [];
let parsedLyricsPt = [];
let mergedLyrics = [];
let currentActiveIndex = -1;

audioUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const fileURL = URL.createObjectURL(file);
        audioPlayer.src = fileURL;
    }
});

lrcEnUpload.addEventListener('change', function(e) {
    handleLrcUpload(e, (parsed) => {
        parsedLyricsEn = parsed;
        mergeAndRenderLyrics();
    });
});

lrcPtUpload.addEventListener('change', function(e) {
    handleLrcUpload(e, (parsed) => {
        parsedLyricsPt = parsed;
        mergeAndRenderLyrics();
    });
});

function handleLrcUpload(event, callback) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const lrcText = e.target.result;
            const parsed = parseLRC(lrcText);
            callback(parsed);
        };
        reader.readAsText(file);
    }
}

function parseLRC(text) {
    const parsed = [];
    const lines = text.split('\n');
    const regex = /\[(\d{2,}):(\d{2})(?:\.(\d{1,3}))?\](.*)/;

    lines.forEach(line => {
        const match = line.match(regex);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const secondsFraction = match[3] ? parseFloat(`0.${match[3]}`) : 0;

            const timeInSeconds = (minutes * 60) + seconds + secondsFraction;
            const lyricText = match[4].trim();

            if (lyricText) {
                parsed.push({ time: timeInSeconds, text: lyricText });
            }
        }
    });
    return parsed;
}

function mergeAndRenderLyrics() {
    if (parsedLyricsEn.length === 0) return;

    mergedLyrics = [];
    currentActiveIndex = -1;
    
    parsedLyricsEn.forEach((enLine) => {
        let ptText = "";
        if (parsedLyricsPt.length > 0) {
            // Encontra a linha em português mais próxima no tempo (tolerância de 1 segundo)
            const matchingPtLine = parsedLyricsPt.find(ptLine => Math.abs(ptLine.time - enLine.time) < 1.0);
            if (matchingPtLine) {
                ptText = matchingPtLine.text;
            }
        }
        
        mergedLyrics.push({
            time: enLine.time,
            enText: enLine.text,
            ptText: ptText
        });
    });

    renderLyrics();
}

function renderLyrics() {
    lyricsContainer.innerHTML = '';
    mergedLyrics.forEach((line, index) => {
        const div = document.createElement('div');
        div.className = 'lyric-pair';
        div.id = `line-${index}`;
        
        const pEn = document.createElement('p');
        pEn.className = 'lyric-en';
        pEn.innerText = line.enText;
        
        const pPt = document.createElement('p');
        pPt.className = 'lyric-pt';
        pPt.innerText = line.ptText;
        
        div.appendChild(pEn);
        div.appendChild(pPt);
        lyricsContainer.appendChild(div);
    });
}

audioPlayer.addEventListener('timeupdate', () => {
    if (mergedLyrics.length === 0) return;

    const currentTime = audioPlayer.currentTime;
    let activeIndex = -1;

    for (let i = 0; i < mergedLyrics.length; i++) {
        if (currentTime >= mergedLyrics[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }

    if (activeIndex !== currentActiveIndex) {
        if (currentActiveIndex !== -1) {
            const previousLine = document.getElementById(`line-${currentActiveIndex}`);
            if (previousLine) previousLine.classList.remove('active');
        }

        currentActiveIndex = activeIndex;
        
        if (activeIndex !== -1) {
            const activeLine = document.getElementById(`line-${activeIndex}`);
            if (activeLine) {
                activeLine.classList.add('active');
                activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
});

// Atalho de teclado (Barra de Espaço) para pausar/tocar a música
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault(); // Evita a rolagem da página
        if (audioPlayer.src) {
            if (audioPlayer.paused) {
                audioPlayer.play();
            } else {
                audioPlayer.pause();
            }
        }
    }
});
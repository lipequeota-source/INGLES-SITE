const audioUpload = document.getElementById('audio-upload');
const lrcEnUpload = document.getElementById('lrc-en-upload');
const lrcPtUpload = document.getElementById('lrc-pt-upload');
const audioPlayer = document.getElementById('audio-player');
const lyricsContainer = document.getElementById('lyrics-container');

// Player e Controles TDAH
const playPauseBtn = document.getElementById('play-pause-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const loopLineBtn = document.getElementById('loop-line-btn');
const interactiveModeBtn = document.getElementById('interactive-mode-btn');
const micModeBtn = document.getElementById('mic-mode-btn');
const speechFeedback = document.getElementById('speech-feedback');
const speechText = document.getElementById('speech-text');
const speechScore = document.getElementById('speech-score');

// Just Dance Feedback
const jdFeedbackOverlay = document.getElementById('jd-feedback-overlay');
const jdFeedbackText = document.getElementById('jd-feedback-text');

// Efeitos Sonoros Just Dance
const perfectSound = new Audio('https://actions.google.com/sounds/v1/crowds/crowd_cheer.ogg');
perfectSound.volume = 0.5;
const goodSound = new Audio('https://actions.google.com/sounds/v1/crowds/light_applause.ogg');
goodSound.volume = 0.5;

let parsedLyricsEn = [];
let parsedLyricsPt = [];
let mergedLyrics = [];
let currentActiveIndex = -1;
let isLoopingLine = false;
let isInteractiveMode = false;
let isMicMode = false;
let scoreHistory = [];
let isManualJump = false;

// Modal de Ajuda LRC
const helpLrcBtn = document.getElementById('help-lrc-btn');
const lrcHelpModal = document.getElementById('lrc-help-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

// Injeta uma dica de foco no placeholder inicial (se existir no HTML)
document.addEventListener("DOMContentLoaded", () => {
    const placeholder = document.querySelector('.placeholder');
    if(placeholder) {
        placeholder.innerHTML = `
            <div id="upload-msg" style="margin-bottom: 15px; color: #e4e4e7; font-size: 1.1rem;">🎶 Carregue o áudio e as letras (EN/PT) acima.</div>
            <div style="background: #18181b; padding: 15px 25px; border-radius: 12px; border: 1px solid #27272a; box-shadow: 0 -4px 15px rgba(0,0,0,0.3); display: flex; flex-direction: column; gap: 12px; text-align: left; max-width: 600px; width: 90%;">
                <div style="color: #3b82f6; font-size: 1.2rem; font-weight: bold; text-align: center; margin-bottom: 5px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <i class="fas fa-brain"></i> Dicas de Foco TDAH
                </div>
                <div style="color: #a1a1aa; font-size: 0.95rem; display: flex; align-items: center; gap: 12px;">
                    <span style="background: #27272a; padding: 8px; border-radius: 8px; color: #e4e4e7; width: 35px; text-align: center;"><i class="fas fa-retweet"></i></span> Repita a linha atual para fixar a pronúncia.
                </div>
                <div style="color: #a1a1aa; font-size: 0.95rem; display: flex; align-items: center; gap: 12px;">
                    <span style="background: #27272a; padding: 8px; border-radius: 8px; color: #e4e4e7; width: 35px; text-align: center;"><i class="fas fa-gamepad"></i></span> Ative o Modo Game para esconder palavras.
                </div>
                <div style="color: #a1a1aa; font-size: 0.95rem; display: flex; align-items: center; gap: 12px;">
                    <span style="background: #27272a; padding: 8px; border-radius: 8px; color: #e4e4e7; width: 35px; text-align: center;"><i class="fas fa-microphone"></i></span> Use o Modo Karaokê para avaliar sua fala!
                </div>
            </div>
        `;
    }
});

// Eventos do Modal
if (helpLrcBtn && lrcHelpModal && closeModalBtn) {
    helpLrcBtn.addEventListener('click', () => {
        lrcHelpModal.classList.remove('hidden');
    });
    
    closeModalBtn.addEventListener('click', () => {
        lrcHelpModal.classList.add('hidden');
    });
    
    lrcHelpModal.addEventListener('click', (e) => {
        if (e.target === lrcHelpModal) {
            lrcHelpModal.classList.add('hidden'); // Fecha ao clicar no fundo escuro
        }
    });
}

audioUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const fileURL = URL.createObjectURL(file);
        audioPlayer.src = fileURL;
        if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        if(progressBar) progressBar.value = 0;
        scoreHistory = []; // Reseta o histórico ao trocar de música
        
        const uploadMsg = document.getElementById('upload-msg');
        if (uploadMsg) uploadMsg.style.display = 'none';
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
    
    const uploadMsg = document.getElementById('upload-msg');
    if (uploadMsg) uploadMsg.style.display = 'none';

    mergedLyrics = [];
    currentActiveIndex = -1;
    
    parsedLyricsEn.forEach((enLine, index) => {
        let ptText = "";
        if (parsedLyricsPt.length > 0) {
            // Encontra a linha em português mais próxima no tempo (tolerância de 1 segundo)
            const matchingPtLine = parsedLyricsPt.find(ptLine => Math.abs(ptLine.time - enLine.time) < 1.0);
            if (matchingPtLine) {
                ptText = matchingPtLine.text;
            }
        }
        
        // Estima a duração da linha baseada na próxima (ou 5 segundos para a última)
        let duration = 5;
        if (index < parsedLyricsEn.length - 1) {
            duration = parsedLyricsEn[index + 1].time - enLine.time;
        }

        mergedLyrics.push({
            time: enLine.time,
            enText: enLine.text,
            ptText: ptText,
            duration: Math.max(duration, 0.5) // mínimo de 0.5s para evitar bugs de divisão
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
        
        // Permite clicar na letra para pular diretamente para a parte da música
        div.addEventListener('click', () => {
            if (audioPlayer.src) {
                isManualJump = true; // Avisa o sistema que foi um pulo intencional (burla o loop temporariamente)
                audioPlayer.currentTime = line.time + 0.01;
                if (audioPlayer.paused) {
                    togglePlayPause(); // Já dá play se estiver pausado
                }
            }
        });

        const pEn = document.createElement('p');
        pEn.className = 'lyric-en';
        const words = line.enText.trim().split(/\s+/);
        pEn.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
        
        const pPt = document.createElement('p');
        pPt.className = 'lyric-pt';
        pPt.innerText = line.ptText;
        
        div.appendChild(pEn);
        div.appendChild(pPt);
        lyricsContainer.appendChild(div);
    });
}

// --- Lógica do Player Customizado e Recursos TDAH ---

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

audioPlayer.addEventListener('loadedmetadata', () => {
    progressBar.max = audioPlayer.duration;
    totalTimeEl.innerText = formatTime(audioPlayer.duration);
});

function togglePlayPause() {
    if (!audioPlayer.src) return;
    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        audioPlayer.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

if(playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);

if(loopLineBtn) loopLineBtn.addEventListener('click', () => {
    isLoopingLine = !isLoopingLine;
    loopLineBtn.classList.toggle('active-toggle', isLoopingLine);
});

if(interactiveModeBtn) interactiveModeBtn.addEventListener('click', () => {
    isInteractiveMode = !isInteractiveMode;
    interactiveModeBtn.classList.toggle('active-toggle', isInteractiveMode);
    
    // Atualiza a linha atual para refletir o modo game imediatamente
    if (currentActiveIndex !== -1) {
        processInteractiveLine(currentActiveIndex, isInteractiveMode);
    }
});

// --- Lógica de Avaliação de Pronúncia (Karaokê) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let feedbackTimeout;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US'; 
    recognition.interimResults = true; // Escuta em TEMPO REAL (Não espera pausar)

    recognition.onresult = (event) => {
        if (!isMicMode) return;
        
        // Pega os resultados de forma mais robusta para blocos de áudio de fones bluetooth/mobile
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        const currentTranscript = (finalTranscript || interimTranscript).trim();

        if (currentActiveIndex !== -1 && currentTranscript) {
            const targetText = mergedLyrics[currentActiveIndex].enText;
            evaluateSpeech(currentTranscript, targetText, !!finalTranscript);
        }
    };

    recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            isMicMode = false;
            micModeBtn.classList.remove('active-toggle', 'mic-pulsing');
            alert("Permissão de microfone negada ou indisponível.");
        }
        // Outros erros como 'no-speech' (silêncio longo do celular) cairão no onend automaticamente e ele tentará religar sem estragar o jogo.
    };

    recognition.onend = () => {
        // Se o modo estiver ativo, o microfone reabre (comportamento contínuo perfeito para mobile)
        if (isMicMode) {
            try { recognition.start(); } catch (e) {}
        }
    };
}

if(micModeBtn) micModeBtn.addEventListener('click', () => {
    if (!SpeechRecognition) {
        alert("Infelizmente o seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome ou Edge.");
        return;
    }
    isMicMode = !isMicMode;
    micModeBtn.classList.toggle('active-toggle', isMicMode);
    micModeBtn.classList.toggle('mic-pulsing', isMicMode);
    
    if (isMicMode) {
        try { recognition.start(); } catch (e) {}
    } else {
        recognition.stop();
        speechFeedback.classList.add('hidden');
    }
});

let lineMaxScores = {}; // Memoriza a maior nota da linha atual para não tocar o som repetido

function evaluateSpeech(transcript, target, isFinal) {
    // Limpa pontuações e transforma em arrays de palavras para comparar
    const wordsSpoken = transcript.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
    const wordsTarget = target.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);

    let matches = 0;
    // Usa um Set para contar palavras únicas e evitar pontuação extra por repetição
    const spokenSet = new Set(wordsSpoken);
    wordsTarget.forEach(tw => { if (spokenSet.has(tw)) matches++; });

    let percentage = Math.round((matches / wordsTarget.length) * 100);
    if (percentage > 100) percentage = 100;

    const prevMax = lineMaxScores[currentActiveIndex] || 0;
    
    // Mantém a maior pontuação atingida durante a frase (interim)
    if (percentage > prevMax) {
        lineMaxScores[currentActiveIndex] = percentage;
    } else {
        percentage = prevMax; 
    }

    if (isFinal) {
        scoreHistory.push(percentage); // Armazena no histórico só no final da frase
    }

    // --- Lógica de Feedback "Just Dance" ---
    let feedbackWord = '';
    let feedbackClass = '';
    let shouldPlaySound = false;

    if (percentage >= 90) {
        feedbackWord = 'DEMAIS! 🌟';
        feedbackClass = 'jd-perfect';
        if (prevMax < 90) shouldPlaySound = true; // Toca som só se for a 1ª vez atingindo a meta
    } else if (percentage >= 70) {
        feedbackWord = 'ÓTIMO! 🔥';
        feedbackClass = 'jd-good';
        if (prevMax < 70) shouldPlaySound = true;
    } else if (percentage >= 40) {
        feedbackWord = 'BOM! 👍';
        feedbackClass = 'jd-ok';
    } else {
        return;
    }
    
    // Se não for resultado final e a animação/som dessa meta já tocou, não faça nada
    if (!shouldPlaySound && !isFinal && prevMax >= 40) return;

    jdFeedbackText.textContent = feedbackWord;
    jdFeedbackOverlay.className = `jd-feedback-overlay ${feedbackClass}`; // Remove 'hidden' e adiciona a cor
    
    // Reinicia a animação CSS violentamente para dar o Pop na tela
    jdFeedbackText.style.animation = 'none';
    void jdFeedbackText.offsetWidth; 
    jdFeedbackText.style.animation = 'jd-pop 1.2s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards';

    lyricsContainer.classList.add(`jd-glow-${feedbackClass.replace('jd-', '')}`);

    if (shouldPlaySound) {
        if (percentage >= 90) { perfectSound.currentTime = 0; perfectSound.play().catch(e=>{}); }
        else if (percentage >= 70) { goodSound.currentTime = 0; goodSound.play().catch(e=>{}); }
    }

    // Limpa o feedback após a animação
    clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(() => {
        jdFeedbackOverlay.className = 'jd-feedback-overlay hidden';
        lyricsContainer.classList.remove(`jd-glow-perfect`, `jd-glow-good`, `jd-glow-ok`);
    }, 1200); // Duração da animação
    
    // O feedback antigo (caixa pequena) foi removido para dar lugar ao Just Dance.
    // Ele só será usado no final da música agora.
}

audioPlayer.addEventListener('timeupdate', () => {
    if (!audioPlayer.paused) {
        progressBar.value = audioPlayer.currentTime;
    }
    currentTimeEl.innerText = formatTime(audioPlayer.currentTime);

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

    // Lógica TDAH: Hyperfocus (Loop da linha atual)
    if (isLoopingLine && !isManualJump && currentActiveIndex !== -1 && activeIndex > currentActiveIndex) {
        // Volta para o início da frase (com +0.01 para evitar bugs de precisão de milissegundos do navegador)
        audioPlayer.currentTime = mergedLyrics[currentActiveIndex].time + 0.01;
        
        // Ao reiniciar a frase em Loop, escondemos a palavra novamente se o Game Mode estiver ON!
        if (isInteractiveMode) {
            processInteractiveLine(currentActiveIndex, isInteractiveMode);
        }
        return;
    }

    if (activeIndex !== currentActiveIndex) {
        if (currentActiveIndex !== -1) {
            const previousLine = document.getElementById(`line-${currentActiveIndex}`);
            if (previousLine) {
                previousLine.classList.remove('active');
                // Restaura o texto original (remove lacunas) para não poluir
                const pEn = previousLine.querySelector('.lyric-en');
                const words = mergedLyrics[currentActiveIndex].enText.trim().split(/\s+/);
                pEn.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
            }
        }

        currentActiveIndex = activeIndex;
        
        if (activeIndex !== -1) {
            const activeLine = document.getElementById(`line-${activeIndex}`);
            if (activeLine) {
                activeLine.classList.add('active');
                
                // Cálculo exato para manter a linha sempre no centro do container
                const containerCenter = lyricsContainer.clientHeight / 2;
                const lineCenter = activeLine.clientHeight / 2;
                lyricsContainer.scrollTo({
                    top: activeLine.offsetTop - containerCenter + lineCenter,
                    behavior: 'smooth'
                });
                
                // Aplica o Modo Game se estiver ativado
                processInteractiveLine(activeIndex, isInteractiveMode);
            }
        }
    }
    
    isManualJump = false; // Reseta a trava após processar a mudança de tempo

    // Lógica Karaokê: Iluminar palavra por palavra em sincronia
    if (currentActiveIndex !== -1) {
        const lineData = mergedLyrics[currentActiveIndex];
        const activeLine = document.getElementById(`line-${currentActiveIndex}`);
        if (activeLine) {
            const elapsed = audioPlayer.currentTime - lineData.time;
            const progress = Math.max(0, Math.min(1, elapsed / lineData.duration));
            
            const pEn = activeLine.querySelector('.lyric-en');
            const wordSpans = pEn.querySelectorAll('.word');
            if (wordSpans.length > 0) {
                const activeWordIndex = Math.floor(progress * wordSpans.length);
                wordSpans.forEach((span, i) => {
                    if (i <= activeWordIndex) span.classList.add('karaoke-highlight');
                    else span.classList.remove('karaoke-highlight');
                });
            }
        }
    }
});

progressBar.addEventListener('input', () => {
    isManualJump = true; // Arrastar a barra também burla o Modo Loop
    audioPlayer.currentTime = progressBar.value;
});

// Lógica TDAH: Cloze Test (Esconder Palavra Ativamente)
function processInteractiveLine(index, isInteractive) {
    const activeLine = document.getElementById(`line-${index}`);
    if (!activeLine) return;
    
    const pEn = activeLine.querySelector('.lyric-en');
    const originalText = mergedLyrics[index].enText;
    const words = originalText.trim().split(/\s+/);

    if (isInteractive && words.length > 0 && originalText.trim() !== '') {
        // Tenta esconder uma palavra maior que 2 letras
        let candidates = words.map((w, i) => ({word: w, index: i})).filter(w => w.word.replace(/[^a-zA-Z]/g, '').length > 2);
        if (candidates.length === 0) candidates = words.map((w, i) => ({word: w, index: i}));
        
        const toHide = candidates[Math.floor(Math.random() * candidates.length)].index;
        
        pEn.innerHTML = words.map((word, i) => {
            if (i === toHide) {
                return `<span class="word hidden-word" onclick="event.stopPropagation(); this.classList.add('revealed')">${word}</span>`;
            }
            return `<span class="word">${word}</span>`;
        }).join(' ');
        return;
    }
    
    pEn.innerHTML = words.map(word => `<span class="word">${word}</span>`).join(' ');
}

// Atalho de teclado (Barra de Espaço) para pausar/tocar a música
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault(); // Evita a rolagem da página
        togglePlayPause();
    }
});

// Lógica TDAH: Gamificação (Média Global ao Final da Música)
audioPlayer.addEventListener('ended', () => {
    // Garante que o Loop funcione até mesmo se for a última linha da música
    if (isLoopingLine && currentActiveIndex !== -1) {
        audioPlayer.currentTime = mergedLyrics[currentActiveIndex].time + 0.01;
        audioPlayer.play();
        if (isInteractiveMode) {
            processInteractiveLine(currentActiveIndex, isInteractiveMode);
        }
        return;
    }

    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    if (scoreHistory.length > 0) {
        const total = scoreHistory.reduce((acc, val) => acc + val, 0);
        const average = Math.round(total / scoreHistory.length);
        
        clearTimeout(feedbackTimeout);
        speechFeedback.classList.remove('hidden');
        speechText.innerHTML = "🏆 <b>Desempenho Final (Karaokê)</b>";
        speechScore.innerText = `Média: ${average}%`;
        speechScore.className = 'speech-score'; 
        if (average >= 80) speechScore.classList.add('score-good');
        else if (average >= 50) speechScore.classList.add('score-ok');
        else speechScore.classList.add('score-bad');
        
        feedbackTimeout = setTimeout(() => { speechFeedback.classList.add('hidden'); }, 10000); // Mostra por 10 segundos
    }
});
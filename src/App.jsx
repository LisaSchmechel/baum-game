import { useState, useEffect, useRef } from 'react';
import './App.css';
import storyData from './story.json';

// Import sounds
import buttonSoundFile from './assets/button.wav';
import faxSoundFile from './assets/fax.wav';
import stampSoundFile from './assets/stamping.m4a';
import bgMusicFile from './assets/Limit70.mp3';
import successSoundFile from './assets/mett.mp3';

function App() {
  const [currentNodeId, setCurrentNodeId] = useState('start');
  const [stress, setStress] = useState(20);
  const [coffee, setCoffee] = useState(50);
  const [inventory, setInventory] = useState([]);
  const [flags, setFlags] = useState([]);
  const [showImage, setShowImage] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  const bgMusicRef = useRef(null);
  const buttonSoundRef = useRef(null);
  const faxSoundRef = useRef(null);
  const stampSoundRef = useRef(null);
  const successSoundRef = useRef(null);

  const currentNode = storyData[currentNodeId];
  const isGameOver = stress >= 100;

  // Initialize audio
  useEffect(() => {
    bgMusicRef.current = new Audio(bgMusicFile);
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.05; // Very quiet background

    buttonSoundRef.current = new Audio(buttonSoundFile);
    buttonSoundRef.current.volume = 0.5;

    faxSoundRef.current = new Audio(faxSoundFile);
    faxSoundRef.current.volume = 0.7;

    stampSoundRef.current = new Audio(stampSoundFile);
    stampSoundRef.current.volume = 0.6;

    successSoundRef.current = new Audio(successSoundFile);
    successSoundRef.current.volume = 0.8;

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
    };
  }, []);

  // Handle mute toggle
  useEffect(() => {
    if (bgMusicRef.current) {
      if (isMuted) {
        bgMusicRef.current.pause();
      } else if (hasStarted && !isGameOver) {
        bgMusicRef.current.play().catch(e => console.log("Audio play blocked", e));
      }
    }
  }, [isMuted, hasStarted, isGameOver]);

  // Bureaucratic exhaustion
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasStarted && !isGameOver) {
        setCoffee((prev) => Math.max(0, prev - 1));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [hasStarted, isGameOver]);

  const playSound = (soundRef) => {
    if (!isMuted && soundRef.current) {
      soundRef.current.currentTime = 0;
      soundRef.current.play().catch(e => console.log("Audio play blocked", e));
    }
  };

  const handleChoice = (choice) => {
    // Start background music on first interaction
    if (!hasStarted) {
      setHasStarted(true);
      if (!isMuted && bgMusicRef.current) {
        bgMusicRef.current.play().catch(e => console.log("Audio play blocked", e));
      }
    }

    if (choice.reqItem && !inventory.includes(choice.reqItem)) {
      alert("Fehler: Erforderliches Formular / Gegenstand nicht vorhanden.");
      return;
    }

    // Determine if a special sound will be played
    const hasSpecialSound = choice.effects && choice.effects.playSound;

    // Play default button sound only if no special sound is triggered
    if (!hasSpecialSound) {
      playSound(buttonSoundRef);
    }

    // Apply effects
    if (choice.effects) {
      if (choice.effects.stress) {
        setStress(prev => Math.max(0, Math.min(100, prev + choice.effects.stress)));
      }
      if (choice.effects.coffee) setCoffee(prev => Math.max(0, Math.min(100, prev + choice.effects.coffee)));
      if (choice.effects.gainItem && !inventory.includes(choice.effects.gainItem)) {
        setInventory(prev => [...prev, choice.effects.gainItem]);
      }
      if (choice.effects.loseItem) {
        setInventory(prev => prev.filter(item => item !== choice.effects.loseItem));
      }
      if (choice.effects.setFlag && !flags.includes(choice.effects.setFlag)) {
        setFlags(prev => [...prev, choice.effects.setFlag]);
      }
      if (choice.effects.removeFlag) {
        setFlags(prev => prev.filter(flag => flag !== choice.effects.removeFlag));
      }
      if (choice.effects.playSound === "fax") {
        console.log("Playing fax sound");
        playSound(faxSoundRef);
      }
      if (choice.effects.playSound === "stamp") {
        console.log("Playing stamp sound");
        playSound(stampSoundRef);
      }
      if (choice.effects.playSound === "success") {
        console.log("Playing success sound");
        playSound(successSoundRef);
      }
    }

    // Move to next node
    if (choice.target) {
      setCurrentNodeId(choice.target);
    }
  };

  if (!currentNode) {
    return <div style={{color: 'red'}}>Fehler 404: Vorgang nicht gefunden.</div>;
  }

  // Filter choices based on required items
  const visibleChoices = currentNode.choices.filter(choice => {
    if (choice.showIfFlag && !flags.includes(choice.showIfFlag)) return false;
    if (choice.hideIfFlag && flags.includes(choice.hideIfFlag)) return false;
    return true;
  });

  return (
    <div className="fachverfahren-window window">
      <div className="title-bar">
        <div className="title-bar-text">B.A.U.M. - Fachverfahren v3.11 // {currentNode.title}</div>
        <div className="title-bar-controls">
          <button 
            className="mute-btn" 
            onClick={() => setIsMuted(!isMuted)}
          >
            [{isMuted ? 'Audio: AUS' : 'Audio: AN'}]
          </button>
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>
      
      <div className="window-body">
        {/* Sidebar */}
        <div className="sidebar">
          <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
            <legend style={{ fontWeight: 'bold', marginBottom: '5px' }}>Mitarbeiter-Status</legend>
            <div className="stat-box">
              <span className="stat-label">Bürokratie-Stress: {stress}%</span>
              <progress className={`progress-indicator ${stress > 80 ? 'danger' : ''}`} value={stress} max="100"></progress>
            </div>
            <div className="stat-box">
              <span className="stat-label">Kaffee-Pegel: {coffee}%</span>
              <progress className="progress-indicator" value={coffee} max="100"></progress>
            </div>
            <div style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
              Name: Sibylle Kornfeld<br/>
              ID: 47-11-0815
            </div>
          </fieldset>
          
          <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
            <legend style={{ fontWeight: 'bold', marginBottom: '5px' }}>System-Info</legend>
            <div style={{fontSize: '11px', color: '#888', fontStyle: 'italic'}}>
              Software-Status: Vibecoding (KI)
            </div>
          </fieldset>

          <fieldset className="inventory-box">
            <legend>Inventar / Anlagen</legend>
            <ul className="tree-view">
              {inventory.length === 0 ? (
                <li>(Leer)</li>
              ) : (
                inventory.map(item => (
                  <li key={item}>{item.toUpperCase()}</li>
                ))
              )}
            </ul>
          </fieldset>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          <div className="story-text-area">
            {currentNode.imageFile && (
              <div className="story-image-container">
                <img 
                  src={new URL(`./assets/${currentNode.imageFile}`, import.meta.url).href} 
                  alt={currentNode.imageDesc || "Anlage"}
                  className="story-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div style="color:#00ff00; padding: 20px; text-align: center; font-family: monospace;">[BILD FEHLT: ${currentNode.imageFile}]</div>`;
                  }}
                />
              </div>
            )}
            <div className="story-text-content">
              {currentNode.text}
            </div>
          </div>

          <div className="actions-area">
            <fieldset>
              <legend>Verfügbare Aktionen</legend>
              <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                {visibleChoices.map((choice, index) => {
                  const hasItem = !choice.reqItem || inventory.includes(choice.reqItem);
                  return (
                    <button 
                      key={index} 
                      className="action-btn"
                      disabled={!hasItem || isGameOver}
                      onClick={() => handleChoice(choice)}
                    >
                      {hasItem ? `> ${choice.label}` : `> [Gesperrt: ${choice.reqItem.toUpperCase()} benötigt]`}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      {/* Footer / Status Bar */}
      <div className="status-bar">
        <p className="status-bar-field" style={{width: '150px'}}>Verbindung: LOKAL</p>
        <p className="status-bar-field" style={{flex: 1}}>Systemstatus: Bereit.</p>
        <p 
          className="status-bar-field status-bar-link" 
          style={{width: '120px', textAlign: 'center'}}
          onClick={() => setShowCredits(true)}
        >
          Sound Attributions
        </p>
        <p className="status-bar-field" style={{width: '120px'}}>Nutzer: BAUM-01</p>
      </div>

      {/* Credits / Attributions Modal */}
      {showCredits && (
        <div className="window credits-modal">
          <div className="title-bar">
            <div className="title-bar-text">Lizenzen & Attributions</div>
            <div className="title-bar-controls">
              <button aria-label="Close" onClick={() => setShowCredits(false)}></button>
            </div>
          </div>
          <div className="window-body" style={{flexDirection: 'column'}}>
            <h4 style={{margin: '0 0 10px 0'}}>Audio Assets:</h4>
            <ul style={{fontSize: '12px', margin: 0, paddingLeft: '20px', lineHeight: '1.4'}}>
              <li style={{marginBottom: '5px'}}>
                <strong>stamping sound.m4a</strong> by trangphanzen512986<br/>
                <a href="https://freesound.org/s/529874/" target="_blank" rel="noreferrer">freesound.org/s/529874/</a><br/>
                License: Attribution NonCommercial 3.0
              </li>
              <li style={{marginBottom: '5px'}}>
                <strong>Fax.wav</strong> by LG<br/>
                <a href="https://freesound.org/s/15427/" target="_blank" rel="noreferrer">freesound.org/s/15427/</a><br/>
                License: Attribution 4.0
              </li>
              <li style={{marginBottom: '5px'}}>
                <strong>"Limit 70"</strong> Kevin MacLeod (incompetech.com)<br/>
                Licensed under Creative Commons: By Attribution 4.0 License<br/>
                <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">creativecommons.org/licenses/by/4.0/</a>
              </li>
              <li style={{marginBottom: '5px'}}>
                <strong>Success Fanfare Trumpets.mp3</strong> by FunWithSound<br/>
                <a href="https://freesound.org/s/456966/" target="_blank" rel="noreferrer">freesound.org/s/456966/</a><br/>
                License: Creative Commons 0
              </li>
            </ul>
            <div style={{marginTop: '15px', textAlign: 'right'}}>
              <button onClick={() => setShowCredits(false)}>Schließen</button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="window game-over-modal">
          <div className="title-bar">
            <div className="title-bar-text">KRITISCHER FEHLER: BURNOUT</div>
          </div>
          <div className="window-body" style={{flexDirection: 'column'}}>
            <p>Ihr Stresslevel hat 100% erreicht. Sie haben einen bürokratischen Burnout erlitten und wurden vom Amtsarzt in den unfreiwilligen Vorruhestand versetzt.</p>
            <button onClick={() => { 
              setStress(20); 
              setCoffee(50); 
              setInventory([]); 
              setFlags([]); 
              setHasStarted(false); 
              setCurrentNodeId('start'); 
              if (bgMusicRef.current) {
                bgMusicRef.current.pause();
                bgMusicRef.current.currentTime = 0;
              }
            }}>
              Neuen Antrag auf Einstellung stellen (Neustart)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import Head from 'next/head';
import SEO from '@/components/SEO';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Player interface
interface Player {
  name: string;
  position: string;
  age: number;
  team: string;
  allStar: number;
  worldSeries: number;
}

// Game state interface
interface GameState {
  mysteryPlayer: Player | null;
  guesses: Player[];
  gameOver: boolean;
  won: boolean;
  gaveUp: boolean;
  loading: boolean;
  maxGuesses: number;
}

// Server-side function to get the players from CSV
export async function getStaticProps() {
  const csvPath = path.join(process.cwd(), 'public', 'mlbwordle.csv');
  const csvData = fs.readFileSync(csvPath, 'utf8');
  
  // Parse CSV data
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  });
  
  // Transform the data to match our Player interface
  const players: Player[] = records.map((record: any) => ({
    name: record.Name,
    position: record.Position,
    age: parseInt(record.Age),
    team: record.Team,
    allStar: parseInt(record.AllStar),
    worldSeries: parseInt(record.WorldSeries)
  }));
  
  return {
    props: {
      players
    }
  };
}

export default function Home({ players }: { players: Player[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    mysteryPlayer: null,
    guesses: [],
    gameOver: false,
    won: false,
    gaveUp: false,
    loading: true,
    maxGuesses: 8
  });

  // Initialize game on component mount
  useEffect(() => {
    // Select a random player as the mystery player
    const randomIndex = Math.floor(Math.random() * players.length);
    setGameState(prev => ({
      ...prev,
      mysteryPlayer: players[randomIndex],
      loading: false
    }));
    
    // Check if user has played before
    const hasPlayed = localStorage.getItem('mlbWordleHasPlayed');
    if (hasPlayed) {
      setShowInstructions(false);
    } else {
      localStorage.setItem('mlbWordleHasPlayed', 'true');
    }
  }, [players]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length > 0) {
      const filtered = players.filter(player => 
        player.name.toLowerCase().includes(term.toLowerCase()) &&
        !gameState.guesses.some(guess => guess.name === player.name)
      );
      setFilteredPlayers(filtered);
    } else {
      setFilteredPlayers([]);
    }
  };

  // Handle player selection
  const selectPlayer = (player: Player) => {
    setSearchTerm('');
    setFilteredPlayers([]);
    
    // Check if player is already guessed
    if (gameState.guesses.some(guess => guess.name === player.name)) {
      return;
    }
    
    // Check if player is the mystery player
    const isCorrect = player.name === gameState.mysteryPlayer?.name;
    
    const newGuesses = [...gameState.guesses, player];
    
    setGameState(prev => ({
      ...prev,
      guesses: newGuesses,
      gameOver: isCorrect || newGuesses.length >= prev.maxGuesses,
      won: isCorrect
    }));
  };

  // Handle give up
  const handleGiveUp = () => {
    setGameState(prev => ({
      ...prev,
      gameOver: true,
      gaveUp: true
    }));
  };

  // Handle new game
  const handleNewGame = () => {
    const randomIndex = Math.floor(Math.random() * players.length);
    setGameState({
      mysteryPlayer: players[randomIndex],
      guesses: [],
      gameOver: false,
      won: false,
      gaveUp: false,
      loading: false,
      maxGuesses: 8
    });
  };

  // Check if a property matches the mystery player
  const isMatch = (guess: Player, property: keyof Player) => {
    if (!gameState.mysteryPlayer) return false;
    return guess[property] === gameState.mysteryPlayer[property];
  };

  // Get directional hint for numeric values
  const getDirectionalHint = (guess: Player, property: 'age' | 'allStar' | 'worldSeries') => {
    if (!gameState.mysteryPlayer) return null;
    
    if (guess[property] === gameState.mysteryPlayer[property]) {
      return null;
    }
    
    if (guess[property] < gameState.mysteryPlayer[property]) {
      return <span className={`directionalHint higher`}>↑</span>;
    } else {
      return <span className={`directionalHint lower`}>↓</span>;
    }
  };

  // Share results
  const shareResults = () => {
    if (!gameState.mysteryPlayer) return;
    
    let shareText = `MLB Wordle - ${gameState.mysteryPlayer.name}\n`;
    shareText += gameState.won ? `I got it in ${gameState.guesses.length}/${gameState.maxGuesses} guesses!` : 'I gave up!';
    shareText += '\n\n';
    
    // Add emoji grid representation of guesses
    gameState.guesses.forEach(guess => {
      const positionMatch = isMatch(guess, 'position') ? '🟩' : '⬜';
      const ageMatch = isMatch(guess, 'age') ? '🟩' : '⬜';
      const teamMatch = isMatch(guess, 'team') ? '🟩' : '⬜';
      const allStarMatch = isMatch(guess, 'allStar') ? '🟩' : '⬜';
      const worldSeriesMatch = isMatch(guess, 'worldSeries') ? '🟩' : '⬜';
      
      shareText += `${positionMatch}${ageMatch}${teamMatch}${allStarMatch}${worldSeriesMatch}\n`;
    });
    
    shareText += '\nPlay at: https://mlbwordle.me';
    
    navigator.clipboard.writeText(shareText)
      .then(() => alert('Results copied to clipboard!'))
      .catch(() => alert('Failed to copy results. Please try again.'));
  };

  if (gameState.loading) {
    return <div className="container">Loading...</div>;
  }

  // ... rest of the component remains the same
  return (
    <div className="container">
      <SEO/>

      <main className="main">
        <h1 className="title">MLB Wordle</h1>
        
        {showInstructions && (
          <div className="instructions">
            <p>Guess the mystery MLB player in {gameState.maxGuesses} tries or less!</p>
            <p>Green cells indicate a match with the mystery player.</p>
            <p>For numeric values, arrows indicate if the mystery player's value is higher (↑) or lower (↓).</p>
            <button 
              className="newGameButton" 
              onClick={() => setShowInstructions(false)}
            >
              Got it!
            </button>
          </div>
        )}
        
        {!gameState.gameOver ? (
          <>
            <div className="gameControls">
              <div className="searchContainer">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Start typing to guess a player..."
                  className="searchInput"
                />
                {filteredPlayers.length > 0 && (
                  <div className="dropdown">
                    {filteredPlayers.map((player) => (
                      <div 
                        key={player.name} 
                        className="dropdownItem"
                        onClick={() => selectPlayer(player)}
                      >
                        {player.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="buttonContainer">
                <button 
                  className="guessButton"
                  onClick={() => {
                    if (filteredPlayers.length > 0) {
                      selectPlayer(filteredPlayers[0]);
                    }
                  }}
                  disabled={filteredPlayers.length === 0}
                >
                  Guess
                </button>
                <button 
                  className="giveUpButton"
                  onClick={handleGiveUp}
                  disabled={gameState.guesses.length === 0}
                >
                  Give up
                </button>
              </div>
            </div>

            <div className="guessCount">
              Guesses: {gameState.guesses.length}/{gameState.maxGuesses}
            </div>
            <div className="parameterHeaders">
  <div className="parameterBadge positionBadge">Position</div>
  <div className="parameterBadge ageBadge">Age</div>
  <div className="parameterBadge teamBadge">Team</div>
  <div className="parameterBadge allStarBadge">All Star</div>
  <div className="parameterBadge worldSeriesBadge">World Series</div>
</div>

            <div className="guessesContainer">
              {gameState.guesses.length > 0 && (
                <table className="guessTable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Position</th>
                      <th>Age</th>
                      <th>Team</th>
                      <th>All Star</th>
                      <th>World Series</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameState.guesses.map((guess, index) => (
                      <tr key={index}>
                        <td>{guess.name}</td>
                        <td className={isMatch(guess, 'position') ? "match" : ''}>
                          {guess.position}
                        </td>
                        <td className={isMatch(guess, 'age') ? "match" : ''}>
                          {guess.age}
                          {!isMatch(guess, 'age') && getDirectionalHint(guess, 'age')}
                        </td>
                        <td className={isMatch(guess, 'team') ? "match" : ''}>
                          {guess.team}
                        </td>
                        <td className={isMatch(guess, 'allStar') ? "match" : ''}>
                          {guess.allStar}
                          {!isMatch(guess, 'allStar') && getDirectionalHint(guess, 'allStar')}
                        </td>
                        <td className={isMatch(guess, 'worldSeries') ? "match" : ''}>
                          {guess.worldSeries}
                          {!isMatch(guess, 'worldSeries') && getDirectionalHint(guess, 'worldSeries')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="gameOverContainer">
            <h2>The mystery player was:</h2>
            <h1 className="mysteryPlayerReveal">
              {gameState.mysteryPlayer?.name}
            </h1>
            
            {gameState.won ? (
              <p>You got it in {gameState.guesses.length} tries!</p>
            ) : (
              <p>You {gameState.gaveUp ? 'gave up' : 'ran out of guesses'} after {gameState.guesses.length} guesses.</p>
            )}
            
            <button 
              className="shareButton"
              onClick={shareResults}
            >
              Share Results
            </button>
            
            <button 
              className="newGameButton"
              onClick={handleNewGame}
            >
              New Game
            </button>
          </div>
        )}
      </main>
      <footer className="footer">
        <p>This site is not affiliated with Major League Baseball.</p>
      </footer>

      {/* Blog Section for SEO */}
      <section className="blog-section">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6 text-center">MLB Wordle Blog</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Daily Post */}
            <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">TODAY'S PUZZLE</span>
              <h3 className="text-xl font-bold mt-2 mb-3">
                <a href="/blog/todays-mlb-wordle-april-23-2025" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Today's MLB Wordle – April 23, 2025 (Hint & Stats)
                </a>
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Struggling with today's MLB Wordle? Here's a subtle hint: This All-Star has dominated the American League for years. Plus check out today's most common first guesses!
              </p>
              <a href="/blog/todays-mlb-wordle-april-23-2025" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Read more →
              </a>
            </article>
            
            {/* Evergreen Content */}
            <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <span className="text-xs text-green-600 dark:text-green-400 font-semibold">STRATEGY GUIDE</span>
              <h3 className="text-xl font-bold mt-2 mb-3">
                <a href="/blog/how-to-win-mlb-wordle-every-time" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  How to Win MLB Wordle Every Time: Pro Tips & Strategies
                </a>
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Master the daily MLB player guessing game with our expert strategies. Learn which players to guess first, how to use process of elimination, and win MLB Wordle in fewer guesses!
              </p>
              <a href="/blog/how-to-win-mlb-wordle-every-time" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Read more →
              </a>
            </article>
          </div>
          
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* More SEO-rich content blocks */}
            <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">
                <a href="/blog/mlb-wordle-vs-traditional-wordle" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  MLB Wordle vs Traditional Wordle: Key Differences Explained
                </a>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                How our baseball-themed word game puts a unique spin on the classic formula for MLB fans.
              </p>
            </article>
            
            <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">
                <a href="/blog/most-guessed-players-mlb-wordle" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  10 Most Guessed Players in MLB Wordle History
                </a>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                From Mike Trout to Shohei Ohtani: See which baseball stars everyone tries first in our daily baseball guessing game.
              </p>
            </article>
            
            <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">
                <a href="/blog/baseball-word-games-history" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  The History of Baseball Word Games and Puzzles
                </a>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                From baseball crosswords to modern MLB Wordle - explore how America's pastime has inspired word puzzles through the decades.
              </p>
            </article>
          </div>
          
          {/* Rich SEO footer with long-tail keywords */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-4 text-gray-700 dark:text-gray-300">Popular MLB Wordle Topics</h4>
            <div className="flex flex-wrap gap-2 text-sm">
              <a href="/tags/daily-baseball-puzzle" className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">daily baseball puzzle</a>
              <a href="/tags/mlb-word-game" className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">mlb word game</a>
              <a href="/tags/baseball-wordle" className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">baseball wordle</a>
              <a href="/tags/guess-the-mlb-player" className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">guess the mlb player</a>
              <a href="/tags/baseball-guessing-game" className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">baseball guessing game</a>
              <a href="/tags/mlb-player-quiz" className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">mlb player quiz</a>
              <a href="/tags/baseball-stats-game" className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">baseball stats game</a>
              <a href="/tags/daily-mlb-challenge" className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">daily mlb challenge</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

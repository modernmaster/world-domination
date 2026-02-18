import React, { useState, useEffect } from 'react';
import './App.css';
import { GameMap } from './GameMap';
import { Territory, Country, CountryStats } from './types';
import { Tooltip } from "react-tooltip";
import 'react-tooltip/dist/react-tooltip.css';
import { parsePath, areNeighbors, getMinDistance, Point } from './utils';
import { WelcomeScreen } from './WelcomeScreen';
import worldSvg from './world.svg'; // Import the SVG file

const generateRandomStats = (): CountryStats => ({
    population: Math.floor(Math.random() * 1000) + 100,
    technology: Math.floor(Math.random() * 100) + 10,
    fatigue: 0
});

const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

// 100 miles in SVG coordinates. This is an approximation.
const SEA_INVASION_RANGE = 8.5; 

function App() {
    const [territories, setTerritories] = useState<Territory[]>([]);
    const [countries, setCountries] = useState<Record<string, Country>>({});
    const [neighborGraph, setNeighborGraph] = useState<Record<string, string[]>>({});
    const [territoryPointsCache, setTerritoryPointsCache] = useState<Record<string, Point[]>>({});
    const [playerCountryId, setPlayerCountryId] = useState<string | null>(null);
    const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
    const [gameLog, setGameLog] = useState<string[]>(['Welcome to World Domination!']);
    const [isGameReady, setIsGameReady] = useState(false);

    useEffect(() => {
        const processMapData = (svgText: string) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, "image/svg+xml");
            const pathNodes = doc.querySelectorAll('path');
            const loadedTerritories: Territory[] = [];
            const newCountries: Record<string, Country> = {};
            const pointsCache: Record<string, Point[]> = {};

            pathNodes.forEach((node, index) => {
                const name = node.getAttribute('name') || node.getAttribute('class') || node.getAttribute('id') || `Unknown ${index}`;
                const id = node.getAttribute('id') || `territory-${index}`;
                const d = node.getAttribute('d') || "";
                
                if (d) {
                    loadedTerritories.push({ id, path: d, name, ownerId: name });
                    pointsCache[id] = parsePath(d);
                    if (!newCountries[name]) {
                        newCountries[name] = {
                            id: name,
                            name: name,
                            stats: generateRandomStats(),
                            color: getRandomColor()
                        };
                    }
                }
            });

            setTerritories(loadedTerritories);
            setCountries(newCountries);
            setTerritoryPointsCache(pointsCache);
            setGameLog(prev => [...prev, "Map data loaded. Calculating neighbors..."]);

            setTimeout(() => {
                const newNeighborGraph: Record<string, string[]> = {};
                const territoryIds = Object.keys(pointsCache);
                for (let i = 0; i < territoryIds.length; i++) {
                    const id1 = territoryIds[i];
                    newNeighborGraph[id1] = [];
                    for (let j = i + 1; j < territoryIds.length; j++) {
                        const id2 = territoryIds[j];
                        if (areNeighbors(pointsCache[id1], pointsCache[id2])) {
                            newNeighborGraph[id1].push(id2);
                            if (!newNeighborGraph[id2]) newNeighborGraph[id2] = [];
                            newNeighborGraph[id2].push(id1);
                        }
                    }
                }
                setNeighborGraph(newNeighborGraph);
                setIsGameReady(true);
                setGameLog(prev => [...prev, "Game ready. Please select your country."]);
            }, 100);
        };

        fetch(worldSvg)
            .then(response => response.text())
            .then(text => processMapData(text));

    }, []);

    const handleCountrySelect = (countryId: string) => {
        setPlayerCountryId(countryId);
        setGameLog(prev => [...prev, `You have chosen to play as ${countryId}. Select an enemy territory to attack.`]);
    };

    const handleTerritoryClick = (territory: Territory) => {
        setSelectedTerritory(territory);
    };

    const handleBattle = () => {
        if (!playerCountryId || !selectedTerritory) return;
        
        const attacker = countries[playerCountryId];
        const defender = countries[selectedTerritory.ownerId];

        if (attacker.id === defender.id) {
            setGameLog(prev => [...prev, "You cannot battle your own territory!"]);
            return;
        }

        const playerTerritories = territories.filter(t => t.ownerId === playerCountryId);
        const isLandNeighbor = playerTerritories.some(playerTerritory => 
            neighborGraph[playerTerritory.id]?.includes(selectedTerritory.id)
        );

        let seaInvasionDistance = -1;
        if (!isLandNeighbor) {
            let minDistance = Infinity;
            for (const playerTerritory of playerTerritories) {
                const dist = getMinDistance(territoryPointsCache[playerTerritory.id], territoryPointsCache[selectedTerritory.id]);
                if (dist < minDistance) {
                    minDistance = dist;
                }
            }
            if (minDistance <= SEA_INVASION_RANGE) {
                seaInvasionDistance = minDistance;
            } else {
                setGameLog(prev => [...prev, `You cannot attack ${selectedTerritory.name}. It is not a land neighbor and is out of sea invasion range.`]);
                setSelectedTerritory(null);
                return;
            }
        }

        const fatigueCost = seaInvasionDistance > -1 ? 5 + Math.round(seaInvasionDistance) : 5;
        const battleLogPrefix = seaInvasionDistance > -1 ? `(Sea Invasion) ` : ``;

        let totalPop = 0, totalTech = 0;
        Object.values(countries).forEach(c => {
            totalPop += c.stats.population;
            totalTech += c.stats.technology;
        });

        const calcScore = (c: Country) => {
            const popPct = (c.stats.population / totalPop) * 100;
            const techPct = (c.stats.technology / totalTech) * 100;
            return (popPct + techPct - c.stats.fatigue) * (Math.random() * 0.5 + 0.75);
        };

        if (calcScore(attacker) > calcScore(defender)) {
            setGameLog(prev => [...prev, `${battleLogPrefix}You won the battle for ${selectedTerritory.name}!`]);
            
            const newAttackerStats = {
                ...attacker.stats,
                population: attacker.stats.population + (defender.stats.population * 0.1),
                technology: attacker.stats.technology + (defender.stats.technology * 0.1),
                fatigue: attacker.stats.fatigue + (seaInvasionDistance > -1 ? 10 + Math.round(seaInvasionDistance) : 10)
            };

            const updatedTerritories = territories.map(t => 
                t.id === selectedTerritory.id ? { ...t, ownerId: attacker.id } : t
            );
            setTerritories(updatedTerritories);
            
            const defenderTerritoriesLeft = updatedTerritories.some(t => t.ownerId === defender.id);
            const newCountries = { ...countries, [attacker.id]: { ...attacker, stats: newAttackerStats } };

            if (!defenderTerritoriesLeft) {
                 setGameLog(prev => [...prev, `${defender.name} has been eliminated!`]);
                 delete newCountries[defender.id];
            }
            setCountries(newCountries);
        } else {
            setGameLog(prev => [...prev, `${battleLogPrefix}You lost the battle against ${defender.name}!`]);
            const newAttackerStats = { ...attacker.stats, fatigue: attacker.stats.fatigue + fatigueCost };
            
            const attackerTerritories = territories.filter(t => t.ownerId === attacker.id);
            if (attackerTerritories.length > 0) {
                const lostTerritory = attackerTerritories[Math.floor(Math.random() * attackerTerritories.length)];
                setGameLog(prev => [...prev, `You have lost ${lostTerritory.name} to ${defender.name}!`]);

                const updatedTerritories = territories.map(t => 
                    t.id === lostTerritory.id ? { ...t, ownerId: defender.id } : t
                );
                setTerritories(updatedTerritories);
                
                if (attackerTerritories.length === 1) { 
                     setGameLog(prev => [...prev, `You have been eliminated! Game Over.`]);
                     const newCountries = { ...countries };
                     delete newCountries[attacker.id];
                     setCountries(newCountries);
                     setPlayerCountryId(null);
                } else {
                    setCountries(prev => ({...prev, [attacker.id]: {...attacker, stats: newAttackerStats}}));
                }
            }
        }
        setSelectedTerritory(null);
    };

    if (!playerCountryId) {
        return <WelcomeScreen 
            countries={Object.values(countries)} 
            onSelectCountry={handleCountrySelect} 
            isGameReady={isGameReady}
        />;
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>World Domination</h1>
                {countries[playerCountryId] && (
                    <div>
                        <h2>Playing as: {countries[playerCountryId].name}</h2>
                        <div className="stats">
                            <span>Pop: {countries[playerCountryId].stats.population.toFixed(0)}</span> | 
                            <span> Tech: {countries[playerCountryId].stats.technology.toFixed(0)}</span> | 
                            <span> Fatigue: {countries[playerCountryId].stats.fatigue}</span>
                        </div>
                    </div>
                )}
            </header>
            <div className="game-container">
                <div className="map-container">
                    <GameMap 
                        territories={territories} 
                        getCountryColor={(id) => countries[id]?.color || '#ccc'}
                        onTerritoryClick={handleTerritoryClick}
                    />
                    <Tooltip id="my-tooltip" />
                </div>
                <div className="sidebar">
                    <h3>Game Log</h3>
                    <div className="log">
                        {gameLog.slice(-20).map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                    {selectedTerritory && selectedTerritory.ownerId !== playerCountryId && (
                        <div className="action-panel">
                            <h4>Selected: {selectedTerritory.name}</h4>
                            <p>Owner: {selectedTerritory.ownerId}</p>
                            <button onClick={handleBattle}>Battle!</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;

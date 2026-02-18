import React, { useState, useEffect } from 'react';
import { Country } from './types';
import './App.css';

interface WelcomeScreenProps {
    countries: Country[];
    onSelectCountry: (countryId: string) => void;
    isGameReady: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ countries, onSelectCountry, isGameReady }) => {
    const [selectedCountryId, setSelectedCountryId] = useState<string>('');

    useEffect(() => {
        // Set a default selection when countries load
        if (isGameReady && countries.length > 0) {
            const sortedCountries = countries.sort((a, b) => a.name.localeCompare(b.name));
            setSelectedCountryId(sortedCountries[0].id);
        }
    }, [isGameReady, countries]);

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCountryId(event.target.value);
    };

    const handleStart = () => {
        if (selectedCountryId) {
            onSelectCountry(selectedCountryId);
        }
    };

    const selectedCountry = countries.find(c => c.id === selectedCountryId);

    return (
        <div className="welcome-screen">
            <h1>Welcome to World Domination</h1>
            
            {!isGameReady ? (
                <p>Loading game data, please wait...</p>
            ) : (
                <>
                    <p>Select your country to begin:</p>
                    <div className="country-select-container">
                        <select className="country-dropdown" value={selectedCountryId} onChange={handleSelectChange}>
                            {countries.sort((a, b) => a.name.localeCompare(b.name)).map(country => (
                                <option key={country.id} value={country.id}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                        <button onClick={handleStart} disabled={!selectedCountryId}>
                            Start Game
                        </button>
                    </div>
                    {selectedCountry && (
                        <div className="selected-country-details">
                            <h3>{selectedCountry.name}</h3>
                            <div className="stats">
                                <span>Pop: {selectedCountry.stats.population}</span> | 
                                <span> Tech: {selectedCountry.stats.technology}</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export interface CountryStats {
    population: number;
    technology: number;
    fatigue: number;
}

export interface Territory {
    id: string;
    path: string;
    name: string;
    ownerId: string; // ID of the Country that owns this
}

export interface Country {
    id: string;
    name: string;
    stats: CountryStats;
    color: string;
}

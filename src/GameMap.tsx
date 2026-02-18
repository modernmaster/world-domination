import React, { useState, useRef } from 'react';
import { Territory } from './types';

interface GameMapProps {
    territories: Territory[];
    getCountryColor: (ownerId: string) => string;
    onTerritoryClick: (territory: Territory) => void;
}

export const GameMap: React.FC<GameMapProps> = ({ territories, getCountryColor, onTerritoryClick }) => {
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePosition = useRef({ x: 0, y: 0 });
    const dragStart = useRef({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);

    const handleWheel = (e: React.WheelEvent) => {
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.5, transform.k + scaleAmount), 10);
        
        setTransform(prev => ({ ...prev, k: newScale }));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
        dragStart.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !svgRef.current) return;
        
        const { width } = svgRef.current.getBoundingClientRect();
        const svgWidth = 2000; 
        const scaleFactor = svgWidth / width;

        const dx = (e.clientX - lastMousePosition.current.x) * scaleFactor;
        const dy = (e.clientY - lastMousePosition.current.y) * scaleFactor;
        
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
        
        setTransform(prev => ({ 
            ...prev, 
            x: prev.x + dx / prev.k, 
            y: prev.y + dy / prev.k 
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleClick = (t: Territory, e: React.MouseEvent) => {
        const dist = Math.sqrt(
            Math.pow(e.clientX - dragStart.current.x, 2) + 
            Math.pow(e.clientY - dragStart.current.y, 2)
        );
        if (dist < 5) { // Threshold for click vs drag
            onTerritoryClick(t);
        }
    };

    return (
        <div 
            style={{ width: '100%', height: '100%', overflow: 'hidden', border: '1px solid #ccc', position: 'relative' }}
            onWheel={handleWheel}
        >
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 100, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button onClick={() => setTransform(prev => ({ ...prev, k: Math.min(prev.k * 1.2, 10) }))}>+</button>
                <button onClick={() => setTransform(prev => ({ ...prev, k: Math.max(prev.k / 1.2, 0.5) }))}>-</button>
                <button onClick={() => setTransform({ x: 0, y: 0, k: 1 })}>Reset</button>
            </div>
            <svg 
                ref={svgRef}
                viewBox="0 0 2000 857" 
                style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <g transform={`scale(${transform.k}) translate(${transform.x}, ${transform.y})`}>
                    {territories.map((t) => (
                        <path
                            key={t.id}
                            d={t.path}
                            fill={getCountryColor(t.ownerId)}
                            stroke="black"
                            strokeWidth={0.5 / transform.k}
                            onClick={(e) => handleClick(t, e)}
                            style={{ cursor: 'pointer', transition: 'fill 0.3s' }}
                            data-tooltip-id="my-tooltip"
                            data-tooltip-content={`${t.name} (Owner: ${t.ownerId})`}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.8';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1';
                            }}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
};

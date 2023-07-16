import React, {memo} from "react";
import {
    ZoomableGroup,
    ComposableMap,
    Geographies,
    Geography
} from "react-simple-maps";

// const geoUrl =
//     "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

interface MapChartProps {
    setTooltipContent(arg0: string): void;
}


const MapChart = (mapChartProps: MapChartProps) => {
    return (
        <div data-tip="country-info">
            <ComposableMap>
                <ZoomableGroup>
                    <Geographies geography="https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json">
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    data-tooltip-id="my-tooltip"
                                    key={geo.rsmKey}
                                    geography={geo}
                                    onMouseEnter={() => {
                                        console.log(`${geo.properties.name}`)
                                        mapChartProps.setTooltipContent(`${geo.properties.name}`);
                                    }}
                                    onMouseLeave={() => {
                                        console.log(`${geo.properties.name}`)
                                        mapChartProps.setTooltipContent("");
                                    }}
                                    style={{
                                        default: {
                                            fill: "#D6D6DA",
                                            outline: "none"
                                        },
                                        hover: {
                                            fill: "#F53",
                                            outline: "none"
                                        },
                                        pressed: {
                                            fill: "#E42",
                                            outline: "none"
                                        }
                                    }}
                                />
                            ))
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
        </div>
    );
};

export default memo(MapChart);
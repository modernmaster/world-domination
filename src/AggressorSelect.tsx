import React, {ChangeEvent, useEffect, useState} from 'react';
import Countries from "./Countries";

//change props to interface
export function AggressorSelect(props: any) {

    const [aggressor, setAggressor] = useState({...props.agressor});

    useEffect(() => {
        setAggressor(props.aggressor);
    }, [props.aggressor])

    const CountriesList = () => {

        return <select onChange={handleChange}>{Countries.map((x) => <option
            value={x.Key}>{x.Value}</option>)}</select>
    }

    function handleChange(event: ChangeEvent<HTMLSelectElement>) {
        console.log(event.currentTarget.value);
        setAggressor(event.currentTarget.value);
    }

    return (
        <section>
            <header>{aggressor}</header>
            <CountriesList/>
        </section>);
}

import React, {ChangeEvent, MouseEventHandler, useEffect} from 'react';

function AggressorStatus(props: any) {

    function handleClick() {
        props.aggressor = "";
    }


    return ( <section>
        <header>USA</header>
        <details>
            <p>Population: 100</p>
            <p>Technology: 100</p>
            <p>Fatigue: 100</p>
        </details>
        <button onClick={handleClick}>Choose new aggressor</button>
    </section>);
}

export default AggressorStatus;
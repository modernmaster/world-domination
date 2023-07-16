import React, {useState} from 'react';
import './App.css';
import MapChart from "./MapChart";
import { Tooltip as ReactTooltip } from "react-tooltip";

function App() {
    const [content, setContent] = useState("");
    return (
    <div className="App">
      <article>
          <MapChart setTooltipContent={setContent} />
          <ReactTooltip id="my-tooltip" variant="info" place="bottom"><p>Country: {content}</p><p>Click here for battle!  Make clickable in react-tooltip</p></ReactTooltip>
      </article>
    </div>
  );
}

export default App;

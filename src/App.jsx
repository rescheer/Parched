import axios from 'axios';
import { useEffect, useId, useState } from 'react';
import { createGrid } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import * as Definitions from './config/definitions';
import AuthProvider from './class/AuthProvider';
import './App.css';

const apiUrl =
  'https://poachedjobs.com/api/v1/jobs?category=51&distance=15&exclude%5B%5D=content&isLikelyFraud=false&latitude=45.533467&limit=999&locationLabel=Portland%2C%20OR&longitude=-122.650095&status=publish';
const auth = new AuthProvider();

/**
 * Asynchronously returns jobs data from the Poached API. Returns undefined on failure.
 */
async function getJobsData() {
  const options = {
    headers: {
      Authorization: 'Bearer ' + auth.token,
    },
  };

  const response = await axios.get(apiUrl, options);

  if (response.data) {
    return response.data;
  }
  return undefined;
}

function toReadableTimer(timeLeft) {
  let sliceBegin = 14;
  let suffix = ``;
  if (timeLeft <= 60) {
    sliceBegin = 17;
    suffix = `s`;
  }
  return new Date(timeLeft * 1000).toISOString().slice(sliceBegin, 19) + suffix;
}

function App() {
  const refreshButtonId = useId();
  const locationId = useId();

  // Main States
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [buttonText, setButtonText] = useState('Get Jobs');
  const [error, setError] = useState('');
  const [grid, setGrid] = useState(null);
  const [mobile, setMobile] = useState(window.innerWidth < 1000);

  // Settings States
  const [location, setLocation] = useState(``);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(1);

  // Auto Refresh States
  const [timer, setTimer] = useState(0);

  const intervalValues = [
    { sec: 30, readable: '30 sec' },
    { sec: 60 - 1, readable: '1 min' },
    { sec: 10 * 60, readable: '10 min' },
    { sec: 30 * 60, readable: '30 min' },
    { sec: 60 * 60 - 1, readable: '1 hour' },
  ];

  // Hooks
  // After initial render only
  useEffect(() => {
    // Set up timer for auto refresh
    const intervalId = setInterval(() => {
      setTimer((prevTimer) => prevTimer + 1);
    }, 1000);

    // Check for stored values from a previous session
    const keys = [
      { key: 'autoRefresh', value: `` },
      { key: 'interval', value: `` },
      { key: 'location', value: `` },
    ];
    keys.forEach((item) => {
      if (localStorage.getItem(item.key)) {
        const value = localStorage.getItem(item.key);
        switch (item.key) {
          case 'autoRefresh':
            if (value === 'true') {
              setAutoRefreshEnabled(true);
            } else if (value === 'false') {
              setAutoRefreshEnabled(false);
            }
            break;
          case 'interval':
            setAutoRefreshInterval(value);
            break;
          case 'location':
            setLocation(value);
            break;
          default:
            break;
        }
      }
    });

    // Auth
    auth.init();

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Resize listener
    function resize() {
      setTimeout(function () {
        if (grid) {
          if (window.innerWidth < 1000) {
            if (!mobile) {
              grid.setGridOption('columnDefs', Definitions.mobileColumn);
              setMobile(true);
            }
          } else {
            if (mobile) {
              grid.setGridOption('columnDefs', Definitions.nonMobileColumn);
              setMobile(false);
            }
          }
        }
      });
    }

    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, [grid, mobile]);

  // On change in autoRefreshEnabled
  useEffect(() => {
    if (autoRefreshEnabled) {
      localStorage.setItem('autoRefresh', autoRefreshEnabled);
      setTimer(0);
    }
  }, [autoRefreshEnabled]);

  // On change in location
  useEffect(() => {
    if (location && grid) {
      grid.setGridOption('context', { homeLoc: location });
    }
  }, [location, grid]);

  const getContext = () => {
    const location = document.getElementById(locationId).value;

    return {
      homeLoc: location,
    };
  };

  const refresh = () => {
    const refreshButton = document.getElementById(refreshButtonId);
    if (!refreshButton.disabled) {
      setButtonText('Getting jobs...');
      refreshButton.disabled = true;

      getJobsData()
        .then((rawData) => {
          // Perform filtering here
          setButtonText('Refresh');
          setError('');
          if (!grid) {
            // Initialization
            setGrid(initGrid(rawData.jobs));
          } else {
            grid.setGridOption('rowData', rawData.jobs);
          }
        })
        .catch((error) => {
          auth.init();
          setButtonText('Retry');
          setError(error);
          console.log(error);
        })
        .finally(() => {
          refreshButton.disabled = false;
          setTimer(0);
        });
    }
  };

  function initGrid(data) {
    let columnDefs;
    if (window.innerWidth < 1000) {
      columnDefs = Definitions.mobileColumn;
    } else {
      columnDefs = Definitions.nonMobileColumn;
    }
    const gridOptions = {
      rowData: data,
      context: getContext(),
      resetRowDataOnUpdate: true,
      columnDefs: columnDefs,
    };

    return createGrid(document.getElementById('dataGrid'), gridOptions);
  }

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };

  if (autoRefreshEnabled && timer >= intervalValues[autoRefreshInterval].sec) {
    setTimer(0);
    refresh();
  }

  // JSX
  const gridHeight = window.innerHeight - 110;
  const gridPage = (
    <div
      id="dataGrid"
      className="ag-theme-quartz-dark"
      style={{ height: gridHeight }}
    />
  );

  const settingsPage = (
    <div>
      <h2>Settings</h2>
      <h3>Location</h3>
      <label>Latitude, Longitude: </label>
      <input
        id={locationId}
        defaultValue={location}
        onChange={(e) => {
          setLocation(e.target.value);
          localStorage.setItem('location', e.target.value);
        }}
        style={{ width: 270 }}
      />
      <hr />
      <h3>Auto Refresh</h3>
      <input
        type="checkbox"
        checked={autoRefreshEnabled}
        onChange={(e) => {
          setTimer(0);
          setAutoRefreshEnabled(e.target.checked);
          localStorage.setItem('autoRefresh', e.target.checked);
        }}
      />
      Auto Refresh <br />
      <label>Interval: </label>
      <input
        type="range"
        min={0}
        max={4}
        step={1}
        value={autoRefreshInterval}
        style={{ width: 150 }}
        list="ticks"
        onChange={(e) => {
          setAutoRefreshInterval(e.target.value);
          localStorage.setItem('interval', e.target.value);
        }}
      />
      <br />
      {intervalValues[autoRefreshInterval].readable}
      <datalist id="ticks">
        <option>0</option>
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>4</option>
      </datalist>
    </div>
  );

  return (
    <>
      <nav>
        <div className="title">
          Parched<sup>v1.1.0</sup>
        </div>
      </nav>
      <div className="flex-container">
        <div className="flex-item flex-item-left">
          <div className="countdown">
            {autoRefreshEnabled
              ? `Auto refresh in ${toReadableTimer(
                  intervalValues[autoRefreshInterval].sec - timer
                )}`
              : ``}
          </div>
          <button
            type="button"
            onClick={refresh}
            style={{ width: 200 }}
            id={refreshButtonId}
          >
            {buttonText}
          </button>
          <div className="error">{error.message}</div>
        </div>
        <div className="flex-item flex-item-right">
          <button type="button" onClick={toggleSettings}>
            <span className="material-icons" style={{ fontSize: 25 }}>
              {settingsOpen ? 'home' : 'settings'}
            </span>
          </button>
        </div>
      </div>
      <div style={{ display: settingsOpen ? 'none' : 'block' }}>{gridPage}</div>
      <div style={{ display: !settingsOpen ? 'none' : 'block' }}>
        {settingsPage}
      </div>
    </>
  );
}

export default App;

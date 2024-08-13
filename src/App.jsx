import axios from 'axios';
import { useEffect, useId, useState } from 'react';
import { createGrid } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import LogoRenderer from './renderer/LogoRenderer';
import TitleRenderer from './renderer/TitleRenderer';
import CompanyRenderer from './renderer/CompanyRenderer';
import LocationRenderer from './renderer/LocationRenderer';
import getDistanceInMiles from './lib/getDistanceInMiles';
import './App.css';

const apiUrl =
  'https://poachedjobs.com/api/v1/jobs?backfill=true&category=51&distance=15&exclude%5B%5D=content&isLikelyFraud=false&latitude=45.533467&limit=999&locationLabel=Portland%2C%20OR&longitude=-122.650095&page=1&sort=score%20DESC&status=publish&weightedSearch=true';

/**
 * Asynchronously returns jobs data from the Poached API. Returns undefined on failure.
 */
async function getJobsData(token) {
  const options = {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  };

  const response = await axios.get(apiUrl, options);

  if (response.data) {
    return response.data;
  }
  return undefined;
}

function timeSinceString(time) {
  const periods = {
    month: 30 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
  };

  const diff = Date.now() - time;

  if (diff > periods.month) {
    // it was at least a month ago
    return Math.floor(diff / periods.month) + 'mo ago';
  } else if (diff > periods.week) {
    return Math.floor(diff / periods.week) + 'w ago';
  } else if (diff > periods.day) {
    return Math.floor(diff / periods.day) + 'd ago';
  } else if (diff > periods.hour) {
    return Math.floor(diff / periods.hour) + 'h ago';
  } else if (diff > periods.minute) {
    return Math.floor(diff / periods.minute) + 'm ago';
  }
  return 'Just now';
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
  const tokenId = useId();
  const refreshButtonId = useId();
  const locationId = useId();

  // Main States
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [buttonText, setButtonText] = useState('Get Jobs');
  const [error, setError] = useState('');
  const [grid, setGrid] = useState(null);

  // Settings States
  const [token, setToken] = useState('');
  const [loc, setLocation] = useState(``);
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
      { key: 'token', value: `` },
      { key: 'autoRefresh', value: `` },
      { key: 'interval', value: `` },
      { key: 'location', value: `` },
    ];
    keys.forEach((item) => {
      if (localStorage.getItem(item.key)) {
        const value = localStorage.getItem(item.key);
        switch (item.key) {
          case 'token':
            setToken(value);
            break;
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

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // On change in autoRefreshEnabled
  useEffect(() => {
    if (autoRefreshEnabled) {
      localStorage.setItem('autoRefresh', autoRefreshEnabled);
      setTimer(0);
    }
  }, [autoRefreshEnabled]);

  const refresh = () => {
    const tokenField = document.getElementById(tokenId);
    const refreshButton = document.getElementById(refreshButtonId);
    const val = tokenField.value;
    if (!refreshButton.disabled) {
      if (val && val.length === 1259) {
        setToken(tokenField.value);
        localStorage.setItem('token', tokenField.value);
        setButtonText('Getting jobs...');
        refreshButton.disabled = true;

        getJobsData(tokenField.value)
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
            setButtonText('Retry');
            setError(error);
          })
          .finally(() => {
            refreshButton.disabled = false;
            setTimer(0);
          });
      } else {
        setError('Invalid auth token.');
        refreshButton.disabled = false;
      }
    }
  };

  function getDistanceFromMe(lat, long) {
    const loc = document.getElementById(locationId).value;
    if (loc) {
      const splitLoc = loc.split(',');
      let result = 'N/A';
      const localLat = +splitLoc[0].trim();
      const localLong = +splitLoc[1].trim();
      if (lat && long) {
        result = getDistanceInMiles(lat, long, localLat, localLong);
      }
      return result;
    } else {
      return 'N/A';
    }
  }

  function initGrid(data) {
    const gridOptions = {
      rowData: data,
      resetRowDataOnUpdate: true,
      columnDefs: [
        {
          field: 'logoUrl',
          headerName: 'Logo',
          cellRenderer: LogoRenderer,
          cellClass: 'imgColumn',
          maxWidth: 100,
        },
        {
          field: 'company',
          cellRenderer: CompanyRenderer,
          flex: 3,
          filter: true,
          cellStyle: { cursor: 'pointer' },
          onCellClicked: (e) => window.open(e.node.data.url, '_blank'),
        },
        {
          field: 'title',
          headerName: 'Job Title',
          valueFormatter: (node) =>
            node.value ? node.value : 'Unspecified Title',
          cellRenderer: TitleRenderer,
          flex: 3,
          filter: true,
        },
        {
          field: 'postDate',
          flex: 1,
          sort: 'desc',
          headerName: 'Posted',
          valueGetter: (node) => timeSinceString(new Date(node.data.postDate)),
          comparator: (valueA, valueB, nodeA, nodeB) => {
            const timeA = new Date(nodeA.data.postDate).getTime();
            const timeB = new Date(nodeB.data.postDate).getTime();

            if (timeA < timeB) {
              return -1; // dateA comes before dateB
            } else if (timeA > timeB) {
              return 1; // dateA comes after dateB
            } else {
              return 0; // dates are equal
            }
          },
        },
        {
          field: 'typeName',
          headerName: 'Job Type',
          valueFormatter: (node) => (node.value ? node.value : 'Unspecified'),
          flex: 1,
          filter: true,
        },
        {
          field: 'city',
          cellRenderer: LocationRenderer,
          flex: 1,
          filter: true,
        },
        {
          field: 'distance',
          valueGetter: (node) =>
            getDistanceFromMe(node.data.latitude, node.data.longitude),
          valueFormatter: (node) =>
            typeof node.value === 'string'
              ? node.value
              : `${+node.value.toFixed(1)} mi`,
          flex: 1,
        },
        {
          field: 'jobViews',
          valueFormatter: (node) => (node.value ? node.value : 'Unknown'),
          flex: 1,
          headerName: 'Views',
        },
      ],
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
  const gridPage = (
    <div
      id="dataGrid"
      className="ag-theme-quartz-dark"
      style={{ height: 850 }}
    />
  );

  const settingsPage = (
    <div>
      <h2>Settings</h2>
      <h3>Poached Token</h3>
      <textarea
        id={tokenId}
        defaultValue={token}
        style={{ width: '50%', height: 100, minWidth: 300 }}
      />
      <hr />
      <h3>Location</h3>
      <label>Latitude, Longitude: </label>
      <input
        id={locationId}
        defaultValue={loc}
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
      <div className="flex-container">
        <div className="flex-item flex-item-left">
          <h1>
            Parched<sup> v1.0.0</sup>
          </h1>
          <sup>by robby scheer</sup>
        </div>
        <div className="flex-item">
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

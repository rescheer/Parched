import { useEffect, useId, useState } from 'react';
import { createGrid } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import * as Definitions from './config/definitions';
import AuthProvider from './class/AuthProvider';
import './App.css';

const appVersion = `v1.2.0`;

const defaultParams = {
  category: 51,
  distance: 15,
  isLikelyFraud: false,
  latitude: 45.533467,
  longitude: -122.650095,
  locationLabel: 'Portland, OR',
  status: 'publish',
};
const categories = [
  { name: 'Bar', code: 51 },
  { name: 'Management', code: 52 },
  { name: 'Floor', code: 54 },
];
const apiBaseUrl = 'https://poachedjobs.com/api/v1/jobs?';
const auth = new AuthProvider();

/**
 * Asynchronously returns jobs data from the Poached API. Returns undefined on failure.
 */
async function getJobsData(token, params = {}) {
  const options = {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + token,
    },
  };

  // Encode API URL
  const paramData = Object.assign(defaultParams, params);
  const searchParams = new URLSearchParams();
  Object.entries(paramData).forEach(([key, value]) => {
    searchParams.append(key, value);
  });
  const finalAPIUrl = apiBaseUrl + searchParams.toString();

  return await fetch(finalAPIUrl, options).then((stream) => {
    if (!stream.ok) {
      throw new Error(`HTTP error! Status Code: ${stream.status}`);
    }

    return stream.json();
  });
}

function toReadableTimer(timeLeft) {
  let sliceBegin = 14;
  let suffix = ``;
  if (timeLeft <= 60) {
    if (timeLeft <= 9) {
      sliceBegin = 18;
    } else {
      sliceBegin = 17;
    }
    suffix = `s`;
  }
  return new Date(timeLeft * 1000).toISOString().slice(sliceBegin, 19) + suffix;
}

function App() {
  const refreshButtonId = useId();
  const locationId = useId();
  const categoryId = useId();

  // Main States
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [buttonText, setButtonText] = useState('Get Jobs');
  const [error, setError] = useState('');
  const [grid, setGrid] = useState(null);
  const [mobile, setMobile] = useState(window.innerWidth < 1000);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Settings States
  const [category, setCategory] = useState(51);
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
  // Set up timer for auto refresh
  // Run once on mount
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimer((prevTimer) => prevTimer + 1);
    }, 1000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Checks for stored values from a previous session
  // Run once on mount
  useEffect(() => {
    const keys = [
      { key: 'autoRefresh', value: `` },
      { key: 'interval', value: `` },
      { key: 'location', value: `` },
      { key: 'category', value: `` },
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
          case 'category':
            setCategory(value);
            break;
          default:
            break;
        }
      }
    });
  }, []);

  // Listens for resize events and updates grid display mode
  // Run on change in grid or mobile states
  useEffect(() => {
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

  // Resets elapsed time when autoRefreshEnabled state changes
  // Runs on change in autoRefreshEnabled
  useEffect(() => {
    if (autoRefreshEnabled) {
      localStorage.setItem('autoRefresh', autoRefreshEnabled);
      setTimer(0);
    }
  }, [autoRefreshEnabled]);

  // Updates grid context object when location changes
  // Runs on change in location
  useEffect(() => {
    if (location && grid) {
      grid.setGridOption('context', { homeLoc: location });
    }
  }, [location, grid]);

  const getGridContext = () => {
    const location = document.getElementById(locationId).value;

    return {
      homeLoc: location,
    };
  };

  const refresh = async () => {
    let useToken = '';
    const refreshButton = document.getElementById(refreshButtonId);
    if (!refreshButton.disabled) {
      setButtonText('Getting jobs...');
      refreshButton.disabled = true;

      // Check for a stored token
      if (!auth.token) {
        // Get a new token
        useToken = await auth.refreshToken();
      } else {
        useToken = auth.token;
      }

      await getJobsData(useToken, { category: category })
        .then((rawData) => {
          // Reset failed attempts
          if (failedAttempts > 0) {
            console.log(
              `Token restored after ${failedAttempts} failed attempt(s).`
            );
            setFailedAttempts(0);
          }
          // Filtering
          // Remove "Shift" types
          rawData.jobs.forEach((job, index) => {
            if (job.typeName == 'Shift') {
              rawData.jobs.splice(index, 1);
            }
            if (job.id == '2542832') {
              console.log(job);
            }
          });

          setButtonText('Refresh');
          setError('');
          if (!grid) {
            // Initialization
            setGrid(initGrid(rawData.jobs));
          } else {
            grid.setGridOption('rowData', rawData.jobs);
          }
          setTimer(0);
        })
        .catch((error) => {
          if (autoRefreshEnabled) {
            // Update failed attempts
            setFailedAttempts(failedAttempts + 1);
            if (failedAttempts + 1 <= 3) {
              // Retry in 3 seconds
              const interval = intervalValues[autoRefreshInterval].sec;
              setTimer(interval - 3);
              setError(
                `Token error, retrying in 3 seconds (${
                  failedAttempts + 1
                } of 3)`
              );
              auth.refreshToken();
            } else {
              setError(`Too many failed attempts!`);
              setFailedAttempts(0);
              setAutoRefreshEnabled(false);
            }
          } else {
            auth.clearToken();
            setError(error.message);
          }
          setButtonText('Retry');
        })
        .finally(() => {
          refreshButton.disabled = false;
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
      context: getGridContext(),
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
  const gridHeight = window.innerHeight - 115;
  const gridPage = (
    <div
      id="dataGrid"
      className="ag-theme-quartz-dark"
      style={{ height: gridHeight }}
    />
  );

  const settingsPage = (
    <div className="settingsRoot">
      <div className="settings">
        <h2>Settings</h2>
        <h3>Job Category</h3>
        <select
          id={categoryId}
          onChange={(e) => {
            setCategory(e.target.value);
            localStorage.setItem('category', e.target.value);
          }}
        >
          {categories.map((item) => (
            <option key={item.name + item.code} value={item.code} selected={item.code == category}>
              {item.name}
            </option>
          ))}
        </select>
        <hr />
        <h3>Location</h3>
        <label>
          Latitude, Longitude:
          <br />
          <input
            id={locationId}
            defaultValue={location}
            onChange={(e) => {
              setLocation(e.target.value);
              localStorage.setItem('location', e.target.value);
            }}
            style={{ width: 270 }}
          />
        </label>
        <hr />
        <h3>Auto Refresh</h3>
        <input
          name="autoRefresh"
          type="checkbox"
          checked={autoRefreshEnabled}
          onChange={(e) => {
            setTimer(0);
            setAutoRefreshEnabled(e.target.checked);
            localStorage.setItem('autoRefresh', e.target.checked);
          }}
        />
        Enabled
        <br />
        <label>
          Interval:
          <br />
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
        </label>
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
    </div>
  );

  return (
    <>
      <nav>
        <div className="title">
          Parched<sup>{appVersion}</sup>
        </div>
        <div className="error">{error}</div>
        <div className="countdown">
          {autoRefreshEnabled
            ? `Auto refresh in ${toReadableTimer(
                intervalValues[autoRefreshInterval].sec - timer
              )}`
            : `\u00A0`}
        </div>
      </nav>
      <div className="flex-container">
        <div className="flex-item flex-item-left">
          <button
            type="button"
            onClick={refresh}
            style={{ width: 200 }}
            id={refreshButtonId}
          >
            {buttonText}
          </button>
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

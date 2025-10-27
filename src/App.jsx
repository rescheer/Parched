import { useEffect, useId, useState } from 'react';
import { createGrid } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import * as Definitions from './config/definitions';
import AuthProvider from './class/AuthProvider';
import './App.css';

const MOBILE_ROW_HEIGHT = 130;
const NONMOBILE_ROW_HEIGHT = 42;
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
  { name: 'Floor', code: 54 },
  { name: 'Bar', code: 51 },
  { name: 'Kitchen', code: 53 },
  { name: 'Management', code: 52 },
  { name: 'Barista', code: 16 },
  { name: 'Counter', code: 382 },
  { name: 'Hotel', code: 166 },
  { name: 'Distributor', code: 413 },
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

function App() {
  const refreshButtonId = useId();
  const locationId = useId();

  // Main States
  const [page, setPage] = useState('grid');
  const [buttonText, setButtonText] = useState('refresh');
  const [grid, setGrid] = useState(null);
  const [mobile, setMobile] = useState(window.innerWidth < 1000);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Settings States
  const [currentCategory, setCurrentCategory] = useState(51);
  const [location, setLocation] = useState(``);

  // Hooks
  // Checks for stored values from a previous session
  // Run once on mount
  useEffect(() => {
    const keys = [
      { key: 'location', value: `` },
      { key: 'category', value: `` },
    ];
    keys.forEach((item) => {
      if (localStorage.getItem(item.key)) {
        const value = localStorage.getItem(item.key);
        switch (item.key) {
          case 'location':
            setLocation(value);
            break;
          case 'category':
            setCurrentCategory(value);
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
              grid.setGridOption('rowHeight', 130);
              if (page === 'settings') setPage('grid');
              setMobile(true);
            }
          } else {
            if (mobile) {
              grid.setGridOption('columnDefs', Definitions.nonMobileColumn);
              grid.setGridOption('rowHeight', 42);
              if (page === 'modal') setPage('grid');
              setMobile(false);
            }
          }
        }
      });
    }

    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, [grid, mobile, page]);

  // Updates grid context object when location changes
  // Runs on change in location
  useEffect(() => {
    if (location && grid) {
      grid.setGridOption('context', { homeLoc: location });
    }
  }, [location, grid]);

  // Refreshes grid data when the job category changes.
  // Runs on change in category
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCategory]);

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
      setButtonText('cancel');
      refreshButton.disabled = true;

      // Check for a stored, unexpired token
      if (!auth.token || Date.now() >= auth.expiration * 1000) {
        // Get a new token
        useToken = await auth.refreshToken();
      } else {
        useToken = auth.token;
      }

      await getJobsData(useToken, { category: currentCategory })
        .then((rawData) => {
          // Remove Shift job types from data
          const filteredJobs = rawData.jobs.filter(
            (job) => job.typeName !== 'Shift'
          );

          // Reset failed attempts
          if (failedAttempts > 0) {
            console.log(
              `Token restored after ${failedAttempts} failed attempt(s).`
            );
            setFailedAttempts(0);
          }
          setButtonText('refresh');
          if (!grid) {
            // Initialization
            setGrid(initGrid(filteredJobs));
          } else {
            grid.setGridOption('rowData', filteredJobs);
          }
        })
        .catch((error) => {
          console.log(error);
          setButtonText('refresh');
        })
        .finally(() => {
          refreshButton.disabled = false;
        });
    }
  };

  function initGrid(data) {
    // Empty the dataGrid element just in case
    document.getElementById('dataGrid').innerHTML = '';

    let columnDefs;
    let rowHeight = NONMOBILE_ROW_HEIGHT;
    if (window.innerWidth < 1000) {
      columnDefs = Definitions.mobileColumn;
      rowHeight = MOBILE_ROW_HEIGHT;
    } else {
      columnDefs = Definitions.nonMobileColumn;
    }
    const gridOptions = {
      rowData: data,
      context: getGridContext(),
      resetRowDataOnUpdate: true,
      columnDefs: columnDefs,
      rowHeight,
    };

    return createGrid(document.getElementById('dataGrid'), gridOptions);
  }

  const toggleSettings = () => {
    if (page !== 'settings') {
      setPage('settings');
    } else {
      setPage('grid');
    }
  };

  // JSX
  // -- Pages
  const gridPage = (
    <div
      id="dataGrid"
      className="ag-theme-quartz-dark"
      style={{ height: '100%', wrapperBorderRadius: 0, borderRadius: 0 }}
    />
  );

  const settingsPage = (
    <>
      <div className="settingsRoot">
        <div className="settings">
          <h2>Settings</h2>
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
        </div>
      </div>
      <sub>parched by robby scheer in portland, oregon</sub>
    </>
  );

  // --Components
  const categoryList = categories.map((item, index) => (
    <span key={item.code + item.name}>
      <button
        type="button"
        className={currentCategory == item.code ? '' : 'unselectedButton'}
        value={item.code}
        onClick={(e) => {
          if (e.target.value !== currentCategory) {
            setCurrentCategory(e.target.value);
            localStorage.setItem('category', e.target.value);
          }
          if (page === 'modal') setPage('grid');
        }}
      >
        {item.name}
      </button>
      {index < categories.length - 1 ? mobile ? <br /> : ' | ' : ''}
    </span>
  ));

  const categorySelector = (
    <div className="nav-item nav-item-center">{categoryList}</div>
  );

  const mobileCategorySelector = (
    <div className="nav-item nav-item-center">
      <button
        type="button"
        onClick={() => {
          if (page === 'modal') {
            setPage('grid');
          } else {
            setPage('modal');
          }
        }}
      >
        {categories.find((item) => item.code == currentCategory)?.name}
        <span className="material-icons" style={{ fontSize: '1em' }}>
          arrow_drop_down
        </span>
      </button>
    </div>
  );

  const navBar = (
    <nav className="nav-container">
      {/* Title */}
      <span className="nav-item-left title">
        Parched
        {/* eslint-disable-next-line no-undef */}
        <span className="version"> v{APP_VERSION}</span>
      </span>

      {/* Category Selector */}
      {mobile ? mobileCategorySelector : categorySelector}

      {/* Nav Buttons */}
      <div className="nav-item-right">
        <button
          className="nav-button"
          type="button"
          onClick={refresh}
          id={refreshButtonId}
        >
          <span className="material-icons">{buttonText}</span>
        </button>
        {!mobile ? (
          <button className="nav-button" type="button" onClick={toggleSettings}>
            <span className="material-icons">
              {page === 'settings' ? 'home' : 'settings'}
            </span>
          </button>
        ) : (
          ''
        )}
      </div>
    </nav>
  );

  const content = (
    <div className="content">
      <div
        className="full-height"
        style={{
          display: page === 'modal' ? 'block' : 'none',
          backgroundColor: 'black',
        }}
      >
        {categoryList}
      </div>
      <div
        className="full-height"
        style={{ display: page === 'grid' ? 'block' : 'none' }}
      >
        {gridPage}
      </div>
      <div
        className="full-height"
        style={{ display: page === 'settings' ? 'block' : 'none' }}
      >
        {settingsPage}
      </div>
    </div>
  );

  return (
    <>
      {navBar}
      {content}
    </>
  );
}

export default App;

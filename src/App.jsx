import { useCallback, useEffect, useId, useState } from 'react';
import { createGrid } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Config
import * as Definitions from './config/definitions';

// Classes
import AuthProvider from './class/AuthProvider';

// Components
import Navbar from './components/Navbar';
import Content from './components/Content';

// Style
import './App.css';

const MOBILE_ROW_HEIGHT = 130;
const NONMOBILE_ROW_HEIGHT = 42;
const defaultParams = {
  distance: 15,
  isLikelyFraud: false,
  latitude: 45.533467,
  longitude: -122.650095,
  locationLabel: 'Portland, OR',
  status: 'publish',
};
const defaultJobCategories = [51, 52, 54];

const apiBaseUrl = 'https://poachedjobs.com/api/v1/jobs?';
const auth = new AuthProvider();

/**
 * Asynchronously returns jobs data from the Poached API. Returns undefined on failure.
 */
async function getJobsData(token, categories, params = {}) {
  const options = {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + token,
    },
  };

  // Encode API URL
  const paramData = Object.assign(defaultParams, params);
  const searchParams = new URLSearchParams();
  // Add default parameters
  Object.entries(paramData).forEach(([key, value]) => {
    searchParams.append(key, value);
  });
  // Add category parameters
  categories.forEach((cat) => searchParams.append('category[]', cat));
  const finalAPIUrl = apiBaseUrl + searchParams.toString();

  return await fetch(finalAPIUrl, options).then((stream) => {
    if (!stream.ok) {
      throw new Error(`HTTP error! Status Code: ${stream.status}`);
    }

    return stream.json();
  });
}

function App() {
  // Element IDs
  const refreshButtonId = useId();
  const locationFieldId = useId();
  const mobileSelectorDivId = useId();

  // Data States
  const [grid, setGrid] = useState(null);

  // UI States
  const [page, setPage] = useState('grid');
  const [jobCategory, setJobCategory] = useState(defaultJobCategories);
  const [location, setLocation] = useState(``);
  const [refreshButtonText, setRefreshButtonText] = useState('refresh');
  const [homeButtonText, setHomeButtonText] = useState('settings');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const [mobileSelectorShown, setMobileSelectorShown] = useState(false);

  // Error states
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Main refresh function
  const refresh = useCallback(async () => {
    const initGrid = (data) => {
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
    };

    const getGridContext = () => {
      const homeLoc = document.getElementById(locationFieldId).value;

      return { homeLoc };
    };

    let useToken = '';
    const refreshButtonElement = document.getElementById(refreshButtonId);
    if (!refreshButtonElement.disabled) {
      setRefreshButtonText('cancel');
      refreshButtonElement.disabled = true;

      // Check for a stored, unexpired token
      if (!auth.token || Date.now() >= auth.expiration * 1000) {
        // Get a new token
        useToken = await auth.refreshToken();
      } else {
        useToken = auth.token;
      }

      await getJobsData(useToken, jobCategory)
        .then((rawData) => {
          // Remove Shift job types from data
          const filteredJobs = rawData.jobs.filter(
            (job) => job.typeName !== 'Shift',
          );

          // Reset failed attempts
          if (failedAttempts > 0) {
            console.log(
              `Token restored after ${failedAttempts} failed attempt(s).`,
            );
            setFailedAttempts(0);
          }
          setRefreshButtonText('refresh');
          if (!grid) {
            // Initialization
            setGrid(initGrid(filteredJobs));
          } else {
            grid.setGridOption('rowData', filteredJobs);
          }
        })
        .catch((error) => {
          console.log(error);
          setRefreshButtonText('refresh');
        })
        .finally(() => {
          refreshButtonElement.disabled = false;
        });
    }
  }, [failedAttempts, grid, jobCategory, locationFieldId, refreshButtonId]);

  // Event Handlers
  const handlePageChange = useCallback(() => {
    switch (page) {
      case 'grid':
        // Change to settings
        setPage('settings');
        setHomeButtonText('home');
        return;
      case 'settings':
        // Return to grid
        setPage('grid');
        setHomeButtonText('settings');
        return;
      case 'mobileSelector':
        // Return to grid
        setPage('mobileSelector');
        setHomeButtonText('home');
        return;
      default:
        return;
    }
  }, [page]);

  const handleMobileSelectorToggle = useCallback(
    (show) => {
      const div = document.getElementById(mobileSelectorDivId);

      if (!show || mobileSelectorShown) {
        div.classList.remove('show');
        setMobileSelectorShown(false);
      } else {
        div.classList.add('show');
        setMobileSelectorShown(true);
      }
    },
    [mobileSelectorDivId, mobileSelectorShown],
  );

  const handleJobCategoryChange = useCallback(
    (e) => {
      const newCategories = [...jobCategory];
      const selectedCategory = +e.target.value;

      const selectedIndex = newCategories.findIndex((val) => selectedCategory === val);
      if (selectedIndex === -1) {
        newCategories.push(selectedCategory);
      } else {
        newCategories.splice(selectedIndex, 1);
      }
      setJobCategory(newCategories);

      if (isMobile || mobileSelectorShown) handleMobileSelectorToggle(false);
    },
    [handleMobileSelectorToggle, jobCategory, isMobile, mobileSelectorShown],
  );

  const handleLocationChange = useCallback((e) => {
    setLocation(e.target.value);
    localStorage.setItem('location', e.target.value);
  }, []);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

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
            if (!isMobile) {
              grid.setGridOption('columnDefs', Definitions.mobileColumn);
              grid.setGridOption('rowHeight', 130);
              setIsMobile(true);
            }
          } else {
            if (isMobile) {
              grid.setGridOption('columnDefs', Definitions.nonMobileColumn);
              grid.setGridOption('rowHeight', 42);
              setIsMobile(false);
            }
          }
        }
      });
    }

    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, [grid, isMobile]);

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
  }, [jobCategory, refresh]);

  return (
    <>
      <Navbar
        {...{
          refreshButtonId,
          mobileSelectorDivId,
          isMobile,
          mobileSelectorShown,
          handleMobileSelectorToggle,
          jobCategory,
          refreshButtonText,
          homeButtonText,
          handleJobCategoryChange,
          handlePageChange,
          handleRefresh,
        }}
      />
      <Content
        {...{
          locationFieldId,
          page,
          location,
          handleLocationChange,
        }}
      />
    </>
  );
}

export default App;

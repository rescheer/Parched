import LogoRenderer from '../renderer/LogoRenderer';
import TitleRenderer from '../renderer/TitleRenderer';
import CompanyRenderer from '../renderer/CompanyRenderer';
import LocationRenderer from '../renderer/LocationRenderer';
import getDistanceInMiles from '../lib/getDistanceInMiles';

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

function getDistanceFromMe(homeLoc, lat, long) {
  if (homeLoc) {
    const splitLoc = homeLoc.split(',');
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

const gridDefs = [
  {
    field: 'logoUrl',
    headerName: '',
    cellRenderer: LogoRenderer,
    cellClass: 'imgColumn',
    maxWidth: 100,
    sortable: false,
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
    valueFormatter: (cb) => (cb.value ? cb.value : 'Unspecified Title'),
    cellRenderer: TitleRenderer,
    flex: 3,
    filter: true,
  },
  {
    field: 'postDate',
    flex: 1,
    sort: 'desc',
    headerName: 'Posted',
    valueGetter: (cb) => timeSinceString(new Date(cb.data.postDate)),
    comparator: (valueA, valueB, nodeA, nodeB) => {
      const timeA = new Date(nodeA.data.postDate).getTime();
      const timeB = new Date(nodeB.data.postDate).getTime();

      if (timeB < timeA) {
        return -1; // dateA comes before dateB
      } else if (timeB > timeA) {
        return 1; // dateA comes after dateB
      } else {
        return 0; // dates are equal
      }
    },
  },
  {
    field: 'typeName',
    headerName: 'Job Type',
    valueFormatter: (cb) => (cb.value ? cb.value : 'Unspecified'),
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
    valueGetter: (cb) =>
      getDistanceFromMe(
        cb.context?.homeLoc,
        cb.data.latitude,
        cb.data.longitude
      ),
    valueFormatter: (cb) =>
      typeof cb.value === 'string' ? cb.value : `${+cb.value.toFixed(1)} mi`,
    comparator: (valueA, valueB) => {
      if (valueA < valueB) {
        return -1;
      } else if (valueA > valueB) {
        return 1;
      } else {
        return 0;
      }
    },
    flex: 1,
  },
  {
    field: 'jobViews',
    valueFormatter: (cb) => (cb.value ? cb.value : 'Unknown'),
    flex: 1,
    headerName: 'Views',
  },
];

export default gridDefs;

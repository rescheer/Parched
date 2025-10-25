import timeSinceString from '../common/timeSinceString';
/* eslint-disable no-unused-vars */

export default class MobileCellRenderer {
  eGui;
  content;

  // Optional: Params for rendering. The same params that are passed to the cellRenderer function.
  init(params) {
    if (params.value) {
      const cell = document.createElement('div');

      const company = document.createElement('a');
      company.setAttribute('href', params.value.googlePlaceurl);
      company.setAttribute('target', '_blank');
      company.innerHTML = params.value.company + ' (' + params.value.city + ') <br>';

      const title = document.createElement('a');
      title.setAttribute('href', params.value.url);
      title.setAttribute('target', '_blank');
      title.innerHTML = params.value.title + '<br>';

      const ageSpan = document.createElement('span');
      ageSpan.innerHTML = timeSinceString(new Date(params.value.postDate));

      cell.append(company, title, ageSpan);

      this.eGui = cell;
      // this.eGui.setAttribute('class', 'fakeAnchor');
      // this.eGui.innerHTML = params.value;
    }
  }

  // Required: Return the DOM element of the component, this is what the grid puts into the cell
  getGui() {
    return this.eGui;
  }

  // Required: Get the cell to refresh.
  refresh(params) {
    return false;
  }
}

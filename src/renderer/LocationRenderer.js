/* eslint-disable no-unused-vars */
export default class LocationRenderer {
  eGui;

  // Optional: Params for rendering. The same params that are passed to the cellRenderer function.
  init(params) {
    if (params.value) {
      const { googlePlaceUrl } = params.data;

      let location = document.createElement('a');
      location.setAttribute('href', googlePlaceUrl);
      location.setAttribute('target', '_blank');
      location.innerHTML = params.value;

      this.eGui = document.createElement('span');
      this.eGui.appendChild(location);
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

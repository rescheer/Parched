/* eslint-disable no-unused-vars */
export default class FakeLinkRenderer {
  eGui;

  // Optional: Params for rendering. The same params that are passed to the cellRenderer function.
  init(params) {
    if (params.value) {
      this.eGui = document.createElement('span');
      this.eGui.setAttribute('class', 'fakeAnchor');
      this.eGui.innerHTML = params.value;
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

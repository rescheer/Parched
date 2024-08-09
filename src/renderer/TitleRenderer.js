/* eslint-disable no-unused-vars */
export default class TitleRenderer {
  eGui;

  // Optional: Params for rendering. The same params that are passed to the cellRenderer function.
  init(params) {
    if (params.value) {
      const { url } = params.data;

      let title = document.createElement('a');
      title.setAttribute('href', url);
      title.setAttribute('target', '_blank');
      title.innerHTML = params.value;

      this.eGui = document.createElement('span');
      this.eGui.appendChild(title);
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

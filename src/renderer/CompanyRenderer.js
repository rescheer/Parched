/* eslint-disable no-unused-vars */
export default class CompanyRenderer {
  eGui;

  // Optional: Params for rendering. The same params that are passed to the cellRenderer function.
  init(params) {
    if (params.value) {
      const { companyUrl } = params.data;

      let link = document.createElement('a');
      link.setAttribute('href', companyUrl);
      link.setAttribute('target', '_blank');
      link.innerHTML = params.value;

      this.eGui = document.createElement('span');
      this.eGui.appendChild(link);
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

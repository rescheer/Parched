/* eslint-disable no-unused-vars */
export default class LogoRenderer {
  eGui;

  // Optional: Params for rendering. The same params that are passed to the cellRenderer function.
  init(params) {
    const validFormats = ['.jpg', 'jpeg', '.png', '.gif'];

    let logo = document.createElement('img');
    if (params.value && validFormats.includes(params.value.slice(-4))) {
      logo.src = params.value;
    } else {
      logo.src =
        'https://poachedjobs.com/poached-client/img/poached-icon-bar-c1a23768bc59c738cfa55de56e7063b1.svg';
    }

    logo.setAttribute('class', 'logo');
    this.eGui = document.createElement('span');
    this.eGui.setAttribute('class', 'imgSpanLogo');
    this.eGui.appendChild(logo);
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

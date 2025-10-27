// Components
import { memo } from 'react';
import CategorySelector from './CategorySelector';

function Navbar({
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
}) {
  let mobileFlex = isMobile ? ' mobile-flex' : '';
  return (
    <nav>
      {/* Title */}
      <span className={'nav-item-left title' + mobileFlex}>
        Parched
        {/* eslint-disable-next-line no-undef */}
        <span className="version"> v{APP_VERSION}</span>
      </span>

      {/* Category Selector */}
      <span className={'nav-item-center' + mobileFlex}>
        <CategorySelector
          {...{
            mobileSelectorDivId,
            isMobile,
            mobileSelectorShown,
            jobCategory,
            handleJobCategoryChange,
            handleMobileSelectorToggle,
          }}
        />
      </span>

      {/* Nav Buttons */}
      <div className={'nav-item-right' + mobileFlex}>
        <button
          className="nav-button"
          type="button"
          onClick={handleRefresh}
          id={refreshButtonId}
        >
          <span className="material-icons">{refreshButtonText}</span>
        </button>
        {!isMobile ? (
          <button
            className="nav-button"
            type="button"
            onClick={handlePageChange}
          >
            <span className="material-icons">{homeButtonText}</span>
          </button>
        ) : (
          ''
        )}
      </div>
    </nav>
  );
}

export default memo(Navbar);

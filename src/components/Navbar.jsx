// Components
import CategorySelector from './CategorySelector';

export default function Navbar({
  reactIds,
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
  return (
    <nav>
      {/* Title */}
      <span className="nav-item-left title">
        Parched
        {/* eslint-disable-next-line no-undef */}
        <span className="version"> v{APP_VERSION}</span>
      </span>

      {/* Category Selector */}
      <CategorySelector
        {...{
          reactIds,
          isMobile,
          mobileSelectorShown,
          jobCategory,
          handleJobCategoryChange,
          handleMobileSelectorToggle,
        }}
      />

      {/* Nav Buttons */}
      <div className="nav-item-right">
        <button
          className="nav-button"
          type="button"
          onClick={handleRefresh}
          id={reactIds.refreshButton}
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

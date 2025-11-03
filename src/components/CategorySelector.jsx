import { poached } from '../config/config';

export default function CategorySelector({
  mobileSelectorDivId,
  isMobile,
  jobCategory,
  handleJobCategoryChange,
  handleMobileSelectorToggle,
}) {
  const { jobCategoryList } = poached;

  function getCategoryButtonMap(forMobile) {
    let separator;
    if (forMobile) {
      separator = <br />;
    } else {
      separator = ' | ';
    }
    return jobCategoryList.map((item, index) => (
      <span key={item.code + item.name}>
        <button
          type="button"
          className={jobCategory == item.code ? '' : 'unselectedButton'}
          value={item.code}
          onClick={handleJobCategoryChange}
        >
          {item.name}
        </button>
        {index < jobCategoryList.length - 1 ? separator : ''}
      </span>
    ));
  }

  if (!isMobile) {
    const categoryList = getCategoryButtonMap(false);
    return (
      <span className="nav-item nav-item-center no-select">{categoryList}</span>
    );
  } else {
    const categoryList = getCategoryButtonMap(true);
    return (
      <>
        <span className="nav-item nav-item-center">
          <button type="button" onClick={handleMobileSelectorToggle}>
            {jobCategoryList.find((item) => item.code == jobCategory)?.name}
            <span className="material-icons" style={{ fontSize: '1em' }}>
              arrow_drop_down
            </span>
          </button>
        </span>
        <span
          className="nav-item nav-item-center mobile-selector"
          id={mobileSelectorDivId}
        >
          {categoryList}
        </span>
      </>
    );
  }
}

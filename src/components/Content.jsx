import PageGrid from './pageGrid';
import PageSettings from './pageSettings';

export default function Content({
  reactIds,
  page,
  location,
  handleLocationChange,
}) {
  return (
    <div className="content">
      <div
        className="full-height"
        style={{ display: page === 'grid' ? 'block' : 'none' }}
      >
        <PageGrid />
      </div>
      <div
        className="full-height"
        style={{ display: page === 'settings' ? 'block' : 'none' }}
      >
        <PageSettings
          reactIds={reactIds}
          location={location}
          handleLocationChange={handleLocationChange}
        />
      </div>
    </div>
  );
}

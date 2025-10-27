import PageGrid from './PageGrid';
import PageSettings from './PageSettings';

export default function Content({
  locationFieldId,
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
        <PageSettings {...{ locationFieldId, location, handleLocationChange }} />
      </div>
    </div>
  );
}

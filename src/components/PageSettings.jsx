export default function PageSettings({
  locationFieldId,
  location,
  handleLocationChange,
}) {
  return (
    <>
      <div className="settingsRoot">
        <div className="settings">
          <h2>Settings</h2>
          <h3>Location</h3>
          <label>
            Latitude, Longitude:
            <br />
            <input
              id={locationFieldId}
              defaultValue={location}
              onChange={handleLocationChange}
              style={{ width: 270 }}
            />
          </label>
        </div>
      </div>
      <sub>parched by robby scheer in portland, oregon</sub>
    </>
  );
}

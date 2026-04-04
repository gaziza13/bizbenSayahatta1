import { Link } from "react-router-dom";
import { LEVELS_LIST } from "../../constants/mapConstants";
import worldIcon from "../../assets/world.svg"
import pinIcon from "../../assets/pin.svg"
import addVPlace from "../../assets/addVPlace.svg"
import deleteVPlace from "../../assets/deleteVPlace.svg"
import editVPlace from "../../assets/editVPlace.svg"
import pinVPlaces from "../../assets/pinVPlaces.svg"
import "../../styles/MapSidebar.css";


export default function MapSidebar({ places, level, countriesCount, citiesCount, progress, loadingPlaces, onOpenModal, onRemovePlace, 
  isEditMode, onToggleEditMode, }) {
    
  return (
    <aside className="map-sidebar">
      <h3>Traveler Level</h3>
      
      <div style={{ marginTop: 10 }}>
        <Link to="/shared-maps" style={{ textDecoration: "none" }}>
          <button type="button" className="shared-maps-btn">
            See other user's maps
          </button>
        </Link>
      </div>

      <div className="badge-scroll">
        {LEVELS_LIST.map((lvl, i) => {
          const isCurrent = lvl.name === level.name;
          const isCompleted = places.length >= lvl.next || (lvl.next === null && places.length >= lvl.min);
          const progressPercent = lvl.next
            ? ((places.length - lvl.min) / (lvl.next - lvl.min)) * 100
            : 100;

          return (
            <div key={i} className={`badge-card ${isCurrent ? "current" : isCompleted ? "completed" : "locked"}`}>
              <div className="badge-icon">🧭</div>
              <strong>{lvl.name}</strong>
              {lvl.next ? (
                <div className="mini-progress">
                  <div className="mini-bar" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                </div>
              ) : (
                <span className="max-label">MAX</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="level-dots">
        {LEVELS_LIST.map((_, i) => (
          <div key={i} className={`level-dot ${i <= level.index ? "active" : ""}`}>{i + 1}</div>
        ))}
      </div>

      <section className="stats">
        <h3>Your Statistics</h3>

        <div className="stats-row">

          <div className="stat-card"> 
            <img src={worldIcon} alt="worldIcon" />
            <strong>{countriesCount}</strong> Countries
          </div>

          <div className="stat-card">
            <img src={pinIcon} alt="pinIcon" /> 
            <strong>{citiesCount}</strong> Cities
          </div>
        </div>

        <div className="world-progress"><strong>{progress}%</strong> of the world explored</div>
      </section>

      <section className="visited">
        <div className="visited-header">
          
          <h3 className="visited-title">
            Visited Places
            {!isEditMode && (
              <button className="inline-add-btn" onClick={onOpenModal}>
                <img src={addVPlace} alt="add"/>
              </button>
            )}
          </h3>


        </div>

        {loadingPlaces && <p>Loading...</p>}

        <div className="visited-list">
          {places.map((p) => (
            <div className="place" key={p.id}>
            <img src={pinVPlaces} alt="pinVPlaces"/>

            <div className="place-info">
              <strong>{p.city}</strong>
              <span>{p.country}</span>
            </div>

            <div className="place-side">
              <span className="date">{p.date}</span> 
              
              <div className="place-actions">
                <button
                  type="button"
                  onClick={() => onRemovePlace(p.id)}
                >
                  <img src={deleteVPlace} alt="delete"/>
                </button>
              </div>
            </div>
          </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
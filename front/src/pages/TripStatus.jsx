import React, { useState } from "react";
import "../styles/TripStatus.css";

export default function TripStatus() {
  const [activeFilter, setActiveFilter] = useState("approved");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [trips, setTrips] = useState([]);

  const [newTrip, setNewTrip] = useState({
    image: "",
    title: "",
    place: "",
    startDate: "",
    endDate: "",
    budget: "",
    comment: "",
  });

  const handleChange = (e) => {
    setNewTrip({
      ...newTrip,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTrip = () => {
    if (!newTrip.title || !newTrip.place) return;

    const tripToAdd = {
      ...newTrip,
      id: Date.now(),
      status: "in-progress",
    };

    setTrips([...trips, tripToAdd]);
    setActiveFilter("in-progress");
    setIsModalOpen(false);

    setNewTrip({
      image: "",
      title: "",
      place: "",
      startDate: "",
      endDate: "",
      budget: "",
      comment: "",
    });
  };

  const filteredTrips = trips.filter(
    (trip) => trip.status === activeFilter
  );

  return (
    <div className="trip-page">
      {/* Header */}
      <div className="trip-header-row">
        
        <div>
          <h1 className="trip-title">Trips Status</h1>

          <div className="trip-filters">
            <button
              className={activeFilter === "approved" ? "approved active" : ""}
              onClick={() => setActiveFilter("approved")}
            >
              Approved
            </button>

            <button
              className={activeFilter === "in-progress" ? "in-progress active" : ""}
              onClick={() => setActiveFilter("in-progress")}
            >
              In progress
            </button>

            <button
              className={activeFilter === "rejected" ? "rejected active" : ""}
              onClick={() => setActiveFilter("rejected")}
            >
              Rejected
            </button>
          </div>
        </div>

        <button
          className="add-trip-btn"
          onClick={() => setIsModalOpen(true)}
        >
          + Add New Trip
        </button>
      </div>

      {/* Cards */}
      <div className="trip-grid">
        {filteredTrips.map((trip) => (
          <div key={trip.id} className="trip-card">
            <div className="trip-image-container">
              <img
                src={
                  trip.image
                    ? URL.createObjectURL(trip.image)
                    : "https://source.unsplash.com/600x400/?travel"
                }
                alt={trip.title}
                className="trip-image"
              />
            </div>

            <div className="trip-content">
              <h2 className="trip-name">{trip.title}</h2>
              <p className="trip-location">{trip.place}</p>
              <p className="trip-date">
                {trip.startDate} — {trip.endDate}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Trip</h2>
              <span
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </span>
            </div>

            <div className="modal-body">
              <input
                type="file"
                onChange={(e) =>
                  setNewTrip({ ...newTrip, image: e.target.files[0] })
                }
              />

              <input
                type="text"
                name="title"
                placeholder="Trip Name"
                value={newTrip.title}
                onChange={handleChange}
              />

              <input
                type="text"
                name="place"
                placeholder="Place"
                value={newTrip.place}
                onChange={handleChange}
              />

              <div className="date-row">
                <input
                  type="date"
                  name="startDate"
                  value={newTrip.startDate}
                  onChange={handleChange}
                />
                <input
                  type="date"
                  name="endDate"
                  value={newTrip.endDate}
                  onChange={handleChange}
                />
              </div>

              <input
                type="text"
                name="budget"
                placeholder="Budget"
                value={newTrip.budget}
                onChange={handleChange}
              />

              <textarea
                name="comment"
                placeholder="Additional information"
                rows={3}
                value={newTrip.comment}
                onChange={handleChange}
              />
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button className="save-btn" onClick={handleAddTrip}>
                Add Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
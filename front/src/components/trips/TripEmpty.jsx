import { Link } from "react-router-dom";
import earthPic from "../../assets/earthpic.png";
import "../../styles/TripEmpty.css";

export default function TripEmpty() {
  return (
    <main className="trip-empty">
      <div className="trip-empty__left">
        <h2 className="trip-empty__title">
          You don&apos;t have any
          <br />
          trips yet...
        </h2>
        <Link to="/chat" className="trip-cta">
          Create new trip <span className="trip-cta__arrow">→</span>
        </Link>
      </div>
      <div className="trip-empty__right">
        <img className="trip-illustration" src={earthPic} alt="Travel illustration" />
      </div>
    </main>
  );
}
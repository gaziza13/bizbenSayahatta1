import { categories } from "../../constants/inspoConstants";
import { formatCategory } from "../../utils/placeUtils";

export default function PlaceFilters({
  styles,
  category,
  onCategoryChange,
  priceFilter,
  onPriceFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}) {
  return (
    <div className={styles.controls}>
      <div className={styles.selectRowWithShadow}>
        <div className={styles.selectBlock}>
          <span className={styles.selectLabel}>By category</span>
          <select className={styles.select} value={category} onChange={(e) => onCategoryChange(e.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All categories" : formatCategory(item)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectBlock}>
          <span className={styles.selectLabel}>By price</span>
          <select className={styles.select} value={priceFilter} onChange={(e) => onPriceFilterChange(e.target.value)}>
            <option value="all">All prices</option>
            <option value="free">🆓 Free</option>
            <option value="budget">🪙 Budget</option>
            <option value="moderate">💸 Moderate</option>
            <option value="premium">💰 Premium</option>
          </select>
        </div>

        <div className={styles.selectBlock}>
          <span className={styles.selectLabel}>From date</span>
          <input type="date" className={styles.select} value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} />
        </div>

        <div className={styles.selectBlock}>
          <span className={styles.selectLabel}>To date</span>
          <input type="date" className={styles.select} value={dateTo} onChange={(e) => onDateToChange(e.target.value)} />
        </div>
      </div>
    </div>
  );
}

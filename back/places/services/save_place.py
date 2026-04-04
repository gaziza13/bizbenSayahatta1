from django.db import transaction
from places.models import MustVisitPlace, Place, SavedPlace


@transaction.atomic
def save_place_for_user(user, place_id):
    place = Place.objects.select_for_update().get(id=place_id)

    saved, created = SavedPlace.objects.get_or_create(
        user=user,
        place=place,
    )

    if created:
        place.saves_count += 1
        place.save(update_fields=["saves_count"])

    return saved


@transaction.atomic
def set_place_wishlist_state(*, user, place_id, is_favorited):
    """
    Keep legacy SavedPlace rows and the newer MustVisitPlace rows in sync.
    User-facing wishlist/favorites should behave like a single concept.
    """
    place = Place.objects.select_for_update().get(id=place_id)

    if is_favorited:
        MustVisitPlace.objects.get_or_create(user=user, place=place)
        _, saved_created = SavedPlace.objects.get_or_create(user=user, place=place)
        if saved_created:
            place.saves_count += 1
            place.save(update_fields=["saves_count"])
        return {"id": place.id, "is_must_visit": True, "saves_count": place.saves_count}

    MustVisitPlace.objects.filter(user=user, place=place).delete()
    saved_deleted, _ = SavedPlace.objects.filter(user=user, place=place).delete()
    if saved_deleted and place.saves_count > 0:
        place.saves_count -= 1
        place.save(update_fields=["saves_count"])

    return {"id": place.id, "is_must_visit": False, "saves_count": place.saves_count}

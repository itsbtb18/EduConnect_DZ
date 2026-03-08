"""
Timetable & schedule services — conflict detection, auto-generation,
PDF export.
"""

import io
import logging
from collections import defaultdict

from django.db.models import Q

from .models import (
    Class,
    Room,
    ScheduleSlot,
    TeacherAssignment,
    TeacherAvailability,
)

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# 1. CONFLICT DETECTION
# ═══════════════════════════════════════════════════════════════════════════


class ConflictError(Exception):
    """Raised when a schedule slot would cause a conflict."""

    def __init__(self, conflicts: list[dict]):
        self.conflicts = conflicts
        super().__init__(f"Schedule conflicts detected: {conflicts}")


def _times_overlap(start1, end1, start2, end2) -> bool:
    """Return True if two time ranges overlap."""
    return start1 < end2 and start2 < end1


def detect_conflicts(
    school,
    day_of_week: int,
    start_time,
    end_time,
    teacher=None,
    room=None,
    assigned_class=None,
    academic_year=None,
    exclude_slot_id=None,
) -> list[dict]:
    """
    Detect all schedule conflicts for a proposed slot.

    Returns a list of conflict dicts, each with:
      - type: "TEACHER" | "ROOM" | "CLASS"
      - message: human-readable description
      - conflicting_slot_id: UUID of the conflicting slot
    """
    conflicts = []

    # Build base queryset — same school, same day, overlapping time
    base_qs = ScheduleSlot.objects.filter(
        school=school,
        day_of_week=day_of_week,
        start_time__lt=end_time,
        end_time__gt=start_time,
    )
    if academic_year:
        base_qs = base_qs.filter(
            Q(academic_year=academic_year) | Q(academic_year__isnull=True)
        )
    if exclude_slot_id:
        base_qs = base_qs.exclude(pk=exclude_slot_id)

    # 1. Teacher conflict
    if teacher:
        teacher_conflicts = base_qs.filter(teacher=teacher).select_related(
            "assigned_class", "subject"
        )
        for slot in teacher_conflicts:
            conflicts.append(
                {
                    "type": "TEACHER",
                    "message": (
                        f"L'enseignant est déjà occupé : "
                        f"{slot.subject.name} en {slot.assigned_class.name} "
                        f"({slot.start_time:%H:%M}-{slot.end_time:%H:%M})"
                    ),
                    "conflicting_slot_id": str(slot.pk),
                }
            )

    # 2. Room conflict
    if room:
        room_conflicts = base_qs.filter(room=room).select_related(
            "assigned_class", "subject"
        )
        for slot in room_conflicts:
            conflicts.append(
                {
                    "type": "ROOM",
                    "message": (
                        f"Salle {room.name} déjà occupée : "
                        f"{slot.subject.name} ({slot.assigned_class.name}) "
                        f"({slot.start_time:%H:%M}-{slot.end_time:%H:%M})"
                    ),
                    "conflicting_slot_id": str(slot.pk),
                }
            )

    # 3. Class conflict
    if assigned_class:
        class_conflicts = base_qs.filter(
            assigned_class=assigned_class
        ).select_related("subject", "teacher")
        for slot in class_conflicts:
            conflicts.append(
                {
                    "type": "CLASS",
                    "message": (
                        f"Classe {assigned_class.name} déjà occupée : "
                        f"{slot.subject.name} avec {slot.teacher.full_name} "
                        f"({slot.start_time:%H:%M}-{slot.end_time:%H:%M})"
                    ),
                    "conflicting_slot_id": str(slot.pk),
                }
            )

    return conflicts


def check_teacher_availability(
    school,
    teacher,
    day_of_week: int,
    start_time,
    end_time,
) -> list[dict]:
    """
    Check if the teacher has declared unavailability blocks that
    overlap with the proposed slot.
    """
    blocks = TeacherAvailability.objects.filter(
        school=school,
        teacher=teacher,
        day_of_week=day_of_week,
        start_time__lt=end_time,
        end_time__gt=start_time,
    )
    return [
        {
            "type": "TEACHER_UNAVAILABLE",
            "message": (
                f"Enseignant indisponible "
                f"{b.start_time:%H:%M}-{b.end_time:%H:%M}"
                f"{f' ({b.reason})' if b.reason else ''}"
            ),
        }
        for b in blocks
    ]


def validate_slot(
    school,
    day_of_week,
    start_time,
    end_time,
    teacher=None,
    room=None,
    assigned_class=None,
    academic_year=None,
    exclude_slot_id=None,
) -> list[dict]:
    """
    Full validation for a schedule slot: conflicts + teacher availability.
    Returns list of all issues found (empty = OK).
    """
    issues = detect_conflicts(
        school=school,
        day_of_week=day_of_week,
        start_time=start_time,
        end_time=end_time,
        teacher=teacher,
        room=room,
        assigned_class=assigned_class,
        academic_year=academic_year,
        exclude_slot_id=exclude_slot_id,
    )
    if teacher:
        issues.extend(
            check_teacher_availability(
                school=school,
                teacher=teacher,
                day_of_week=day_of_week,
                start_time=start_time,
                end_time=end_time,
            )
        )
    return issues


# ═══════════════════════════════════════════════════════════════════════════
# 2. ROOM OCCUPANCY
# ═══════════════════════════════════════════════════════════════════════════


def get_room_occupancy(school, day_of_week: int = None, academic_year=None):
    """
    Return occupancy information for all rooms in a school.

    Returns list of dicts:
      {id, name, room_type, capacity, is_available, slots: [...]}
    """
    rooms = Room.objects.filter(school=school, is_deleted=False).order_by("name")

    slot_qs = ScheduleSlot.objects.filter(school=school).select_related(
        "assigned_class", "subject", "teacher"
    )
    if day_of_week is not None:
        slot_qs = slot_qs.filter(day_of_week=day_of_week)
    if academic_year:
        slot_qs = slot_qs.filter(
            Q(academic_year=academic_year) | Q(academic_year__isnull=True)
        )

    # Group slots by room
    slots_by_room = defaultdict(list)
    for slot in slot_qs.filter(room__isnull=False):
        slots_by_room[slot.room_id].append(slot)

    result = []
    for room in rooms:
        room_slots = slots_by_room.get(room.pk, [])
        result.append(
            {
                "id": str(room.pk),
                "name": room.name,
                "code": room.code,
                "room_type": room.room_type,
                "capacity": room.capacity,
                "is_available": room.is_available,
                "floor": room.floor,
                "building": room.building,
                "total_slots": len(room_slots),
                "slots": [
                    {
                        "id": str(s.pk),
                        "day": s.day_of_week,
                        "start": s.start_time.strftime("%H:%M"),
                        "end": s.end_time.strftime("%H:%M"),
                        "class": s.assigned_class.name,
                        "subject": s.subject.name,
                        "teacher": s.teacher.full_name,
                    }
                    for s in room_slots
                ],
            }
        )
    return result


# ═══════════════════════════════════════════════════════════════════════════
# 3. TEACHER SCHEDULE AUTO-GENERATION
# ═══════════════════════════════════════════════════════════════════════════


def generate_teacher_schedule(school, teacher, academic_year=None):
    """
    Auto-generate the teacher's schedule from class ScheduleSlots.

    The teacher schedule is derived from the class timetable — every slot
    where the teacher is assigned automatically appears in their schedule.

    Returns a dict organized by day of week.
    """
    qs = ScheduleSlot.objects.filter(
        school=school,
        teacher=teacher,
    ).select_related("assigned_class", "subject", "room")

    if academic_year:
        qs = qs.filter(
            Q(academic_year=academic_year) | Q(academic_year__isnull=True)
        )

    schedule = defaultdict(list)
    for slot in qs.order_by("day_of_week", "start_time"):
        schedule[slot.day_of_week].append(
            {
                "id": str(slot.pk),
                "class": slot.assigned_class.name,
                "subject": slot.subject.name,
                "start": slot.start_time.strftime("%H:%M"),
                "end": slot.end_time.strftime("%H:%M"),
                "room": slot.room.name if slot.room else slot.room_name,
            }
        )

    return dict(schedule)


def get_class_schedule(school, assigned_class, academic_year=None):
    """
    Get the full weekly schedule for a class.

    Returns a dict organized by day of week.
    """
    qs = ScheduleSlot.objects.filter(
        school=school,
        assigned_class=assigned_class,
    ).select_related("subject", "teacher", "room")

    if academic_year:
        qs = qs.filter(
            Q(academic_year=academic_year) | Q(academic_year__isnull=True)
        )

    schedule = defaultdict(list)
    for slot in qs.order_by("day_of_week", "start_time"):
        schedule[slot.day_of_week].append(
            {
                "id": str(slot.pk),
                "subject": slot.subject.name,
                "teacher": slot.teacher.full_name,
                "start": slot.start_time.strftime("%H:%M"),
                "end": slot.end_time.strftime("%H:%M"),
                "room": slot.room.name if slot.room else slot.room_name,
            }
        )

    return dict(schedule)


# ═══════════════════════════════════════════════════════════════════════════
# 4. PDF EXPORT
# ═══════════════════════════════════════════════════════════════════════════


DAY_NAMES_FR = {
    0: "Dimanche",
    1: "Lundi",
    2: "Mardi",
    3: "Mercredi",
    4: "Jeudi",
}


def _build_timetable_html(title: str, schedule: dict, entity_label: str) -> str:
    """
    Build an HTML table for a weekly timetable.

    Args:
        title: e.g. "Emploi du temps — 1AM-A"
        schedule: dict keyed by day_of_week (0-4), values are lists of slot dicts
        entity_label: "class" | "teacher" — determines which column to show
    """
    # Collect all unique time ranges across all days
    time_ranges = set()
    for day_slots in schedule.values():
        for slot in day_slots:
            time_ranges.add((slot["start"], slot["end"]))
    time_ranges = sorted(time_ranges)

    if not time_ranges:
        return f"<h2>{title}</h2><p>Aucun créneau programmé.</p>"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; direction: ltr; }}
        h1 {{ text-align: center; color: #1a237e; margin-bottom: 5px; }}
        h3 {{ text-align: center; color: #666; margin-top: 0; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        th {{ background-color: #1a237e; color: white; padding: 10px 6px;
              border: 1px solid #ccc; text-align: center; font-size: 12px; }}
        td {{ border: 1px solid #ccc; padding: 6px 4px; text-align: center;
              font-size: 11px; vertical-align: top; min-height: 60px; }}
        .slot-subject {{ font-weight: bold; color: #1a237e; }}
        .slot-teacher {{ color: #555; font-size: 10px; }}
        .slot-room {{ color: #888; font-size: 9px; font-style: italic; }}
        .empty {{ background-color: #f5f5f5; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 10px; color: #999; }}
    </style>
    </head>
    <body>
    <h1>{title}</h1>
    <table>
    <thead>
    <tr>
        <th>Horaire</th>
    """

    # Day headers
    for day_num in range(5):  # Sunday-Thursday
        html += f"<th>{DAY_NAMES_FR[day_num]}</th>\n"
    html += "</tr></thead><tbody>\n"

    # Build lookup: (day, start, end) -> slot
    slot_lookup = {}
    for day, slots in schedule.items():
        for slot in slots:
            key = (int(day), slot["start"], slot["end"])
            slot_lookup[key] = slot

    # Time rows
    for start, end in time_ranges:
        html += f'<tr><td><strong>{start} - {end}</strong></td>\n'
        for day_num in range(5):
            key = (day_num, start, end)
            slot = slot_lookup.get(key)
            if slot:
                subject = slot["subject"]
                detail = slot.get("teacher", "") if entity_label == "class" else slot.get("class", "")
                room = slot.get("room", "")
                html += '<td>'
                html += f'<div class="slot-subject">{subject}</div>'
                if detail:
                    html += f'<div class="slot-teacher">{detail}</div>'
                if room:
                    html += f'<div class="slot-room">{room}</div>'
                html += '</td>\n'
            else:
                html += '<td class="empty">—</td>\n'
        html += '</tr>\n'

    html += """
    </tbody></table>
    <div class="footer">Généré automatiquement par ILMI</div>
    </body></html>
    """
    return html


def export_class_timetable_pdf(school, assigned_class, academic_year=None) -> bytes:
    """
    Generate a PDF timetable for a class using WeasyPrint.

    Returns raw PDF bytes.
    """
    try:
        from weasyprint import HTML
    except ImportError:
        raise ImportError(
            "WeasyPrint is required for PDF export. "
            "Install it with: pip install weasyprint"
        )

    schedule = get_class_schedule(school, assigned_class, academic_year)
    title = f"Emploi du temps — {assigned_class.name}"
    html_content = _build_timetable_html(title, schedule, entity_label="class")

    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes


def export_teacher_timetable_pdf(school, teacher, academic_year=None) -> bytes:
    """
    Generate a PDF timetable for a teacher using WeasyPrint.

    Returns raw PDF bytes.
    """
    try:
        from weasyprint import HTML
    except ImportError:
        raise ImportError(
            "WeasyPrint is required for PDF export. "
            "Install it with: pip install weasyprint"
        )

    schedule = generate_teacher_schedule(school, teacher, academic_year)
    title = f"Emploi du temps — {teacher.full_name}"
    html_content = _build_timetable_html(title, schedule, entity_label="teacher")

    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes

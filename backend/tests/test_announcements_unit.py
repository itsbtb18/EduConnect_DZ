"""
Unit tests for the announcements app — models, serializers, read tracking.
"""
import pytest
from django.utils import timezone


# ════════════════════════════════════════════════════════════════
# ANNOUNCEMENT MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestAnnouncementModel:
    """Tests for the Announcement model."""

    def test_create_announcement(self, school, admin_user):
        from apps.announcements.models import Announcement

        ann = Announcement.objects.create(
            school=school,
            author=admin_user,
            title="Rentrée scolaire",
            body="La rentrée est prévue le 8 septembre 2025.",
            target_audience="ALL",
        )
        assert ann.pk is not None
        assert ann.title == "Rentrée scolaire"
        assert ann.target_audience == "ALL"
        assert not ann.is_pinned
        assert not ann.is_urgent
        assert ann.views_count == 0

    def test_announcement_urgent(self, school, admin_user):
        from apps.announcements.models import Announcement

        ann = Announcement.objects.create(
            school=school,
            author=admin_user,
            title="Grève demain",
            body="Les cours sont suspendus demain.",
            target_audience="ALL",
            is_urgent=True,
        )
        assert ann.is_urgent

    def test_announcement_pinned(self, school, admin_user):
        from apps.announcements.models import Announcement

        ann = Announcement.objects.create(
            school=school,
            author=admin_user,
            title="Règlement intérieur",
            body="Version mise à jour du règlement.",
            target_audience="ALL",
            is_pinned=True,
        )
        assert ann.is_pinned

    def test_announcement_audiences(self, school, admin_user):
        from apps.announcements.models import Announcement

        audiences = ["ALL", "PARENTS", "STUDENTS", "TEACHERS", "SPECIFIC_CLASS", "SPECIFIC_SECTION"]
        for aud in audiences:
            ann = Announcement.objects.create(
                school=school,
                author=admin_user,
                title=f"For {aud}",
                body=f"Content for {aud}",
                target_audience=aud,
            )
            assert ann.target_audience == aud

    def test_announcement_scheduled(self, school, admin_user):
        from apps.announcements.models import Announcement

        future = timezone.now() + timezone.timedelta(days=1)
        ann = Announcement.objects.create(
            school=school,
            author=admin_user,
            title="Future announcement",
            body="Will be published later.",
            target_audience="ALL",
            publish_at=future,
        )
        assert ann.publish_at is not None
        assert ann.published_at is None

    def test_announcement_soft_delete(self, school, admin_user):
        from apps.announcements.models import Announcement

        ann = Announcement.objects.create(
            school=school,
            author=admin_user,
            title="Deletable",
            body="Will be soft deleted.",
            target_audience="ALL",
        )
        ann.soft_delete()
        ann.refresh_from_db()
        assert ann.is_deleted
        assert ann.deleted_at is not None


# ════════════════════════════════════════════════════════════════
# ANNOUNCEMENT READ TRACKING TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestAnnouncementRead:
    """Tests for the AnnouncementRead model."""

    @pytest.fixture
    def announcement(self, school, admin_user):
        from apps.announcements.models import Announcement

        return Announcement.objects.create(
            school=school,
            author=admin_user,
            title="Test Announcement",
            body="Body content.",
            target_audience="ALL",
        )

    def test_mark_as_read(self, announcement, student_user):
        from apps.announcements.models import AnnouncementRead

        read = AnnouncementRead.objects.create(
            announcement=announcement,
            user=student_user,
        )
        assert read.pk is not None
        assert read.read_at is not None

    def test_unique_read_per_user(self, announcement, student_user):
        from apps.announcements.models import AnnouncementRead

        AnnouncementRead.objects.create(
            announcement=announcement,
            user=student_user,
        )
        with pytest.raises(Exception):
            AnnouncementRead.objects.create(
                announcement=announcement,
                user=student_user,
            )

    def test_multiple_users_can_read(self, announcement, student_user, parent_user):
        from apps.announcements.models import AnnouncementRead

        AnnouncementRead.objects.create(announcement=announcement, user=student_user)
        AnnouncementRead.objects.create(announcement=announcement, user=parent_user)
        assert AnnouncementRead.objects.filter(announcement=announcement).count() == 2


# ════════════════════════════════════════════════════════════════
# ANNOUNCEMENT ATTACHMENT TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestAnnouncementAttachment:
    """Tests for the AnnouncementAttachment model."""

    @pytest.fixture
    def announcement(self, school, admin_user):
        from apps.announcements.models import Announcement

        return Announcement.objects.create(
            school=school,
            author=admin_user,
            title="With attachment",
            body="See attachment.",
            target_audience="ALL",
        )

    def test_create_attachment(self, announcement):
        from apps.announcements.models import AnnouncementAttachment

        att = AnnouncementAttachment.objects.create(
            announcement=announcement,
            file_name="reglement.pdf",
        )
        assert att.pk is not None
        assert att.file_name == "reglement.pdf"
        assert att.announcement == announcement

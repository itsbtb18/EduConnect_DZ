from rest_framework import serializers

from .models import StaffAttendance, StaffDocument, StaffLeave, StaffMember


class StaffMemberSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    position_label = serializers.SerializerMethodField()
    contract_label = serializers.SerializerMethodField()
    phone_number = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()

    class Meta:
        model = StaffMember
        fields = "__all__"
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_full_name(self, obj):
        return f"{obj.user.last_name} {obj.user.first_name}"

    def get_position_label(self, obj):
        return obj.get_position_display()

    def get_contract_label(self, obj):
        return obj.get_contract_type_display()

    def get_phone_number(self, obj):
        return obj.user.phone_number

    def get_email(self, obj):
        return obj.user.email or ""

    def get_photo(self, obj):
        if obj.user.photo:
            return obj.user.photo.url
        return None


class StaffMemberCreateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False, write_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = StaffMember
        fields = [
            "first_name",
            "last_name",
            "phone_number",
            "email",
            "password",
            "position",
            "department",
            "hire_date",
            "contract_type",
            "contract_end_date",
            "base_salary",
            "bank_account",
            "emergency_contact",
            "notes",
        ]

    def create(self, validated_data):
        from apps.accounts.models import User

        first_name = validated_data.pop("first_name")
        last_name = validated_data.pop("last_name")
        phone_number = validated_data.pop("phone_number")
        email = validated_data.pop("email", "")
        password = validated_data.pop("password", None)

        school = validated_data.get("school")
        user = User.objects.create_user(
            phone_number=phone_number,
            password=password or phone_number,
            first_name=first_name,
            last_name=last_name,
            email=email,
            role=User.Role.ADMIN,
            school=school,
        )
        return StaffMember.objects.create(user=user, **validated_data)


class StaffDocumentSerializer(serializers.ModelSerializer):
    doc_type_label = serializers.SerializerMethodField()

    class Meta:
        model = StaffDocument
        fields = "__all__"
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_doc_type_label(self, obj):
        return obj.get_doc_type_display()


class StaffAttendanceSerializer(serializers.ModelSerializer):
    staff_name = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = StaffAttendance
        fields = "__all__"
        read_only_fields = [
            "id",
            "school",
            "created_by",
            "created_at",
            "updated_at",
            "hours_worked",
        ]

    def get_staff_name(self, obj):
        return f"{obj.staff.user.last_name} {obj.staff.user.first_name}"

    def get_status_label(self, obj):
        return obj.get_status_display()


class StaffLeaveSerializer(serializers.ModelSerializer):
    staff_name = serializers.SerializerMethodField()
    leave_type_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    days = serializers.IntegerField(read_only=True)

    class Meta:
        model = StaffLeave
        fields = "__all__"
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_staff_name(self, obj):
        return f"{obj.staff.user.last_name} {obj.staff.user.first_name}"

    def get_leave_type_label(self, obj):
        return obj.get_leave_type_display()

    def get_status_label(self, obj):
        return obj.get_status_display()

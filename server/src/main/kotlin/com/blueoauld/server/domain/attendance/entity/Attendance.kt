package com.blueoauld.server.domain.attendance.entity

import com.blueoauld.server.domain.member.entity.Member
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.LocalDate

@Entity
@Table(
    name = "attendance",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_attendance_phone_number_attended_on",
            columnNames = ["phone_number", "attended_on"],
        ),
    ],
    indexes = [
        Index(name = "idx_attendance_member_id_attended_on", columnList = "member_id, attended_on"),
    ],
)
class Attendance(

    @Column(name = "phone_number", nullable = false, updatable = false, length = Member.PHONE_NUMBER_LENGTH)
    val phoneNumber: String,

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Column(name = "attended_on", nullable = false, updatable = false)
    val attendedOn: LocalDate,
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}

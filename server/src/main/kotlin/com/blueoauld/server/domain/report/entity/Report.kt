package com.blueoauld.server.domain.report.entity

import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

@Entity
@Table(
    name = "report",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_report_reporter_id_reported_member_id",
            columnNames = ["reporter_id", "reported_member_id"]
        ),
    ],
    indexes = [Index(name = "idx_report_reported_member_id", columnList = "reported_member_id")],
)
class Report(

    @Column(name = "reporter_id", nullable = false, updatable = false)
    val reporterId: Long,

    @Column(name = "reported_member_id", nullable = false, updatable = false)
    val reportedMemberId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false)
    val reason: ReportReason,

    @Column(name = "detail", length = DETAIL_MAX_LENGTH)
    val detail: String? = null,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val DETAIL_MAX_LENGTH = 1000
        const val PHOTO_MAX_COUNT = 6
    }
}

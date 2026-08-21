package com.blueoauld.server.domain.worry.entity

import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

@Entity
@Table(
    name = "worry_comment_report",
    indexes = [Index(name = "idx_worry_comment_report_comment_id", columnList = "comment_id")],
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_worry_comment_report_reporter_id_comment_id",
            columnNames = ["reporter_id", "comment_id"],
        ),
    ],
)
class WorryCommentReport(

    @Column(name = "reporter_id", nullable = false, updatable = false)
    val reporterId: Long,

    @Column(name = "comment_id", nullable = false, updatable = false)
    val commentId: Long,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}

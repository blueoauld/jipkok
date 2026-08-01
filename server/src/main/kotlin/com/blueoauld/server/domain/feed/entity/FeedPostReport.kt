package com.blueoauld.server.domain.feed.entity

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
    name = "feed_post_report",
    indexes = [Index(name = "idx_feed_post_report_post_id", columnList = "post_id")],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_feed_post_report_reporter_id_post_id", columnNames = ["reporter_id", "post_id"]),
    ],
)
class FeedPostReport(

    @Column(name = "reporter_id", nullable = false, updatable = false)
    val reporterId: Long,

    @Column(name = "post_id", nullable = false, updatable = false)
    val postId: Long,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}

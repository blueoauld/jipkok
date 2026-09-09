package com.blueoauld.server.domain.diary.entity

import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.LocalDate

@Entity
@Table(
    name = "diary",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_diary_member_id_entry_date", columnNames = ["member_id", "entry_date"]),
    ],
)
class Diary(

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Column(name = "entry_date", nullable = false, updatable = false)
    val entryDate: LocalDate,

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    var content: String,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}

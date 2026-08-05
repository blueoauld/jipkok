package com.blueoauld.server.domain.member.entity

import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table

@Entity
@Table(
    name = "nickname_history",
    indexes = [
        Index(name = "idx_nickname_history_member_id", columnList = "member_id"),
        Index(name = "idx_nickname_history_nickname", columnList = "nickname"),
    ],
)
class NicknameHistory(

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Column(name = "nickname", nullable = false, updatable = false, length = Member.NICKNAME_MAX_LENGTH)
    val nickname: String,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}

package com.blueoauld.server.domain.block.entity

import com.blueoauld.server.domain.member.entity.Member
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
    name = "contact_block",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_contact_block_member_id_phone_number",
            columnNames = ["member_id", "phone_number"],
        ),
    ],
    indexes = [
        Index(name = "idx_contact_block_phone_number", columnList = "phone_number"),
    ],
)
class ContactBlock(

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Column(name = "phone_number", nullable = false, updatable = false, length = Member.PHONE_NUMBER_LENGTH)
    val phoneNumber: String,

    @Column(name = "memo", updatable = false, length = MEMO_MAX_LENGTH)
    val memo: String? = null,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val MAX_PER_MEMBER = 100
        const val MEMO_MAX_LENGTH = 30
    }
}

package com.blueoauld.server.domain.block.entity

import com.blueoauld.server.domain.block.service.PhoneHasher
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
            name = "uk_contact_block_member_id_phone_hash",
            columnNames = ["member_id", "phone_hash"],
        ),
    ],
    indexes = [
        Index(name = "idx_contact_block_phone_hash", columnList = "phone_hash"),
    ],
)
class ContactBlock(

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Column(name = "phone_hash", nullable = false, updatable = false, length = PhoneHasher.HASH_LENGTH)
    val phoneHash: String,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}

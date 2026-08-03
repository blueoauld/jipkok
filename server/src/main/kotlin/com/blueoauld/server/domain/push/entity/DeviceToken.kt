package com.blueoauld.server.domain.push.entity

import com.blueoauld.server.domain.push.entity.type.DevicePlatform
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
    name = "device_token",
    uniqueConstraints = [UniqueConstraint(name = "uk_device_token_token", columnNames = ["token"])],
    indexes = [Index(name = "idx_device_token_member_id", columnList = "member_id")],
)
class DeviceToken(

    @Column(name = "member_id", nullable = false)
    var memberId: Long,

    @Column(name = "token", nullable = false, updatable = false, length = TOKEN_MAX_LENGTH)
    val token: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "platform", nullable = false)
    var platform: DevicePlatform,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val TOKEN_MAX_LENGTH = 255
    }
}

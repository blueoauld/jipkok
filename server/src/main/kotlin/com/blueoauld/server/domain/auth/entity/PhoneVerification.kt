package com.blueoauld.server.domain.auth.entity

import com.blueoauld.server.domain.auth.entity.type.VerificationPurpose
import com.blueoauld.server.domain.member.entity.Member
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(
    name = "phone_verification",
    indexes = [
        Index(name = "idx_phone_verification_phone_number_issued_at", columnList = "phone_number, issued_at"),
        Index(name = "idx_phone_verification_ip_address_issued_at", columnList = "ip_address, issued_at"),
    ],
)
class PhoneVerification(

    @Column(name = "phone_number", nullable = false, length = Member.PHONE_NUMBER_LENGTH)
    val phoneNumber: String,

    @Column(name = "code", nullable = false, length = CODE_LENGTH)
    val code: String,

    @Column(name = "ip_address", nullable = false, length = IP_ADDRESS_LENGTH)
    val ipAddress: String,

    @Column(name = "issued_at", nullable = false)
    val issuedAt: Instant,

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false, length = PURPOSE_LENGTH)
    val purpose: VerificationPurpose,
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    @Column(name = "attempt_count", nullable = false)
    var attemptCount: Int = 0
        protected set

    @Column(name = "used_at")
    var usedAt: Instant? = null
        protected set

    fun increaseAttemptCount() {
        attemptCount++
    }

    fun use(now: Instant) {
        usedAt = now
    }

    companion object {

        const val CODE_LENGTH = 6
        const val CODE_PATTERN = "^\\d{$CODE_LENGTH}$"
        const val IP_ADDRESS_LENGTH = 45
        const val PURPOSE_LENGTH = 20
    }
}

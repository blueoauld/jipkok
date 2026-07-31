package com.blueoauld.server.domain.auth.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
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

    @Column(name = "phone_number", nullable = false, length = PHONE_NUMBER_LENGTH)
    val phoneNumber: String,

    @Column(name = "code", nullable = false, length = CODE_LENGTH)
    val code: String,

    @Column(name = "ip_address", nullable = false, length = IP_ADDRESS_LENGTH)
    val ipAddress: String,

    @Column(name = "issued_at", nullable = false)
    val issuedAt: Instant,
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val PHONE_NUMBER_LENGTH = 11
        const val CODE_LENGTH = 6
        const val IP_ADDRESS_LENGTH = 45
    }
}

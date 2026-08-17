package com.blueoauld.server.domain.auth.repository

import com.blueoauld.server.domain.auth.entity.PhoneVerification
import com.blueoauld.server.domain.auth.entity.type.VerificationPurpose
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface PhoneVerificationRepository : JpaRepository<PhoneVerification, Long> {

    fun findFirstByPhoneNumberOrderByIssuedAtDesc(phoneNumber: String): PhoneVerification?

    fun findFirstByPhoneNumberAndPurposeOrderByIssuedAtDesc(
        phoneNumber: String,
        purpose: VerificationPurpose,
    ): PhoneVerification?

    fun countByPhoneNumberAndIssuedAtGreaterThanEqual(phoneNumber: String, since: Instant): Long

    fun countByIpAddressAndIssuedAtGreaterThanEqual(ipAddress: String, since: Instant): Long

    @Modifying
    @Query("delete from PhoneVerification v where v.issuedAt < :threshold")
    fun deleteAllIssuedBefore(@Param("threshold") threshold: Instant): Int
}

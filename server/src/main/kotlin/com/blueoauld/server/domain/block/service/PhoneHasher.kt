package com.blueoauld.server.domain.block.service

import com.blueoauld.server.global.properties.ContactBlockProperties
import org.springframework.stereotype.Component
import java.util.HexFormat
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

@Component
class PhoneHasher(

    contactBlockProperties: ContactBlockProperties,
) {

    init {
        require(contactBlockProperties.secret.isNotBlank()) { "contact-block.secret이 비어 있다." }
    }

    private val key = SecretKeySpec(contactBlockProperties.secret.toByteArray(), ALGORITHM)

    fun hash(phoneNumber: String): String {
        val mac = Mac.getInstance(ALGORITHM)
        mac.init(key)

        return HexFormat.of().formatHex(mac.doFinal(phoneNumber.toByteArray()))
    }

    companion object {

        private const val ALGORITHM = "HmacSHA256"
        const val HASH_LENGTH = 64
    }
}

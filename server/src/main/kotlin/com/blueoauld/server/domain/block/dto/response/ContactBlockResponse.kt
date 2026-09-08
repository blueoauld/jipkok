package com.blueoauld.server.domain.block.dto.response

data class ContactBlockResponse(

    val contactBlockId: Long,
    val phoneNumber: String,
    val memo: String?,
)

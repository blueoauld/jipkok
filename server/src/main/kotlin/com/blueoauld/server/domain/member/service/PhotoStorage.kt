package com.blueoauld.server.domain.member.service

interface PhotoStorage {

    fun createUploadUrl(objectKey: String, contentType: String): String

    fun toPublicUrl(objectKey: String): String

    fun createSignedViewUrl(objectKey: String): String

    fun delete(objectKeys: List<String>)
}

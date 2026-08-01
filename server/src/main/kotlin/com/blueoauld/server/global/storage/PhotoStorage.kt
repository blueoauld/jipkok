package com.blueoauld.server.global.storage

interface PhotoStorage {

    fun createUploadUrl(objectKey: String, contentType: String): String

    fun toPublicUrl(objectKey: String): String

    fun createSignedViewUrl(objectKey: String): String

    fun delete(objectKeys: List<String>)
}

package com.blueoauld.server.global.storage.service

interface PhotoStorage {

    fun createUploadUrl(objectKey: String, contentType: String): String

    fun toPublicUrl(objectKey: String): String

    fun createSignedViewUrl(objectKey: String): String

    fun copy(sourceKey: String, targetKey: String)

    fun delete(objectKeys: List<String>)
}

package com.blueoauld.server.global.storage.service

import com.blueoauld.server.global.storage.dto.StoredObject

interface PhotoStorage {

    fun createUploadUrl(objectKey: String, contentType: String): String

    fun toPublicUrl(objectKey: String): String

    fun createSignedViewUrl(objectKey: String): String

    fun head(objectKey: String): StoredObject?

    fun copy(sourceKey: String, targetKey: String)

    fun delete(objectKeys: List<String>)
}

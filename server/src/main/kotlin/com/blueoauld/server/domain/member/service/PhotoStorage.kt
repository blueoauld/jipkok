package com.blueoauld.server.domain.member.service

interface PhotoStorage {

    fun createUploadUrl(objectKey: String, contentType: String): String

    fun delete(objectKeys: List<String>)
}

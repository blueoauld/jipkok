package com.blueoauld.server.domain.member.service

fun interface PhotoStorage {

    fun createUploadUrl(objectKey: String, contentType: String): String
}

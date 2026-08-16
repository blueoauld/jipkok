package com.blueoauld.server.domain.appversion.service

import com.blueoauld.server.domain.appversion.dto.response.AppVersionResponse
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import com.blueoauld.server.global.properties.AppVersionProperties
import org.springframework.stereotype.Service

@Service
class AppVersionService(

    private val appVersionProperties: AppVersionProperties,
) {

    fun findLatest(platform: DevicePlatform): AppVersionResponse {
        val store = when (platform) {
            DevicePlatform.IOS -> appVersionProperties.ios
            DevicePlatform.ANDROID -> appVersionProperties.android
        }

        return AppVersionResponse(store.latest, store.url)
    }
}

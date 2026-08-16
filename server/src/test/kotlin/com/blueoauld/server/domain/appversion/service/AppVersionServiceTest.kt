package com.blueoauld.server.domain.appversion.service

import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import com.blueoauld.server.global.properties.AppVersionProperties
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class AppVersionServiceTest {

    private val appVersionService = AppVersionService(
        AppVersionProperties(
            ios = AppVersionProperties.Store(IOS_LATEST, IOS_URL),
            android = AppVersionProperties.Store(ANDROID_LATEST, ANDROID_URL),
        ),
    )

    @Test
    fun `iOS는 앱스토어 버전과 주소를 준다`() {
        // when
        val response = appVersionService.findLatest(DevicePlatform.IOS)

        // then
        assertThat(response.latestVersion).isEqualTo(IOS_LATEST)
        assertThat(response.storeUrl).isEqualTo(IOS_URL)
    }

    @Test
    fun `안드로이드는 플레이스토어 버전과 주소를 준다`() {
        // when
        val response = appVersionService.findLatest(DevicePlatform.ANDROID)

        // then
        assertThat(response.latestVersion).isEqualTo(ANDROID_LATEST)
        assertThat(response.storeUrl).isEqualTo(ANDROID_URL)
    }

    companion object {

        private const val IOS_LATEST = "1.2.0"
        private const val IOS_URL = "https://apps.apple.com/app/id1"
        private const val ANDROID_LATEST = "1.1.0"
        private const val ANDROID_URL = "https://play.google.com/store/apps/details?id=com.blueoauld.jipkok"
    }
}

package com.blueoauld.server.global.web

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletRequest

class ClientIpTest {

    @Test
    fun `클라우드플레어가 알려준 주소를 쓴다`() {
        // given
        val request = MockHttpServletRequest()
        request.remoteAddr = PROXY_IP
        request.addHeader("CF-Connecting-IP", CLIENT_IP)

        // when, then
        assertThat(request.clientIp()).isEqualTo(CLIENT_IP)
    }

    @Test
    fun `알려준 주소가 없으면 접속한 주소를 쓴다`() {
        // given
        val request = MockHttpServletRequest()
        request.remoteAddr = CLIENT_IP

        // when, then
        assertThat(request.clientIp()).isEqualTo(CLIENT_IP)
    }

    @Test
    fun `알려준 주소가 비어 있으면 접속한 주소를 쓴다`() {
        // given
        val request = MockHttpServletRequest()
        request.remoteAddr = CLIENT_IP
        request.addHeader("CF-Connecting-IP", " ")

        // when, then
        assertThat(request.clientIp()).isEqualTo(CLIENT_IP)
    }

    companion object {

        private const val CLIENT_IP = "203.0.113.7"
        private const val PROXY_IP = "127.0.0.1"
    }
}

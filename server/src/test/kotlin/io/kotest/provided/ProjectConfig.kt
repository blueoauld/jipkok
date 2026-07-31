package io.kotest.provided

import io.kotest.core.config.AbstractProjectConfig
import io.kotest.core.extensions.Extension
import io.kotest.extensions.spring.SpringExtension

/**
 * 코테스트 전역 설정. [SpringExtension]을 여기서 등록해야 스펙 생성자 주입이 동작한다.
 */
object ProjectConfig : AbstractProjectConfig() {

    override val extensions: List<Extension> = listOf(SpringExtension())
}

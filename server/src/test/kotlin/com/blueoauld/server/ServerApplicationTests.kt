package com.blueoauld.server

import io.kotest.core.spec.style.BehaviorSpec
import io.kotest.matchers.shouldNotBe
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.ApplicationContext

@SpringBootTest
class ServerApplicationTests(

    @Autowired private val applicationContext: ApplicationContext,
) : BehaviorSpec({

    given("애플리케이션이 구성되어 있을 때") {
        `when`("스프링 컨텍스트를 로딩하면") {
            then("정상적으로 기동된다") {
                applicationContext shouldNotBe null
            }
        }
    }
})

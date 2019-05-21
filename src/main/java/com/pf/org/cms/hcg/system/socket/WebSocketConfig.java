package com.pf.org.cms.hcg.system.socket;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;

/***
 * 配置ServerEndpointExporter，配置后会自动注册所有“@ServerEndpoint”注解声明的Websocket Endpoint
 */
@Configuration
public class WebSocketConfig {

    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        return new ServerEndpointExporter();
    }
}



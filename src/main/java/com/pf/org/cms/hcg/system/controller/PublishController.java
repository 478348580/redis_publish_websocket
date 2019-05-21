package com.pf.org.cms.hcg.system.controller;


import com.pf.org.cms.hcg.system.publish.RedisMessageListener;
import com.pf.org.cms.hcg.system.publish.SendMessageService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;


@Api("redis发布与订阅")
@Controller
@RequestMapping("/redis/*")
public class PublishController {

    /**
     * 注入刚才redisConfig配置的监听
     */
    @Autowired
    RedisMessageListenerContainer redisMessageListenerContainer;

    @Autowired
    private RedisMessageListener redisMessageListener;

    @Autowired
    SendMessageService messageService;


    /***
     * 一次向主题里面发送一条消息
     * @param message
     * @return
     */
    @GetMapping("/publish")
    @ResponseBody
    @ApiImplicitParams({
            @ApiImplicitParam(name = "message", value = "message", required = true, paramType = "query", dataType = "String")
    })
    public String publicMessage(@RequestParam("message") String message) {
        messageService.sendMessage("chat", message);
        return "success";
    }


    /***
     * 订阅主题
     * @param subscribeTopic
     * @param userId
     * @return
     */
    @GetMapping("/subscribe")
    @ResponseBody
    public String subscribe(
            @RequestParam("subscribeTopic") String subscribeTopic, @RequestParam(value = "userId", required = true) String userId) {
        System.out.println("用户ID是的:   " + userId + "    订阅了话题：" + subscribeTopic);
        //设置监听listener
        redisMessageListener = new RedisMessageListener();
        redisMessageListener.setUserId(userId);
        //设置订阅topic
        redisMessageListenerContainer.addMessageListener(redisMessageListener, new PatternTopic(subscribeTopic));
        return "success";
    }


    /***
     * for循环里面一直往主题里面发消息，或者到时候用定时任务做，这些都没有问题
     * @return
     */
    @GetMapping("/publishFor")
    @ResponseBody

    public String publicMessageFor() {

        long start = System.currentTimeMillis();
        for (int i = 0; i < 10; i++) {
            try {
                Thread.sleep(10000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            messageService.sendMessage("chat", "这是第：   " + i + "  条消息,共有10条，10秒一条");
        }


        return "100条消息发送完成";
    }
}

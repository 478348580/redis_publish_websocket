package com.pf.org.cms.hcg.system.controller;


import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.subject.Subject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.util.Date;
import java.util.HashMap;

@Controller
public class HtmlController {

    private static final Logger log = LoggerFactory.getLogger(HtmlController.class);

    @GetMapping("/login")
    public String getLoginHtml() {
        System.out.println("---------------------login");
        return "user/login";
    }


    @GetMapping("/logout")
    public String getLogoutHtml() {
        System.out.println("---------------------logout");
        Subject subject = SecurityUtils.getSubject();
        subject.logout();
        return "redirect:/login";
    }


    @GetMapping("/admin")
    public String unAuthorize() {
        System.out.println("---------------------admin");
        return "base/admin";
    }

    @GetMapping("/unauthorize")
    public String unauthorize() {
        System.out.println("---------------------admin");
        return "base/unauthorized";
    }

    @ApiOperation(value = "用户登陆验证", notes = "swagger测试接口", tags = "user", httpMethod = "GET")
    //用户用户名和密码MD5加密后的验证
    @RequestMapping(value = "/userLogin", method = RequestMethod.GET)
    @ResponseBody
    public String authenticate(
            @RequestParam("loginName") String loginName,
            @RequestParam("password") String password,
            HttpServletRequest request,
            HttpSession session, HttpServletResponse response) {

        //把前端输入的username和password封装为token
        UsernamePasswordToken token = new UsernamePasswordToken(loginName, password);
        // 认证身份
        Subject subject = SecurityUtils.getSubject();
        try {
            subject.login(token);
            System.out.println(subject.getPreviousPrincipals());
            System.out.println(subject.getPrincipals());
            System.out.println(subject.getPrincipal());
            session.setAttribute("user", subject.getPrincipals().toString());
            log.info("登陆成功");
            return "success";
        } catch (Exception e) {
            log.info("登陆失败");
            return "false";
        }


    }
}

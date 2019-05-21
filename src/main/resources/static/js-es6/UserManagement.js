/*表格*/
window.nameNew;
window.confirmNew;
window.pwdNew;
window.editUserId;
$(window).resize(function () {
  $("#user-table").bootstrapTable('resetView');
});
// 判断是否为管理员
$.ajax({ 
    url: "/user/isAdmin",
    type: "POST",
    data: {name:""},
    dataType: "json",
    success: function(data){
        if (data.success){
            $("#user-manager").show();
        };
    }
})
// 点击tab签
$('.UserManagement .change-li').on('click', function() {
    $(this).addClass('choosed').siblings('li').removeClass('choosed');
    $('.UserManagement .change-li').find('.default').show().siblings('.selected').hide();
    $(this).find('.default').hide().siblings('.selected').show();
    var index = $(this).index();
    $('.cont-right').eq(index).show().siblings('.cont-right').hide();
    // 面包屑
    var text = $(this).find('.text').text();
    $('.directory-address li').eq(1).html(text);
});

//修改资料 更改密码的表单
$('#modify-form').bootstrapValidator({
　　　　　　　message: 'This value is not valid',
    feedbackIcons: {
        　　　　　　　　valid: 'glyphicon glyphicon-ok',
        　　　　　　　　invalid: 'glyphicon glyphicon-remove',
        　　　　　　　　validating: 'glyphicon glyphicon-refresh'
    　　　　　　　　   },
    fields: {
        currPwd: {
            validators: {
                notEmpty: {
                    message: '密码不能为空'
                },
                
            },
        },
        newPwd: {
            validators: {
                stringLength: {
                    min: 3,
                    max: 12,
                    message: '新密码长度须在3-12位之间'
                },
                regexp: {
                    regexp: /^[a-zA-Z0-9]+$/,
                    message: '密码只能由字母、数字组成'
                },
                identical: {
                    field: 'confirmNewPwd',
                    message: '两次密码不一致'
                },
                notEmpty: {
                    message: '密码不能为空'
                },
            }
        },
        confirmNewPwd: {
            validators: {
                identical: {
                    field: 'newPwd',
                    message: '两次密码不一致'
                },
                notEmpty: {
                    message: '密码不能为空'
                },
            }
        }
    },
    submitHandler: function (validator, form, submitButton) {
        var pwd = $('#EnterPwd').val();
        var newPwd = $('#EnterNewPwd').val();
        updateCredential();
    }
});

//验证添加用户和编辑用户的表单
$('#new-form').bootstrapValidator({
　　　　　　　message: 'This value is not valid',
        feedbackIcons: {
            　　　　　　　　valid: 'glyphicon glyphicon-ok',
            　　　　　　　　invalid: 'glyphicon glyphicon-remove',
            　　　　　　　　validating: 'glyphicon glyphicon-refresh'
        　　　　　　　　   },
        fields: {
            add_Name: {
                validators: {
                    stringLength: {
                        min: 3,
                        max: 12,
                        message: '用户名长度须在3-12位之间'
                    },
                    regexp: {
                        regexp: /^[a-zA-Z0-9]+$/,
                        message: '用户名只能由字母、数字组成'
                    },
                    notEmpty: {
                        message: '用户名不能为空'
                    },
                },
            },
            add_Pwd: {
                validators: {
                    notEmpty: {
                        message: '密码不能为空'
                    },
                    stringLength: {
                        min: 3,
                        max: 12,
                        message: '密码长度须在3-12位之间'
                    },
                    regexp: {
                        regexp: /^[a-zA-Z0-9]+$/,
                        message: '密码只能由字母、数字组成'
                    },
                    identical: {
                        field: 'add_confirmPwd',
                        message: '两次密码不一致'
                    },
                }
            },
            add_confirmPwd: {
                validators: {
                    notEmpty: {
                        message: '密码不能为空'
                    },
                    identical: {
                        field: 'add_Pwd',
                        message: '两次密码不一致'
                    },
                }
            }
        },
        submitHandler: function (validator, form, submitButton) {
            var arr = $('#newProjectModal').attr('class').split(' ');
            if (arr.indexOf('newUser') > -1){
                newUserRequest();
            } else if(arr.indexOf('editUser') > -1){
                updateUserRequest();
            }
        }
});

//bootstrapTable里用到的function
window.operateEvents = {
    'click .pointer-icon.del': function (e, value, row, index) {
    swal({ 
        title: "确定删除" + row.username + "吗？", 
        type: "warning",
        showCancelButton: true, 
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "确定删除！", 
        cancelButtonText: "取消删除！",
        closeOnConfirm: false, 
    },
    function(){ 
            $.ajax({
                url : "/user/deleteUserData",
                type : "DELETE",
                dataType : "json",
                data : {
                    "deleteUserId" : row.userid,
                },
                success : function(data) {
                    // 删除成功后刷新页面
                    swal("删除！", row.username + "已被删除。",
                    "success"); 
                    $('#user-table').bootstrapTable('refresh');
                },
                error : function() {
                    swal("取消！", "删除失败:)",
                    "error"); 
                },
            });
    });
  },
}

initTBLE();

//生成bootstraptable
function initTBLE() {
    /*用户表*/
    $('#user-table').bootstrapTable({
        url: '/user/queryUserData',
        queryParamsType: '',              //默认值为 'limit' ,在默认情况下 传给服务端的参数为：offset,limit,sort
        queryParams: function (params) {
            return {
                userName: $('#userFilterInput').val(),
                limit: params.pageSize,
                page: --params.pageNumber
            }
        },
        method: "get",
        locale: 'zh-CN',
        pagination: true,
        sidePagination: "server",                   //是否显示行间隔色
        paginationUseIntermediate: true,
        cache: false,
        classes: 'table table-hover right-table',  //按钮式
        paginationPreText: "上一页",
        paginationNextText: "下一页",
        paginationLoop: false,
        showPaginationSwitch: false,
        undefinedText: '',
        buttonsAlign: "right",
        columns: [
            {checkbox: true},
            {title: '用户名称',align: 'center',field: 'username',class: 'usermanagement-table2'},
            {title: '密码',align: 'center',field: 'userpassword',class: 'usermanagement-table3',
                formatter:function( value,row,index ){
                    return '***';
                }},
            {title: '注册时间',align: 'center',field: 'userregdate',class: 'usermanagement-table4',
                formatter:function( value,row,index ){
                    return timeChrono(row.userregdate);
                }},
            {title: '最后登录时间',align: 'center',field: 'userlastlogin',class: 'usermanagement-table5',
                formatter:function( value,row,index ){
                    return timeChrono(row.userlastlogin);
                }},
            {title: '项目数',align: 'center',field: 'userprojectcount',class: 'usermanagement-table6'},
            {title: '组件数',align: 'center',field: 'usermodulecount',class: 'usermanagement-table7'},
            {title: '漏洞数',align: 'center',field: 'userbugcount',class: 'usermanagement-table8'},
            {title: '',align: 'center',field: '',class: 'usermanagement-table9 editUser-btn',
                formatter:function( value,row,index ){
                    var html = "<img id='edit' data-target='#newProjectModal' data-toggle='modal' src='../assets/func_img/edit-icon.png' alt=''>" ;
                    return html;
                }},
            {title: '',align: 'center',field: 'button',class: 'usermanagement-table10',
                events: 'operateEvents',
                formatter:function( value,row,index ){
                    var html = "<img class='pointer-icon del' src='../assets/func_img/delete-icon.png' alt=''>";
                    return html;
                }
            }
        ],
        responseHandler: function(res){
            res.data.total = res.data.totalRowSize;
            transformObjKey(res.data.rows);
            if (res.data.rows == undefined){//后端若没搜索到用户则返回一个不带rows的json，导致bootstraptalbe用之前的rows生成表格，所以加入初始rows的代码
                res.data.rows = [];
                res.data.total = 0;
            }
            return res.data;
        },

        onClickRow:rowFunc
    });
}

//筛选用户
$('#user-search').on('click', function(){
    $('#user-table').bootstrapTable('refresh');
})

//用户选择头像后展示头像
$('#upload').on('change', function(){
    showAvatar(this);
})

//上传头像到服务器
$('#upload').fileupload({
    url: "/user/saveUserMe" + "?userId=" + sessionStorage.getItem("user_id"),
    forceIframeTransport: true,
    // 若指定datatype为json，文件亦可正常上传但是无法进入done或success回调函数
    // 上传完成后的执行逻辑
    add: function (e, data) {
        $("#avatar_submit").on('click', function () {
            data.submit();
        });
    },
    done: function (e, data) {
        // func on done
    },
    success: function(data) {
        // func on success
    },
    fail: function(e,data) {
        // func on fail
    }
    // 上传过程中的回调函数
    //progressall: function (e, data) {
    //    console.log("progress");
    //}
});

//建立一个可存取到file的url
function getObjectURL(file) {
    var url = null;
    if (window.createObjectURL != undefined) { // basic
        url = window.createObjectURL(file);
    } else if (window.URL != undefined) { // mozilla(firefox)
        url = window.URL.createObjectURL(file);
    } else if (window.webkitURL != undefined) { // webkit or chrome
        url = window.webkitURL.createObjectURL(file);
    }
    return url;
}

//点击取消按钮
$('#new-cancel').click(function() {
    $('#new-form').data('bootstrapValidator').resetForm(true);
});

//批量删除用户
$('.cont-right').on('click', '.delete-btn', function(){
    var rows = $('#user-table').bootstrapTable('getSelections');
    swal({ 
        title: "确定删除选中用户吗？", 
        type: "warning",
        showCancelButton: true, 
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "确定删除！", 
        cancelButtonText: "取消删除！",
        closeOnConfirm: false, 
    },
    function(){
        var userlist = [];
        for (var i in rows){
            userlist.push(rows[i].userid);
        }

        if (userlist.length > 0){
            $.ajax({
                url : "/user/deleteByUserIdList",
                type : "DELETE",
                dataType : "json",
                data : JSON.stringify({
                    adminId : sessionStorage.getItem('user_id'),
                    userIdList:userlist
                }),
                contentType:"application/json",
                success : function(data) {
                    swal("删除成功","success"); 
                    $('#user-table').bootstrapTable('refresh');
                },
                error : function() {
                    swal("删除失败!", " ",
                    "error"); 
                },
            });
        } else {
            swal("没有用户被选中");
        }
    });
})

//添加用户点击
window.oldName = "";
$('.add-btn').on('click',function(){
    window.nameNew = false;
    window.confirmNew = false;
    window.pwdNew = false;
    $('#newProjectModal').find('.modal-header').html('添加用户');
    $('#newProjectModal').addClass('newUser').removeClass('editUser');
    $('#AddName').removeAttr('readonly');
    window.oldName = $('.newUser').find('#AddName').val();
})

/*添加用户时
    * (1)判断用户名格式是否正确（长度，格式，空），正确则请求查看用户名是否重复
    * (2)当确认密码为空时，输入密码，判断格式（长度，空），当密码不为空时，输入密码判断是否相等，不相等则显示标注
    * (3)判断密码和确认密码是否相等，不相等则标注
    * (4)点击取消时，清空所有表单信息
    * (5)点击确定时，要判断用户名是否为空，格式是否正确，是否已存在，密码、确定密码是否是否为空，两个密码是否相同，
    *    是，则添加用户，清空表单，关闭弹窗；否，提示信息，不关弹窗
    * */
// (2)验证密码
/*
$('#newProjectModal').on('blur', '#AddNewPwd', function(){
    var newPwd = $(this).val();
    var confirmPwd = $('#AddConfirmPwd').val();
    if(confirmPwd.length == 0){
        if(!newPwd){
            $('#msgNew').show();
            $('#msgNew').text('密码不能为空，请重新输入！');
            window.pwdNew = false;
        }else if(newPwd.length<8){
            $('#msgNew').show();
            $('#msgNew').text('密码长度不能短于8位，请重新输入！');
            window.pwdNew = false;
        }else{
            $('#msgNew').hide();
            $('#msgNew').text('');
            $('#msgConfirm').hide();
            $('#msgConfirm').text('');
            window.pwdNew = true;
        }
    }else{
        if(!newPwd){
            $('#msgNew').show();
            $('#msgNew').text('密码不能为空，请重新输入！');
            window.pwdNew = false;
        }else if(newPwd.length<8){
            $('#msgNew').show();
            $('#msgNew').text('密码长度不能短于8位，请重新输入！');
            window.pwdNew = false;
        }else if(newPwd !== confirmPwd){
            $('#msgConfirm').show();
            $('#msgConfirm').text('两次密码不一致，请重新输入！');
            $('#AddConfirmPwd').val('');
            $('#msgNew').text('');
            window.pwdNew = false;
        }else{
            $('#msgNew').hide();
            $('#msgNew').text('');
            $('#msgConfirm').hide();
            $('#msgConfirm').text('');
            window.pwdNew = true;
        }
    }
})
// (3)验证确认密码
$('#newProjectModal').on('blur', '#AddConfirmPwd', function(){
    var confirmPwd = $(this).val();
    var newPwd = $('#AddNewPwd').val();
    if(confirmPwd && newPwd){
        if(confirmPwd !== newPwd){
            $('#msgConfirm').show();
            $('#msgConfirm').text('两次密码不一致，请重新输入！');
            $(this).val('');
            window.confirmNew = false;
        }else{
            $('#msgConfirm').hide();
            $('#msgConfirm').text('');
            window.confirmNew = true;
        }
    }
})*/

//更改密码请求
function updateCredential(){
    $.ajax({
        type: "POST",
        url: "/user/updateUser",
        dataType: "json",
        data: {
            "oldPassword": $('#EnterPwd').val(),
            "userPassword": $('#EnterNewPwd').val(),
        },
        success: function (data) {
            if (!data.success){
                swal(data.msg)
            } else{
                $('#modify-form').data('bootstrapValidator').resetForm(true);
                swal("成功", "已成功修改密码", "success");
            }
        }
    })
    return;
}

//添加新用户请求
function newUserRequest(){
    $.ajax({
        type: "POST",
        url: "/user/newUser",
        dataType: "json",
        data: {
            "user_name": $("#AddName").val(),
            "user_password": $("#AddConfirmPwd").val(),
        },
        success: function (data) {
            if (data.error_code != 0){
                swal(data.error_code)
                $('#new-form').data('bootstrapValidator').resetForm(true);
            } else{
                $('#new-form').data('bootstrapValidator').resetForm(true);
                $('#newProjectModal').modal('hide');
                $('#user-table').bootstrapTable('refresh');
            }
        }
    })
}

//更新新用户请求，与上面的方法类似，但为了以后扩展的可能性先不合并
function updateUserRequest(){
    $.ajax({
        type: "POST",
        url: "/user/updateUser",
        dataType: "json",
        data: {
            "userPassword": $("#AddConfirmPwd").val(),
            "userId": window.editUserId,
            "adminId": sessionStorage.getItem('user_id'),
        },
        success: function (data) {
            if (!data.success){
                swal(data.msg)
            } else{
                $('#new-form').data('bootstrapValidator').resetForm(true);
                $('#newProjectModal').modal('hide');
                $('#user-table').bootstrapTable('refresh');
            }
        }
    })
}

// 行点击事件,修改密码请求在这里
function rowFunc(row, $element){
    // 编辑用户点击
    var cls = $element.prevObject[0].className.split(' ');
    if(cls.indexOf('editUser-btn') > -1){
        window.editUserId = row.userid;
        var edituser = row.username;
        $('#newProjectModal').find('#AddName').val(edituser);
        $('#newProjectModal').addClass('editUser').removeClass('newUser')
        $('#newProjectModal').find('.modal-header').html('编辑用户信息');
        $('#AddName').attr('readonly','readonly')
        window.oldName = $('.editUser').find('#AddName').val();
        if(window.oldName.length == 0){
            window.nameNew = false;
        }else{
            window.nameNew = true;
        }
    }
}

//选择本地图片后展示头像
function showAvatar(ele){
    var fileObj = $(ele)[0];
    if (fileObj && fileObj.files && fileObj.files[0]){
        var objUrl = getObjectURL(fileObj.files[0]); //获取图片的路径，该路径不是图片在本地的路径
        if (objUrl) {
            $("#pic1,#pic2").attr("src", objUrl); //将图片路径存入src中，显示出图片
        }
    } else {// 处理ie9下的问题
        var file = document.getElementById("upload");
        var pic = document.getElementById("pic1");
        file.select();
        file.blur();
        var dataURL = document.selection.createRange().text;
        pic.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod='scale',src=\"" + dataURL + "\")";
        pic.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
        pic.src=dataURL;
    }
}


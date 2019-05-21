$(document).ready(function () {
    var self = {
        'windowHeight': $(window).height(),
        'secret_svn': JSON.parse(localStorage.getItem('secret_svn')),
        'secret_git': JSON.parse(localStorage.getItem('secret_git')),
        websocketList: []
    };
    var url = "/project/createProject?";
    var projectObj = {};
    init();
    function init() {
        initTable();
        responseHashChange();
        if (self.secret_svn) {
            $('#username-svn').val(self.secret_svn.userName);
            // $('#password-svn').val(self.secret_svn.passWord);
        }
        if (self.secret_git) {
            $('#username-git').val(self.secret_git.userName);
            // $('#password-git').val(self.secret_git.passWord);
        }
    }
    function openSocket () {
        self.websocketList = [];
        self.totalRates = 0;
        if (!("WebSocket" in window)) {
            return;
        }
        self.websocketList.length > 0 && self.websocketList.map(function (item, index) {
            item.close({
                reason: '避免重复打开WebSocket'
            });
        });
        self.projectList.forEach(function (item, index) {
            var rate = item['analysis_rate'];
            if(rate > 0 && rate <100) {
                self.websocketList.push({'websocket': new WebSocket("ws://localhost:8090/html/${item['project_id']}"), 'index': index, 'analysis_rate': rate});
                self.websocketList[self.websocketList.length - 1]['static.websocket.websocket'].onmessage = function (event) {
                    $('#project-table').bootstrapTable('updateCell', {
                        index: self.websocketList[self.websocketList.length - 1]['index'],
                        field: 'analysis_rate',
                        value: event.data
                    });
                    self.websocketList[self.websocketList.length - 1]['analysis_rate'] = event.data;
                    console.log(event);
                    self.totalRates = self.websocketList.reduce(function (accumulator, currentValue) {
                        console.log(accumulator, currentValue.analysis_rate)
                        return Number(accumulator.toString().split('%')[0]) + Number(currentValue.analysis_rate.toString().split('%')[0]);
                    }, 0);
                    $('#progressbar').width('' + self.totalRates/self.websocketList.length + '%');
                    $('#progressbarNum').text(Math.floor(self.totalRates/100) + ' / ' + self.websocketList.length);
                };
            }
        });
    }
    function projectRate () {
        $.ajax({
            url: '/project/projectRate',
            type: 'GET',
            data: {},
            success: function (data) {
                if (data.success && data.data.data && data.data.data.length) {
                    if (data.data.data.length !== self.analysisNum) {
                        $('#project-table').bootstrapTable('refresh');
                        projectBar();
                        self.analysisNum = data.data.data.length;
                    }
                    self.projectCheckList = data.data.data;
                    self.totalProjectProgress = 0;
                    self.projectCheckList.forEach(function (checkItem, checkIndex) {
                        self.totalProjectProgress += checkItem.analysis_rate;
                        self.projectList.forEach(function (item, index) {
                            if (checkItem.project_id === item.project_id && checkItem.analysis_rate !== item.analysis_rate) {
                                $('#project-table').bootstrapTable('updateCell', {
                                    index: index,
                                    field: 'analysis_rate',
                                    value: checkItem.analysis_rate
                                })
                            }
                        })
                    });
                    // $('#progressbar').width('' + self.totalProjectProgress/self.analysisNum + '%');
                    // $('#progressbarNum').text(self.analysisNum + '项目检测中');
                    setTimeout(getProjectCheckList, 3000);
                }
            }
        });
    }
    function getProjectCheckList () {
        throttle(projectRate, 30000, this);
    }
    // 新建项目验证
    $('#newProjectForm').bootstrapValidator({
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {
            projectName: {
                trigger: "blur",
                validators: {
                    notEmpty: {
                        message: '项目名称不能为空'
                    },
                    // remote: {
                    //     type: "post",
                    //     url: '<%=realPath%>/dep/validateBepExist',
                    //     data: function (validator) {
                    //         return {
                    //             name: validator.getFieldElements('dep_name').val(),
                    //             id:validator.getFieldElements('bizDepId').val()
                    //         };
                    //     },
                    //     message: '当前部门已被创建，请修改部门名称!',
                    //     delay: 300
                    // }
                }
            },
            projectVersion: {
                trigger: "blur",
                validators: {
                    notEmpty: {
                        message: '项目版本号不能为空'
                    }
                }
            },
            datetimePicker: {
                validators: {
                    notEmpty: {
                        message: '发布时间不能为空'
                    },
                    date: {
                        format: 'yyyy-MM-dd'
                    }
                }
            },
            importMethod: {
                validators: {
                    notEmpty: {
                        message: '必选一种导入方式'
                    }
                }
            },
        },
        submitHandler: function (validator, form, submitButton) {
            newProjectRequest()
        }
    });
    // 新建项目验证销毁重构
    $('#newProjectModal').on('hidden.bs.modal', function() {
        $(this).find('input[type="importMethod"]').each(function(){
            this.checked = false;
        })
        $('#newProjectForm').data('bootstrapValidator').resetForm(true);
    });
    //datetimepicker日历
    $('#datetimePicker').datetimepicker({
        format: "yyyy-mm-dd",
        autoclose: true,
        language: 'zh-CN',
        pickerPosition: "bottom-right",
        todayHighlight: true,
        minView: "month"
    }).on('hide',function() {
        $('#newProjectForm').data('bootstrapValidator')
            .updateStatus('datetimePicker', 'NOT_VALIDATED',null)
            .validateField('datetimePicker');
    });
    // 新建项目功能
    function newProjectRequest(){
        projectObj = {
            userId: sessionStorage.getItem('user_id')
        };

        projectObj.importType = $("input:radio[name='importMethod']:checked").val();

        switch (projectObj.importType) {
            case 'svn' : {
                projectObj.url = encodeURIComponent($('#svn-address').val());
                projectObj.branchName = $('#branch-svn').val();
                projectObj.userName = $('#username-svn').val();
                projectObj.passWord = $('#password-svn').val();
                $('#svnSaveBtn')[0].checked && localStorage.setItem('secret_svn', JSON.stringify({
                    userName: projectObj.userName
                }))
                break;
            }
            case 'git': {
                projectObj.url = encodeURIComponent($('#git-address').val());
                projectObj.branchName = $('#branch-git').val();
                projectObj.userName = $('#username-git').val();
                projectObj.passWord = $('#password-git').val();
                $('#gitSaveBtn')[0].checked && localStorage.setItem('secret_git', JSON.stringify({
                    userName: projectObj.userName
                }))
                break;
            }
            case 'file':{
                break;
            }
            default:{
                return;
            }
        }

        if (self.uploadMethod == "create"){
            url = "/project/createProject?";
            projectObj.projectName = $('#addProject').val();
            projectObj.projectVersion = $('#version').val();
            projectObj.projectTime = new Date($('#release-time').val()).Format('yyyy-MM-dd');
        } 
        else if (self.uploadMethod == "update") {
            url = "project/originUpdate?";
            projectObj.projectId = self.projectId;
            if (projectObj.importType == 'svn' || projectObj.importType == 'git'){
                if (self.oriUrl != projectObj.url || self.oriBra != projectObj.branchName){
                    projectObj.changeType = "true";
                }
                else {
                    projectObj.changeType = "false";
                }
            }
        } 
        else {
            return;
        }
        
        for (var key in projectObj) {
            if (projectObj[key]) {
                // self.chooseFormData.append(key, projectObj[key]);
                url += key + '=' + projectObj[key] + '&'
            }
        }

        if (projectObj.importType === 'file'){
            $('#uploadCompressedFile').fileupload('option', 'url', url);
            self.fileFormData.submit();
            return;
        }

        $.ajax({
            url: url.slice(0, url.length-1),
            method: "POST",
            data: self.fileFormData,
            contentType: false,
            processData: false,
            cache: false,
            success: function (data) {
                $('#newProjectModal').modal('hide');
                window.location.reload();
            }
        });
    }

    // 上传压缩包到服务器
    $('#uploadCompressedFile').fileupload({
        //url: "/user/saveUserMe" + "?userId=" + sessionStorage.getItem("user_id"),
        forceIframeTransport: true,
        // 若指定datatype为json，文件亦可正常上传但是无法进入done或success回调函数
        // 上传完成后的执行逻辑
        add: function (e, data) {
            if (isCompressFile(data.files[0].name)) {
                $('#uploadCompressedFileName').text(data.files[0].name);
                self.fileFormData = data;
            } else {
                swal({
                    title: '',
                    text: '必须上传zip或rar文件！',
                    type: 'error'
                })
            }
        },
        done: function (e, data) {
            // func on done
        },
        success: function(data) {
            $('#newProjectModal').modal('hide');
            window.location.reload();
            // func on success
        },
        fail: function(e,data) {
            console.log("fail");
            // func on fail
        }
        // 上传过程中的回调函数，据说可以用于展示上传进度
        //progressall: function (e, data) {
        //    console.log("progress");
        //}
    });
    // 切换tab
    $('.board ul li').on('click', function () {
        $(this).addClass('active').siblings('li').removeClass('active');
        var newHash = 'show=' + $('.div-module').eq($(this).index()).attr('class').split('div-module ')[1];
        if (window.location.hash !== newHash) {
            window.location.hash = newHash;
            responseHashChange();
        }
    });
    // hash变化触发tab切换
    function responseHashChange() {
        var tabList = {
            'project': 0,
            'module': 1,
            'bug': 2
        };
        var showTab = hash('show');
        if (showTab) {
            /*项目表*/
            if (showTab === 'project') {
                projectInit && projectInit();
            }
            /*组件表*/
            if (showTab === 'module') {
                componentInit && componentInit();
            }
            /*安全表*/
            if (showTab === 'bug') {
                safetyInit && safetyInit();
            }
            $('.div-module').hide();
            var name = '.div-module.' + showTab;
            $(name).show();
            $('.board ul li').eq([tabList[showTab]]).addClass('active').siblings('li').removeClass('active');
        } else {
            $('.div-module:first').show();
        }
    }
    // 项目页筛选高中低
    $('.project .filter-icon-td').parent('tr').on('click', function() {
        var icon = $(this).children('td:first-child').children('div');
        var bugType = $(this).attr('data-triggerType');
        var bugLevel = $(this).attr('data-level');
        if(icon.hasClass('filter-icon-div')) {
            $(this).parents('table').find('.filter-icon-div').removeClass('filter-icon-div');
            $(this).parents('.project').find('.' + bugType + '_num .loopholes').fadeIn(100);
        }else {
            $(this).parents('table').find('.filter-icon-div').removeClass('filter-icon-div');
            icon.addClass('filter-icon-div');
            $('.project .' + bugType + '_num .loopholes').length && $('.project .' + bugType + '_num .loopholes').fadeOut(100);
            $('.project').find('.' + bugType + bugLevel.split('')[0].toUpperCase()).fadeIn(100);
        }
    });
    /*新建项目弹窗切换方式*/
    $('.list-unstyled>li>.click-no-checked input[type="radio"]').on('click', function () {
        $('.click-no-checked').parent('li').children(':eq(1),:eq(3),:eq(5)').hide();
        $(this).parent('label').parent('.click-no-checked').parent('li').children(':eq(1)').show();
    });

    $('.new-project-btn').on('click', function () {
        resetUploadForm();
    })

    /*表格 start*/
    function initTable () {
        /*项目表*/
        if (hash('show') === null || hash('show') === 'project') {
            projectInit();
        }
        /*组件表*/
        if (hash('show') === 'module') {
            componentInit();
        }
        /*安全表*/
        if (hash('show') === 'bug') {
            safetyInit();
        }
    }
    $('#projectSearch').on('click', function () {
        projectRefresh();
    });
    $('#componentSearch').on('click', function () {
        componentRefresh();
    });
    $('#safetySearch').on('click', function () {
        safetyRefresh();
    });
    // 组件筛选开源闭源
    $('#open-source').on('click', function (e) {
        $('#open-source').toggleClass('source-type');
        $('#closed_source').removeClass('source-type');
        if (self.component_type === 'open') {
            self.component_type = '';
        } else {
            self.component_type = 'open';
        }
        componentRefresh();
    });
    $('#closed_source').on('click', function () {
        $('#closed_source').toggleClass('source-type');
        $('#open-source').removeClass('source-type');
        if (self.component_type === 'close') {
            self.component_type = '';
        } else {
            self.component_type = 'close';
        }
        componentRefresh();
    });
    // 安全筛选漏洞来源
    $('#bug_source').on('click', 'tr', function (e) {
        $(this).toggleClass('bug_source').siblings().removeClass('bug_source');
        if (self.bug_source === e.currentTarget.dataset.source) {
            self.bug_source = '';
        } else {
            self.bug_source = e.currentTarget.dataset.source;
        }
        safetyRefresh();
    });
    // 安全筛选严重程度
    $('#bug_level').on('click', 'tr', function (e) {
        $(this).toggleClass('bug_level').siblings().removeClass('bug_level');
        if (self.bug_level === e.currentTarget.dataset.level) {
            self.bug_level = '';
        } else {
            self.bug_level = e.currentTarget.dataset.level;
        }
        safetyRefresh();
    });
    function projectInit () {
        projectBar();
        $('#project-table').bootstrapTable({
            url: '/project/getProjectList',
            queryParamsType: '',
            queryParams: function (params) {
                return {
                    projectName: $('#projectInput').val(),
                    limit: params.pageSize,
                    page: --params.pageNumber
                }
            },
            method: "get",
            locale: 'zh-CN',
            pagination: true,
            sidePagination: "server",
            paginationUseIntermediate: true,
            striped: false, //是否显示行间隔色
            cache: false,
            classes: 'table table-hover right-table',
            paginationPreText: "上一页",
            paginationNextText: "下一页",
            paginationLoop: false,
            showRefresh: false, //显示刷新
            showPaginationSwitch: false, //是否显示数据条数选择框
            singleSelect: false,
            search: false, //显示搜索框
            buttonsAlign: "right", //按钮对齐方式
            undefinedText: '',
            height: self.windowHeight - 240,
            columns: [
                {title: ' ', align: '',field: 'analysis_rate',class: 'progress-start',
                    events: window.operatEvents = {
                        'click .analysis-start': function(e,value,row,index){
                            $(e.currentTarget).toggleClass('analysis-start');
                            event.stopPropagation();
                            $.ajax({
                                type: "GET",
                                url: '/project/analysisStart',
                                data:{
                                    "projectId": row.project_id
                                },
                                success: function (data) {
                                    if (data.success) {
                                        // getProjectCheckList();
                                    } else {
                                        swal({
                                            title: '项目检测失败，请重试！',
                                            text: '',
                                            type: 'warning'
                                        });
                                    }
                                    $('#project-table').bootstrapTable('refresh');
                                }
                            });
                        },
                        'click .project-reupload': function(e,value,row,index){
                            resetUploadForm(row);
                            $('#newProjectModal').modal('show');
                        }
                    },
                    formatter: function( value,row,index ){
                        var img_type, html, className;
                        img_type = "<img src='../assets/icon/" + row["project_import_type"] + "-icon.png' alt=''>"
                        if (value > 0 && value < 100) {
                            className = 'analysis-progress';
                        } else {
                            className = 'analysis-start analysis-progress';
                        }
                        html = "<div class='" + className + "'></div>" + "<div class='placeholder project-reupload'>" + img_type + "</div>";
                        return html;
                    }
                },
                {title: '项目名称',align: 'center',field: 'project_name',class: 'pro-name',
                    formatter:function( value,row,index ){
                        return "<a class='user-management'>" + row["project_name"] + "</a>" + "<span class='project-name-label'>"+row["project_version"]+"</span>";
                    }
                },
                {title: '项目类型', align: 'center', field: 'project_type',class: '',
                    formatter:function( value,row,index ){
                        var allImage = row["project_type"];
                        if(allImage === null || !allImage){
                            return;
                        }
                        var numImage = allImage.split(",");
                        var html = "";
                        for(var i = 0; i < numImage.length; i++) {
                            html = html + "<img class='icon-img' src='../assets/icon/" + numImage[i].toLowerCase() + "-icon.png' alt='" + numImage[i] +"'>";
                        }
                        return html;
                    }
                },
                {title: '检测时间', align: 'center', field: 'analysis_time',class: '',
                    formatter:function( value,row,index ){
                        if (row['analysis_time'] == null || row['analysis_time'] === undefined){
                            return;
                        }
                        return "<span>" + row['analysis_time'].split("T")[0] + "</span>";
                    }
                },
                {title: '检测状态', align: 'center', field: 'analysis_rate',class: '',
                    formatter:function( value,row,index ){
                        if (!value){
                            return;
                        }
                        return value + '%';
                    }
                },
                {title: '<span title="漏洞涉及函数已被项目程序调用的漏洞">可触发漏洞</span>', align: 'center', field: 'triggerable_bug_high',class: 'trigger_num',
                    formatter:function( value,row,index ){
                        var H,M,L,O;
                        H = M = L = O = '';
                        if(row["triggerable_bug_high"] > 0){
                            H = "<span class='loopholes labelH triggerH'>"+row["triggerable_bug_high"]+"</span>";
                        }
                        if(row["triggerable_bug_middle"] > 0){
                            M = "<span class='loopholes labelM triggerM'>"+row["triggerable_bug_middle"]+"</span>";
                        }
                        if(row["triggerable_bug_low"] > 0){
                            L = "<span class='loopholes labelL triggerL'>"+row["triggerable_bug_low"]+"</span>";
                        }
                        if(row["triggerable_bug_other"] > 0){
                            O = "<span class='loopholes labelO triggerO'>"+row["triggerable_bug_other"]+"</span>";
                        }
                        return H + M + L + O;
                    }
                },
                {title: '所有漏洞', align: 'center', field: 'bug_high',class: 'all_num',
                    formatter:function( value,row,index ){
                        var H,M,L,O;
                        H = M = L = O = '';
                        if(row["bug_high"] > 0){
                            H = "<span class='loopholes labelH allH'>"+row["bug_high"]+"</span>";
                        }
                        if(row["bug_middle"] > 0){
                            M = "<span class='loopholes labelM allM'>"+row["bug_middle"]+"</span>";
                        }
                        if(row["bug_low"] > 0){
                            L = "<span class='loopholes labelL allL'>"+row["bug_low"]+"</span>";
                        }
                        if(row["bug_other"] > 0){
                            O = "<span class='loopholes labelO allO'>"+row["bug_other"]+"</span>";
                        }
                        return H + M + L + O;
                    }
                },
                {title: '图形化', align: 'center', field: 'js_mind',class: '',
                    formatter:function( value,row,index ){
                        return "<img src='../assets/func_img/lct.png'>";
                    }
                },
                {title: ' ', align: 'center', field: 'download',class: '',
                    formatter:function( value,row,index ){
                        // var html = "<a id=\"dlink\"  style=\"display:none;\"></a>\n" +
                            // "<input type=\"button\" onclick=\"tableToExcel('tables', 'name', 'myfile.xls')\" value=\"Export to Excel\">";
                        var html = "<button type='button' class='btn btn-default download-label'><img src='../assets/func_img/user-download-icon.png' alt=''></button>";
                        return html;
                    }
                },
                {title: ' ', align: 'center', field: 'top_time_stamp',class: 'col-istop',
                    formatter:function( value,row,index ){
                        var className = Boolean(value) ? "cancel btn-default" : "topping btn-primary";
                        var text = Boolean(value) ? '取消置顶' : '置顶';
                        var disabled = Boolean(row['your_project']) ? '' : 'disabled';
                        return "<button type='button' class='btn smallBtn " + className + "' " + disabled +">" + text + "</button>";
                    }
                },
                {title: ' ', align: 'center', field: 'deleteProject',class: '',
                    formatter:function( value,row,index ){
                        return "<img class='pointer-icon' src='../assets/func_img/delete-icon.png' alt=''>";
                    }
                }
            ],
            responseHandler: function (res) {
                res.data.total = res.data.totalSize;
                self.projectList = res.data.rows = transformObjKey(res.data.rows, '_');
                // projectRate();
                openSocket();
                return res.data;
            },
            onClickRow: function (row, $element, field) {
                // 近期项目
                if (['project_name', 'triggerable_bug_high', 'bug_high', 'js_mind', 'download'].indexOf(field) > -1 && $element.prevObject[0].children.length > 0) {
                    project_isCheck({
                        proid: row.project_id,
                        type: 'true'
                    });
                }
            },
            onClickCell: function (field, value, row, $element) {
                if (field === 'top_time_stamp') { // 置顶
                    $.ajax({
                        url: '/project/setTop',
                        type: 'GET',
                        data: {
                            projectId: row.project_id,
                            isTop: row.top_time_stamp ? 'false' : 'true'
                        },
                        success: function (data) {
                            projectRefresh();
                        }
                    })
                } else if (field === 'triggerable_bug_high') { // 查看可触发漏洞
                    if ($element[0].children.length > 0) {
                        window.location.href = "CodeSecurityAnalysis28.html?proID=" + row.project_id + '#show=bug';
                    }
                } else if (field === 'bug_high') { // 查看所有漏洞
                    if ($element[0].children.length > 0) {
                        window.location.href = "CodeSecurityAnalysis28.html?proID=" + row.project_id + '#show=bug';
                    }
                } else if (field === 'deleteProject') {
                    swal({
                        title: "请确认是否删除项目 " + row.project_name,
                        text: '此操作将删除项目相关的组件、漏洞',
                        type: 'warning',
                        showCancelButton: true,
                        confirmButtonText: '确定',
                        cancelButtonText: '取消'
                    }, function (bool) {
                        if (bool) {
                            $.ajax({
                                url: '/project/deleteProject',
                                type: 'GET',
                                data: {
                                    projectId: row['project_id']
                                },
                                success: function (data) {
                                    projectRefresh();
                                    projectBar();
                                }
                            });
                        }
                    });
                } else if (field === 'js_mind') {
                    window.location.href = "ProjectMind.html?proID=" + row.project_id;
                } else if (field === 'download') {
                    $.ajax({
                        url: '../project/getProjectExcel',
                        type: 'GET',
                        data: {
                            projectId: row['project_id']
                        },
                        success: function (res) {
                            if (res.success) {
                                var excelTitle = "<tr><th colspan='7'>" + row['project_name'] + "项目检测报告" + "</th></tr>";
                                var excelSum = "<tr><th colspan='7'>" + row['project_name'] + "项目包含" + res['data']['base']['moduleCount'] + "个组件，其中" + res['data']['base']['moduleContainBugCount'] + "个组件内包含漏洞，共" + res['data']['base']['bugCount'] + "个漏洞，具体漏洞详情如下" + "</th></tr>";
                                var excelModuleListHead =
                                    "<tr>" +
                                    "<th>组件名</th>\n" +
                                    "<th>包含漏洞数</th>\n" +
                                    "<th>当前版本</th>\n" +
                                    "<th>最新版本</th>\n" +
                                    "<th>建议版本</th>\n" +
                                    "<th>匹配文件数</th>\n" +
                                    "<th>匹配类型</th>" +
                                    "</tr>";
                                var excelModuleListBody = "";
                                res['data']['moduleList'].forEach(function (item, index, arr) {
                                    excelModuleListBody += "<tr><td>" + item['moduleName'] + "</td>";
                                    excelModuleListBody += "<td>" + item['moduleBugCount'] + "</td>";
                                    excelModuleListBody += "<td>" + item['moduleNowVersion'] + "</td>";
                                    excelModuleListBody += "<td>" + item['moduleNewestVersion'] + "</td>";

                                    excelModuleListBody += "<td>" + item['moduleSuggestVersion'] + "</td>";
                                    excelModuleListBody += "<td>" + item['moduleFileMatch'] + "</td>";
                                    excelModuleListBody += "<td>" + item['moduleMatchType'] + "</td></tr>";
                                });
                                var excelBugListHead = "<tr><th>组件名</th>\n" +
                                    "<th>漏洞名</th>\n" +
                                    "<th>是否为可触发漏洞</th>\n" +
                                    "<th>漏洞级别</th>\n" +
                                    "<th>发现日期</th>\n" +
                                    "<th>修复版本</th>\n" +
                                    "<th>修复时间</th></tr>";
                                var excelBugListBody = "";
                                for (var key in res['data']['bugList']) {
                                    excelBugListBody += "<tr><td rowspan='" + res['data']['bugList'][key].length + "'>" + key + "</td>";
                                    res['data']['bugList'][key].forEach(function (item, index, arr) {
                                        excelBugListBody += "<td>" + item['bugName'] + "</td>";
                                        excelBugListBody += "<td>" + (item['triggerFlag'].toLowerCase() === 'true' ? '是' : '否') + "</td>";
                                        excelBugListBody += "<td>" + bugLevelTransform(item['bugLevel']) + "</td>";
                                        excelBugListBody += "<td>" + (item['bugReleaseDate'].split('T')[0] || '') + "</td>";
                                        excelBugListBody += "<td>" + item['bugFixVersion'] + "</td>";
                                        excelBugListBody += "<td>" + (item['bugFixDate'].split('T')[0] || '') + "</td></tr>";
                                    })
                                }
                                $('#tables').append(excelTitle + excelSum + '<tr></tr>' + excelModuleListHead + excelModuleListBody + '<tr></tr>' + excelBugListHead + excelBugListBody);
                                var isIE = /*@cc_on!@*/false || !!document.documentMode; // this works with IE10 and IE11 both :)
                                self.filename = row['project_name'] + "项目检测报告";
                                if (isIE && typeof Blob === "undefined") {
                                    self.filename += '.xls';
                                }
                                $("#tables").table2excel({
                                    exclude: "",
                                    name: "",
                                    filename: self.filename //do not include extension, IE && not Blob add extension .xls
                                });
                                $('#tables').html('');
                            }
                        }
                    });
                } else if (field === 'project_name' || field === 'triggerable_bug_high' || field === 'bug_high') {
                    window.location.href = "CodeSecurityAnalysis28.html?proID=" + row.project_id;
                }
            }
        });
        projectInit = null;
    }
    function componentInit () {
        componentBar();
        $('#component-table').bootstrapTable({
            url: '/module/getModuleList',
            queryParamsType: '', //默认值为 'limit' ,传给服务端的参数为：offset,limit,sort
            queryParams: function (params) {
                return {
                    key: $('#componentInput').val(),
                    limit: params.pageSize,
                    page: --params.pageNumber,
                    type: self.component_type || ''
                }
            },
            method: "get",
            locale: 'zh-CN',
            pagination: true,
            sidePagination: "server",
            cache: false,
            classes: 'table table-hover right-table',
            paginationPreText: "上一页",
            paginationNextText: "下一页",
            paginationLoop: false,
            showRefresh: false, //显示刷新
            showPaginationSwitch: false, //是否显示数据条数选择框
            singleSelect: false,
            search: false, //显示搜索框
            buttonsAlign: "right", //按钮对齐方式
            undefinedText: '',
            height: self.windowHeight - 240,
            columns: [
                {
                    title: '组件名称',
                    align: 'center',
                    field: 'module_name',
                    formatter: function( value,row,index ){
                        return "<a class='user-management' href='./vulnerability-description.html?modID="+row["module_id"]+"'>" + row["module_name"] + "</a> " + "<span class='project-name-label'>" + row["module_version"] + "</span>";
                    }
                },
                {
                    title: '所属项目',
                    align: 'center',
                    field: 'project_name'
                },
                {
                    title: '组件类型',
                    align: 'center',
                    field: 'module_type',
                    formatter:function( value,row,index ) {
                        if (value.length === 0) {
                            return '暂无';
                        }
                        var numImage = value.split(",");
                        var html = "";
                        for (var i = 0; i < numImage.length; i++) {
                            html = html + "<img class='icon-img' src='../assets/icon/" + numImage[i].toLowerCase() + "-icon.png' alt='" + numImage[i] + "'>";
                        }
                        return html;
                    }
                },
                {
                    title: '组件分类',
                    align: 'center',
                    field: 'module_isopen',
                    formatter: function (value) {
                        var zh = {
                            'open': '开源',
                            'close': '闭源'
                        };
                        return zh[value];
                    }
                },
                {
                    title: '更新时间',
                    align: 'center',
                    field: 'module_newesttime',
                    formatter: function( value ) {
                        if ( value ) {
                            return value.split('T')[0];
                        }
                    }
                },
                {
                    title: '被使用次数',
                    align: 'center',
                    field: 'module_refs',
                    formatter: function( value ,row, index ) {
                        return "<span class='Sphere'>" + Number(row["module_refs"]) + "</span>";
                    }
                },
                {
                    title: '来源',
                    align: 'center',
                    field: 'module_origin',
                    formatter: function (value, row, index) {
                        if (row['module_url']) {
                            return '<a href=' + row['module_url'] + ' target=\'_blank\'>' + value + '</a>';
                        } else {
                            return value;
                        }
                    }
                },
                {
                    title: '漏洞数',
                    align: 'center',
                    field: 'bug_high',
                    formatter:function( value,row,index ){
                        var H, M, L, O;
                        H = M = L = O = '';
                        if(row["bug_high"] > 0){
                            H = "<span class='loopholes labelH'>"+row["bug_high"]+"</span>";
                        }
                        if(row["bug_middle"] > 0){
                            M = "<span class='loopholes labelM'>"+row["bug_middle"]+"</span>";
                        }
                        if(row["bug_low"] > 0){
                            L = "<span class='loopholes labelL'>"+row["bug_low"]+"</span>";
                        }
                        if(row["bug_other"] > 0){
                            O = "<span class='loopholes labelO'>"+row["bug_other"]+"</span>";
                        }
                        return H + M + L + O;
                    }
                },
                {
                    title: '许可证类型',
                    align: 'center',
                    field: 'module_license',
                    formatter: function ( value,row,index ) {
                        return "<span data-target='#GPLModal' data-toggle='modal' style='color: #8181CE; cursor:pointer;'>" + row["module_license"].toUpperCase() + "</span>";
                    }
                },
                {
                    title: '',
                    align: 'center',
                    field: 'top_time_stamp',
                    formatter:function( value,row,index ){
                        if(value) {
                            var html = "<button type='button' class='btn btn-default smallBtn cancel'>取消置顶</button>";
                        } else {
                            html = "<button type='button' class='btn btn-primary smallBtn topping'>置顶</button>";
                        }
                        return html;
                    }
                }
            ],
            onClickCell: function (field, value, row, $element) {
                if (field === 'top_time_stamp') {
                    $.ajax({
                        url: '/module/setModuleTopIndex',
                        type: 'GET',
                        data: {
                            moduleId: row.module_id,
                            istop: value ? 'false' : 'true'
                        },
                        success: function (data) {
                            componentRefresh();
                        }
                    });
                } else if (field === 'module_license') {
                    moduleLicense({
                        licType: value,
                        modalId: 'GPLModal'
                    });
                } else if (field === 'module_origin') {
                    // 组件来源点击啥也不做、有a标签
                } else {
                    window.location.href = "vulnerability-description.html?modID=" + row.module_id;
                }
            },
            responseHandler: function(res){
                res.total = res.data.totalSize || 0;
                res.rows = res.data.rows || [];
                return res;
            }
        });
        componentInit = null;
    }
    function safetyInit () {
        safetyBar();
        $('#safety-table').bootstrapTable({
            url: '/bug/getSafeBugList',
            queryParamsType: '', //默认值为 'limit' ,传给服务端的参数为：offset,limit,sort
            queryParams: function (params) {
                return {
                    key: $('#safetyInput').val(),
                    limit: params.pageSize,
                    page: --params.pageNumber,
                    origin: self.bug_source || '',
                    level: self.bug_level || ''
                }
            },
            method: "get",
            locale: 'zh-CN',
            searchOnEnterKey: true,
            pagination: true,
            sidePagination: "server",
            striped: false, //是否显示行间隔色
            cache: false,
            classes: 'table table-hover right-table',
            paginationPreText: "上一页",
            paginationNextText: "下一页",
            paginationLoop: false,
            showRefresh: false, //显示刷新
            showPaginationSwitch: false, //是否显示数据条数选择框
            singleSelect: false,
            buttonsAlign: "right", //按钮对齐方式
            undefinedText: '',
            height: self.windowHeight - 240,
            columns: [
                {
                    title: '',
                    align: 'center',
                    field: 'bug_category',
                    formatter: function (value,row,index) {
                        return "<span class='ldID " + value.toLowerCase() +"'>"+value+"</span>";
                    }
                },
                {
                    title: '漏洞名称',
                    align: 'center',
                    field: 'bug_name',
                    formatter: function (value, row, index) {
                        value = value || '';
                        return "<a class='user-management'>" + value + "</a>";
                    }
                },
                {
                    title: '发布时间',
                    align: 'center',
                    field: 'bug_releasedate_stamp',
                    formatter: function (value, row, index) {
                        return new Date(Number(value)).Format('yyyy-MM-dd hh:mm:ss');
                    }
                },
                {
                    title: '影响范围',
                    align: 'center',
                    field: 'bug_effect_count',
                    formatter: function(value, row, index) {
                        if (value){
                            return "<a class='user-management'><span class='Sphere'>" + row["bug_effect_count"] + "</span></a>";
                        }
                    }
                },
                {
                    title: '类型',
                    align: 'center',
                    field: 'bug_type'},
                {
                    title: '严重程度',
                    align: 'center',
                    field: 'big_score',
                    formatter: function(value, row, index) {
                        var progressLevel, html;
                        var Num = Number(row["big_score"]);
                        if (Num >= 8) {
                            progressLevel = "progressHigh";
                        } else if (Num >= 4 && Num < 8) {
                            progressLevel = "progressMedium";
                        } else if (0 < Num && Num< 4) {
                            progressLevel = "progressLow";
                        }
                        html = "<span class='progressbar-num'>" + Num + "</span><div class='progressBar'><div class='" + progressLevel + "' style='width: " + Num * 10 + "%;'></div></div>";
                        if (Num == 0) {
                            html = "<span class='progressbar-num'>其他</span><div class='progressBar'><div class='progressOther'></div></div>";
                        }
                        return html;
                    }
                },
                {
                    title: '',
                    align: 'center',
                    field: 'top_time_stamp',
                    formatter:function( value,row,index ){
                        if(value) {
                            var html = "<button type='button' class='btn btn-default smallBtn cancel btnTop'>取消置顶</button>";
                        } else {
                            html = "<button type='button' class='btn btn-primary smallBtn topping btnTop'>置顶</button>";
                        }
                        return html;
                    }
                },
                {
                    title: '',
                    align: 'center',
                    field: 'collection_time_stamp',
                    formatter:function( value,row,index ){
                        var html;
                        if(value) {
                            html = "<button type='button' class='btn btn-default smallBtn collected'><img src='../assets/func_img/collected.png' alt=''>已收藏</button>";
                        } else {
                            html = "<button type='button' class='btn btn-default smallBtn collection'><img src='../assets/func_img/collection.png' alt=''>收藏</button>";
                        }
                        return html;
                    }
                }
            ],
            onClickRow: function (row, $element, field) {
            },
            onClickCell: function (field, value, row, $element) {
                if (field === 'collection_time_stamp') {
                    bug_isfavorites({
                        isFavorite: value ? 'false' : 'true',
                        bugid: row.bug_id,
                        callback: safetyRefresh
                    })
                } else if (field === 'top_time_stamp') {
                    $.ajax({
                        url: '/bug/setSafeBugIndex',
                        type: 'POST',
                        data: {
                            bugId: row.bug_id,
                            isTop: value ? 'false' : 'true'
                        },
                        success: function (data) {
                            data.success && safetyRefresh();
                        }
                    });
                } else {
                    window.location.href = "affected-projects.html?bugID=" + row.bug_id;
                }
            },
            responseHandler: function(res){
                res.total = res.data.totalSize || 0;
                delete res.data.totalSize;
                res.rows = res.data.rows || [];
                delete res.data.rows;
                return res;
            },
        });
        safetyInit = null;
    }
    /*ajax获取项目左侧进度条数值(可触发漏洞，所有漏洞)*/
    function projectBar () {
        $.ajax({
            type: "GET",
            url: "/project/queryProjectErrorCount",
            dataType: "json",
            success: function (data) {
                var tbh = Number(data.data.triggerableCount.triggerableBugHigh);
                var tbm = Number(data.data.triggerableCount.triggerableBugMiddle);
                var tbl = Number(data.data.triggerableCount.triggerableBugLow);
                var tbo = Number(data.data.triggerableCount.triggerableBugOther);
                var bh = Number(data.data.bugCount.bugHigh);
                var bm = Number(data.data.bugCount.bugMiddle);
                var bl = Number(data.data.bugCount.bugLow);
                var bo = Number(data.data.bugCount.bugOther);
                var max1, max2, tbh_html, tbm_html, tbl_html, tbo_html, bh_html, bm_html, bl_html, bo_html, pc_html, pu_html, pd_html, zx_html;
                max1 = Math.max.apply(null, [tbh, tbm, tbl, tbo]);
                max2 = Math.max.apply(null, [bh, bm, bl, bo]);
                triggerableBug();
                allBug();

                /*可触发漏洞*/
                function triggerableBug() {
                    if( max1 === 0 ){
                        tbh_html = "<div class='progressHigh' role='progressbar'></div><span class='progressbar-num'>" + 0 + "</span>";
                        tbm_html = "<div class='progressMedium' role='progressbar'></div><span class='progressbar-num'>" + 0 + "</span>";
                        tbl_html = "<div class='progressLow' role='progressbar'></div> <span class='progressbar-num'>" + 0 + "</span>";
                        tbo_html = "<div class='progressOther' role='progressbar'></div><span class='progressbar-num'>" + 0 + "</span>";
                    }else{
                        tbh_html = "<div class='progressHigh' role='progressbar' style='width: " + 75 * tbh/max1 +"%;'></div>" + "<span class='progressbar-num'>" + tbh + "</span>";
                        tbm_html = "<div class='progressMedium' role='progressbar' style='width: " + 75 * tbm/max1 + "%;'></div>" + "<span class='progressbar-num'>" + tbm + "</span>";
                        tbl_html = "<div class='progressLow' role='progressbar' style='width:" + 75 * tbl/max1 + "%;'></div>" + "<span class='progressbar-num'>" + tbl + "</span>";
                        tbo_html = "<div class='progressOther' role='progressbar' style='width:" + 75 * tbo/max1 + "%;'></div>" + "<span class='progressbar-num'>" + tbo + "</span>";
                    }
                    $(".triggerable-bug-high").html(tbh_html);
                    $(".triggerable-bug-middle").html(tbm_html);
                    $(".triggerable-bug-low").html(tbl_html);
                    $(".triggerable-bug-other").html(tbo_html);

                }
                /*所有漏洞*/
                function allBug() {
                    if( max2 === 0 ){
                        bh_html = "<div class='progressHigh' role='progressbar'></div>" + "<span class='progressbar-num'>" + 0 + "</span>";
                        bm_html = "<div class='progressMedium' role='progressbar'></div>" + "<span class='progressbar-num'>" + 0 + "</span>";
                        bl_html = "<div class='progressLow' role='progressbar'></div>" + "<span class='progressbar-num'>" + 0 + "</span>";
                        bo_html = "<div class='progressOther' role='progressbar'></div>" + "<span class='progressbar-num'>" + 0 + "</span>";
                    }else{
                        bh_html = "<div class='progressHigh' role='progressbar' style='width: " + 75 * bh/max2 +"%;'></div>" + "<span class='progressbar-num'>" + bh + "</span>";
                        bm_html = "<div class='progressMedium' role='progressbar' style='width:" + 75 * bm/max2 + "%;'></div>" + "<span class='progressbar-num'>" + bm + "</span>";
                        bl_html = "<div class='progressLow' role='progressbar' style='width: " + 75 * bl/max2 + "%;'></div>" + "<span class='progressbar-num'>" + bl + "</span>";
                        bo_html = "<div class='progressOther' role='progressbar' style='width:" + 75 * bo/max2 + "%;'></div>" + "<span class='progressbar-num'>" + bo + "</span>";
                    }
                    $(".bug-high").html(bh_html);
                    $(".bug-middle").html(bm_html);
                    $(".bug-low").html(bl_html);
                    $(".bug-other").html(bo_html);
                }
            }
        });
    }
    /*ajax获取组件左侧进度条数值(组件分类)*/
    function componentBar () {
        $.ajax({
            type: "GET",
            url: "/module/getModuleCategory",
            dataType: "json",
            success: function (data) {
                data.data = transformObjKey(data.data, '_');
                var os = Number(data.data.open_source || 0);
                var cs = Number(data.data.closed_source || 0);
                var max, os_html, cs_html;
                if (data.success) {
                    max =  Math.max.apply(null, [os, cs]);
                } else {
                    max = 0;
                }
                Component();
                function Component() {
                    if(max === 0){
                        os_html = "<div class='progressHigh'></div><span class='progressbar-num'>" + 0 + "</span>";
                        cs_html = "<div class='progressLow'></div><span class='progressbar-num'>" + 0 + "</span>";
                    }else{
                        os_html = "<div class='progressHigh' style='width: " + 75 * os / max + "%;'></div><span class='progressbar-num'>" + os + "</span>";
                        cs_html = "<div class='progressMedium' style='width:" + 75 * cs / max + "%;'></div><span class='progressbar-num'>" + cs + "</span>";
                    }
                    $("#open-source").append(os_html);
                    $("#closed_source").append(cs_html);
                }
            }
        });
        componentBar = null;
    }
    /*ajax获取安全左侧进度条数值(漏洞来源，严重程度)*/
    function safetyBar () {
        $.ajax({
            type: "GET",
            url: "/bug/getSafeBugAggregate",
            dataType: "json",
            success: function (data) {
                var cv = Number(data.data.bugOrigin.CVE);
                var vn = Number(data.data.bugOrigin.VnlnDB);
                var co = Number(data.data.bugOrigin.CoNET);
                var bh = Number(data.data.bugLevel.high);
                var bm = Number(data.data.bugLevel.middle);
                var bl = Number(data.data.bugLevel.low);
                var bo = Number(data.data.bugLevel.other);
                var max1, max2, cv_html, vn_html, co_html, bh_html, bm_html, bl_html, bo_html;
                max1 =  Math.max.apply(null, [cv, vn, co]);
                max2 =  Math.max.apply(null, [bh, bm, bl, bo]);
                bugOrigin();
                bugLevel();
                /*漏洞来源*/
                function bugOrigin() {
                    if(max1 === 0){
                        cv_html = "<div class='progressHigh'></div><span class='progressbar-num'>" + 0 + "</span>";
                        co_html = "<div class='progressMedium'></div><span class='progressbar-num'>" + 0 + "</span>";
                        vn_html = "<div class='progressLow'></div><span class='progressbar-num'>" + 0 + "</span>";
                    }else{
                        cv_html = "<div class='progressHigh' style='width: " + 75 * cv/max1 + "%'></div><span class='progressbar-num'>" + cv + "</span>";
                        co_html = "<div class='progressMedium' style='width: " + 75 * co/max1 + "%'></div><span class='progressbar-num'>" + co + "</span>";
                        vn_html = "<div class='progressLow' style='width: " + 75 * vn/max1 + "%'></div><span class='progressbar-num'>" + vn + "</span>";
                    }
                    $("#cve").append(cv_html);
                    $("#vnlndb").append(co_html);
                    $("#cobot").append(vn_html);
                }

                /*严重程度*/
                function bugLevel() {
                    if(max2 === 0){
                        bh_html = "<div class='progressHigh'></div><span class='progressbar-num'>" + 0 + "</span>";
                        bm_html = "<div class='progressMedium'></div><span class='progressbar-num'>" + 0 + "</span>";
                        bl_html = "<div class='progressLow'></div><span class='progressbar-num'>" + 0 + "</span>";
                        bo_html = "<div class='progressOther'></div><span class='progressbar-num'>" + 0 + "</span>";
                    }else{
                        bh_html = "<div class='progressHigh' style='width: " + 75 * bh/max2 + "%'></div><span class='progressbar-num'>" + bh + "</span>";
                        bm_html = "<div class='progressMedium' style='width: " + 75 * bm/max2 + "%'></div><span class='progressbar-num'>" + bm + "</span>";
                        bl_html = "<div class='progressLow' style='width: " + 75 * bl/max2 + "%'></div><span class='progressbar-num'>" + bl + "</span>";
                        bo_html = "<div class='progressOther' style='width: " + 75 * bo/max2 + "%'></div><span class='progressbar-num'>" + bo + "</span>";
                    }
                    $(".bug-level-high").append(bh_html);
                    $(".bug-level-middle").append(bm_html);
                    $(".bug-level-low").append(bl_html);
                    $(".bug-level-other").append(bo_html);
                }
            }
        });
        safetyBar = null;
    }
    // 项目刷新
    function projectRefresh () {
        // refresh方法第二个参数对象query是接口参数，其余属性是table参数，不会在请求接口中，本次设置pageNumber回到第一页
        $('#project-table').bootstrapTable('refresh', {
            pageNumber: 1
        });
    }
    // 组件刷新
    function componentRefresh () {
        $('#component-table').bootstrapTable('refresh',  {
            pageNumber: 1
        });
    }
    // 漏洞刷新
    function safetyRefresh () {
        $('#safety-table').bootstrapTable('refresh',  {
            pageNumber: 1
        });
    }
    // 重新上传的弹窗
    function reuploadPopup(row){
        
    }

    /*表格 end*/
    //每隔30s请求进度事件
    function requestOverallProgress(){
        console.log("request Progress. In progress...");
        if(self.timeoutFunction){
            clearTimeout(self.timeoutFunction)
        }
        $.ajax({//等待测试，后台暂时无法返回项目进度
            type: "GET",
            url: '/project/getAnalysisProgress',
            success: function (data) {
                console.log(data);
            }
        });
        self.timeoutFunction = setTimeout(requestOverallProgress,30000);
    }

    //文件夹上传
    $('#upfileBtn').on('click', function () {
        $('#upfile').click();
    });
    $('#upfile').on('change', function () {
        var fileObj = this.files;
        var name = fileObj[0].webkitRelativePath.split("/");
        $('#upfileName').text(name[0]);
        self.folderFormData = new FormData();
        for (var i = 0; i < fileObj.length; i++) {
            self.folderFormData.append('file', fileObj[i]);
        }
    });

    //重置表单的函数
    function resetUploadForm(ori){
        var $model = $('#newProjectModal');
        var $name = $model.find('#addProject');
        var $ver = $model.find('#version');
        var $time = $model.find('#release-time');
        $model.find('input[type="text"], input[type="password"]').val("");
        $model.find('inpun[type="file"]').value = '';
        $model.find('#uploadCompressedFileName').html("未选择任何文件");
        $model.find('input[type="radio"]').attr('disabled',false);
        $model.find('.info-panel').hide();
        $model.find('input[name="importMethod"]').each(function(){
            this.checked = false;
        })

        if (!ori){
            self.uploadMethod = "create";
            $name.removeAttr('readonly');
            $ver.removeAttr('readonly');
            $time.prop('disabled', false);
            
        } else {
            self.uploadMethod = "update"
            self.projectId = ori.project_id;
            $name.val(ori.project_name).attr('readonly','readonly');
            $ver.val(ori.project_version).attr('readonly','readonly');
            $time.val(ori.project_time).prop('disabled', true);

            $('#' + ori.project_import_type + '-select').click();
            $model.find('input[type="radio"]').attr('disabled',true);
            self.oriUrl = "";
            self.oriBra = "";

            var json;
            try {
                json = JSON.parse(ori.url_data_json).data
            }
            catch (e) { return; }
            
            switch(ori.project_import_type){
                case 'svn':{
                    $('#svn-address').val(json.dowUrl);
                    $('#branch-svn').val(json.branchName);
                    $('#username-svn').val(json.userName);
                    $('#password-svn').val(json.passWord);
                    break;
                }
                case 'git':{
                    $('#git-address').val(json.dowUrl);
                    $('#branch-git').val(json.branchName);
                    $('#username-git').val(json.userName);
                    $('#password-git').val(json.passWord);
                    break;
                }
                case 'file':{
                    break;
                }
                default:
                    break;
            }
            if (ori.project_import_type == 'svn' || ori.project_import_type == 'git'){
                self.oriUrl = encodeURIComponent(json.dowUrl);
                self.oriBra = json.branchName;    
            }
        }
    }
});
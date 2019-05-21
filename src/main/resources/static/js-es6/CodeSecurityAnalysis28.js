    var urlParams = getParams(window.location.href), // url路径参数
        windowHeight = $(window).height(),
        projectId = urlParams.proID, // 项目id
        moduleId = "", // 组件id
        moduleIndex = 0, // 组件index
        triggerOption = "", // 是否选中可触发，trigger为可触发，all为全部
        bugLevel = ""; // 漏洞的高中低
    init(); // 初始化

    // tab切换
    $('.qtractor ul li').on('click', function() {
        $(this).addClass('active').siblings('li').removeClass('active');
        window.location.hash = 'show=' + $('.Loophole').eq($(this).index()).attr('class').split('Loophole ')[1];
        responseHashChange();
    });

    // 组件页点击可触发漏洞or全部漏洞时
    $('.module .filter-bug').on('click', '.padding-tital', function() {
        var bugType = $(this).parents('tr').attr('data-triggerType');
        $(this).parents('.module').find('.filter-icon-div').removeClass('filter-icon-div');
        if(bugType == "trigger"){
            $(this).parents('.module').find('.trigger_num .loopholes').show();
        }else{
            $(this).parents('.module').find('.all_num .loopholes').show();
        }
    })
    // 组件页筛选高中低
    $('.module .filter-icon-td').parent('tr').on('click', function() {
        var icon = $(this).children('td:first-child').children('div');
        var bugType = $(this).attr('data-triggerType');
        var bugLevel = $(this).attr('data-level');
        if(icon.hasClass('filter-icon-div')) {
            $(this).parents('.filter-bug').find('.filter-icon-div').removeClass('filter-icon-div');
            $(this).parents('.module').find('.' + bugType + '_num .loopholes').fadeTo(100, 1);
        }else {
            $(this).parents('.filter-bug').find('.filter-icon-div').removeClass('filter-icon-div');
            icon.addClass('filter-icon-div');
            $(this).parents('.module').find('.' + bugType + '_num .loopholes').fadeTo(100, 0);
            $(this).parents('.Loophole').find('.' + bugType + bugLevel.split('')[0].toUpperCase()).fadeTo(100, 1);
        }
    })
    // 漏洞页点击可触发漏洞or全部漏洞时
    $('.bug .filter-bug').on('click', '.padding-tital', function() {
        $(this).parents('.bug').find('.filter-icon-div').removeClass('filter-icon-div');
        triggerOption = $(this).parents('tr').attr('data-triggerType');
        bugLevel = "";
        $("input:radio[value='"+triggerOption+"']")[0].checked = true;
        isShowTrigger(triggerOption);
        safetyRefresh();
        $('#ProjectModuleListTable>tbody>tr').eq(moduleIndex).addClass('active');
    })
    // 漏洞页筛选高中低
    $('.bug .filter-icon-td').parent('tr').on('click', function() {
        var _icon = $(this).children('td:first-child').children('div');
        if(_icon.hasClass('filter-icon-div')){
            $('.filter-icon-div').removeClass('filter-icon-div');
            bugLevel = "";
        }else{
            $('.filter-icon-div').removeClass('filter-icon-div');
            _icon.addClass('filter-icon-div');
            bugLevel = $(this).attr('data-level');
        }
        triggerOption = $(this).attr('data-triggerType');
        $("input:radio[value='"+triggerOption+"']")[0].checked = true;
        isShowTrigger(triggerOption);
        safetyRefresh();
    })

    // 显示隐藏trigger/all列
    function isShowTrigger(option){
        if( option === "trigger" ){
            $("#ProjectModuleListTable").bootstrapTable('hideColumn', "allBug");
            $("#ProjectModuleListTable").bootstrapTable('showColumn', "triggerBug");
        }else{
            $("#ProjectModuleListTable").bootstrapTable('showColumn', "allBug");
            $("#ProjectModuleListTable").bootstrapTable('hideColumn', "triggerBug");
        }
    }

    // 组件页组件表搜索
    $('#filterComponentBtn').on('click', function() {
        componentRefresh();
    });
    // 漏洞页组件表搜索
    $('#componentSearchBtn').on('click', function() {
        moduleIndex = 0;
        moduleRefresh();
    });
    // 漏洞页漏洞搜索
    $('#bugSearchBtn').on('click', function() {
        safetyRefresh();
    });


    // 初始化
    function init() {
        $("input:radio[value='all']")[0].checked = true; // 给默认值选中radio
        $('#ProjectModuleListTable>tbody>tr').eq(moduleIndex).addClass('active');
        projectInfo();
        responseHashChange();
    };

    // hash变化触发tab切换
    function responseHashChange() {
        var showTab = hash('show');
        if (showTab) {
            $('.Loophole').hide();
            var name = '.Loophole.' + showTab;
            $(name).show();
            $(".nav-"+showTab).addClass('active').siblings('li').removeClass('active');
            $('#ProjectModuleListTable>tbody>tr:first').addClass('active');
            switch(showTab){
                case "module":
                    componentTable();
                    break;
                case "bug":
                    moduleTable();
                    $("#ProjectModuleListTable").bootstrapTable('hideColumn', "triggerBug");
                    break;
            }
        } else {
            $('.Loophole:first').show();
            componentTable();
        }
    };
    // 项目详细信息
    function projectInfo() {
        $.ajax({
            type: "GET",
            url: "/project/getProjectInfo",
            data:{
                "projectId": projectId
            },
            success: function(data){
                if (!data){
                    return;
                }
                data = transformObjKey(data, "")
                // 显示项目名称，版本，更新日期
                var projectName, projectVersion, date, time, project_update;
                projectName = data.projectname;
                projectVersion = data.projectversion;
                if(data.moduleupdatetime){
                    date = data.moduleupdatetime.split('T')[0];
                    time = data.moduleupdatetime.split('T')[1].split('.')[0];
                }else{
                    date = "暂无";
                    time = "";
                }
                project_update = date + " " + time;
                $('.left-item-name').html(projectName);
                $('.left-item-version').html(projectVersion);
                $('.left-item-update').html(project_update);
                // 面包屑
                $('.directory-address').append("<li>" + projectName + projectVersion + "</li>");

                var tbh = Number(data.triggerablebughigh),
                    tbm = Number(data.triggerablebugmiddle),
                    tbl = Number(data.triggerablebuglow),
                    tbo = Number(data.triggerablebugother),
                    bh = Number(data.bughigh),
                    bm = Number(data.bugmiddle),
                    bl = Number(data.buglow),
                    bo = Number(data.bugother),
                    pc = Number(data.projectcodecount),
                    pu = Number(100 - data.projectdevelopment),
                    pd = Number(data.projectdevelopment),
                    zx = Number(data.projectusagequantity);
                var max1, max2, tbh_html, tbm_html, tbl_html, tbo_html, bh_html, bm_html, bl_html, bo_html, pc_html, pu_html, pd_html, zx_html;
                max1 = Math.max.apply(null, [tbh, tbm, tbl, tbo]);
                max2 = Math.max.apply(null, [bh, bm, bl, bo]);
                triggerableBug();
                allBug();
                Release_profile();
                /*可触发漏洞*/
                function triggerableBug() {
                    if( max1 === 0 ){
                        tbh_html = "<div class='progressHigh' role='progressbar'></div><span class='progressbar-num'>" + 0 + "</span>";
                        tbm_html = "<div class='progressMedium' role='progressbar'></div><span class='progressbar-num'>" + 0 + "</span>";
                        tbl_html = "<div class='progressLow' role='progressbar'></div><span class='progressbar-num'>" + 0 + "</span>";
                        tbo_html = "<div class='progressOther' role='progressbar'></div><span class='progressbar-num'>" + 0 + "</span>";
                    }else{
                        tbh_html = "<div class='progressHigh' role='progressbar' style='width: " + 75 * tbh/max1 +"%;'></div>" + "<span class='progressbar-num'>" + tbh + "</span>";
                        tbm_html = "<div class='progressMedium' role='progressbar' style='width: " + 75 * tbm/max1 + "%;'></div>" + "<span class='progressbar-num'>" + tbm + "</span>";
                        tbl_html = "<div class='progressLow' role='progressbar' style='width:" + 75 * tbl/max1 + "%;'></div>" + "<span class='progressbar-num'>" + tbl + "</span>";
                        tbo_html = "<div class='progressOther' role='progressbar' style='width:" + 75 * tbo/max1 + "%;'></div>" + "<span class='progressbar-num'>" + tbo + "</span>";
                    }
                    $(".triggerable-bug-high").append(tbh_html);
                    $(".triggerable-bug-middle").append(tbm_html);
                    $(".triggerable-bug-low").append(tbl_html);
                    $(".triggerable-bug-other").append(tbo_html);
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
                    $(".bug-high").append(bh_html);
                    $(".bug-middle").append(bm_html);
                    $(".bug-low").append(bl_html);
                    $(".bug-other").append(bo_html);
                }
                /*版本概况*/
                function Release_profile() {
                    pc_html = "<div class='progressHigh' role='progressbar' style='width: 70%;'></div>" +
                        "<span class='progressbar-num'>" + pc + "</span>";
                    zx_html = "<div class='progressOther' role='progressbar' style='width: 70%;'></div>" +
                        "<span class='progressbar-num'>" + zx + "MB</span>";
                    pu_html = "<div class='progressMedium' role='progressbar' style='width: " + 70 * pu/100 + "%;'></div>" +
                        "<span class='progressbar-num'>" + pu + "%</span>";
                    pd_html = "<div class='progressLow' role='progressbar' style='width:" + 70 * pd/100 + "%;'></div>" +
                        "<span class='progressbar-num'>" + pd + "%</span>";
                    $(".profile-first").append(pc_html);
                    $(".profile-second").append(pu_html);
                    $(".profile-third").append(pd_html);
                    $(".profile-fourth").append(zx_html);
                }
            }
        })
    };
    // 组件详情
    function moduleInfo(id) {
        $.ajax({
            url: "/module/getModuleContent",
            type: "GET",
            data: {
                moduleid: id
            },
            dataType: "json",
            success: function(data){
                data = transformObjKey(data);
                var module_name = data.modulename;
                var module_version = data.moduleversion;
                var module_count = Number( data.modulebugcount );
                $('.Loophole-known .Loophole-item-name span').text(module_name);
                $('.Loophole-known .Loophole-item-name .edition').text(module_version);
                $('.Loophole-known .text1').text(module_count+"个");
                // 建议更新
                var module_upversion = data.moduleupversion || "暂无";
                var module_updescribe = data.moduleupdescribe || "";
                var update_date = data.moduleupdatetime.split('T')[0] || "";
                $('.Loophole-update .upVersion').text(module_upversion);
                $('.Loophole-update .upScribe').text(module_updescribe);
                $('.Loophole-update .upTime').text(update_date);
                //最新版本
                var module_newestversion = data.modulenewestversion || "暂无";
                var module_newestdescribe = data.modulenewestdescribe || "";
                var newest_date = data.modulenewesttime.split('T')[0] || "";
                $('.Loophole-uptodate .upVersion').text(module_newestversion);
                $('.Loophole-uptodate .upScribe').text(module_newestdescribe);
                $('.Loophole-uptodate .upTime').text(newest_date);
            }
        })
    };

    // 包含组件页组件表
    function componentTable() {
        $('#ComponentTable').bootstrapTable({
            url: '/module/getProjectModuleList',
            queryParamsType: '',
            queryParams: function (params) {
                return {
                    key: $('#filterComponentValue').val(),
                    projectId: projectId, //项目名
                    limit: params.pageSize,
                    page: --params.pageNumber
                };
            },
            method: "get",
            locale: 'zh-CN',
            height: windowHeight * 0.55,
            pagination: true,
            sidePagination: "server",
            paginationPreText: "上一页",
            paginationNextText: "下一页",
            paginationLoop: false,
            cache: false,
            classes: 'table table-hover right-table', //按钮样式
            undefinedText: "",
            columns: [
                {
                    title: '组件',
                    align: 'center',
                    field: 'module_name',
                    formatter: function (value, row, index) {
                        if (row.base['module_name'] == null || row.base['module_name'] === undefined){
                            return;
                        }
                        var version = row.base["module_version"] || "";
                        return "<span class='user-management'>" + row.base['module_name'] + "</span> " + "<span class='project-name-label'>" + version + "</span>";
                    }
                },
                {
                    title: '文件匹配数',
                    align: 'center',
                    field: 'module_match',
                    formatter: function (value, row, index) {
                        row.base['module_match'] = Number(row.base['module_match']) || 0;
                        return "<a class='purple'>" + Number( row.base['module_match'] ) + "</a>";
                    }
                },
                {
                    title: '匹配类型',
                    align: 'center',
                    field: 'module_match_type',
                    formatter: function (value, row, index) {
                        row.base['module_match_type'] = row.base['module_match_type'] || "";
                        return "<a class='purple'>" + row.base['module_match_type'] + "</a>";
                    }
                },
                {
                    title: '<span title="漏洞涉及函数已被项目程序调用的漏洞">可触发漏洞</span>',
                    align: 'center',
                    field: 'triggerable_bug_high',
                    formatter: function (value, row, index) {
                        var H, M, L, O;
                        H = "<span class='loopholes labelH triggerH' data-type='trigger' data-level='high'>" + row.base["triggerable_bug_high"] + "</span>";
                        M = "<span class='loopholes labelM triggerM' data-type='trigger' data-level='mid'>" + row.base["triggerable_bug_middle"] + "</span>";
                        L = "<span class='loopholes labelL triggerL' data-type='trigger' data-level='low'>" + row.base["triggerable_bug_low"] + "</span>";
                        O = "<span class='loopholes labelO triggerO' data-type='trigger' data-level='other'>" + row.base["triggerable_bug_other"] + "</span>";
                        if (Number(row.base["triggerable_bug_high"]) === 0) {
                            H = "<span class='loopholes'> </span>";
                        }
                        if (Number(row.base["triggerable_bug_middle"]) === 0) {
                            M = "<span class='loopholes'> </span>";
                        }
                        if (Number(row.base["triggerable_bug_low"]) === 0) {
                            L = "<span class='loopholes'> </span>";
                        }
                        if (Number(row.base["triggerable_bug_other"]) === 0) {
                            O = "<span class='loopholes'> </span>";
                        }
                        return "<div class='bugLevel' data-bugId='" + row.base["module_id"] + "'><div class='trigger_num'>" + H + M + L + O + "</div>";
                    }
                },
                {
                    title: '所有漏洞',
                    align: 'center',
                    field: 'bug_high',
                    formatter: function (value, row, index) {
                        var H, M, L, O;
                        H = "<span class='loopholes labelH allH' data-type='all' data-level='high'>" + row.base["bug_high"] + "</span>";
                        M = "<span class='loopholes labelM allM' data-type='all' data-level='mid'>" + row.base["bug_middle"] + "</span>";
                        L = "<span class='loopholes labelL allL' data-type='all' data-level='low'>" + row.base["bug_low"] + "</span>";
                        O = "<span class='loopholes labelO allO' data-type='all' data-level='other'>" + row.base["bug_other"] + "</span>";
                        if (Number(row.base["bug_high"]) === 0) {
                            H = "<span class='loopholes'> </span>";
                        }
                        if (Number(row.base["bug_middle"]) === 0) {
                            M = "<span class='loopholes'> </span>";
                        }
                        if (Number(row.base["bug_low"]) === 0) {
                            L = "<span class='loopholes'> </span>";
                        }
                        if (Number(row.base["bug_other"]) === 0) {
                            O = "<span class='loopholes'> </span>";
                        }
                        return "<div class='bugLevel' data-bugId='" + row.base["module_id"] + "'><div class='all_num'>" + H + M + L + O + "</div>";
                    }
                },
                {
                    title: '许可证',
                    align: 'center',
                    field: 'module_license',
                    formatter: function (value, row) {
                        row.base['module_license'] = row.base['module_license'] || "";
                        return "<span data-target='#licenseModal' data-toggle='modal' style='color: #8181CE; cursor:pointer;'>" + row.base["module_license"].toUpperCase() + "</span>";
                    }
                }
            ],
            responseHandler: function(res){
                if(res.rows){
                    for(var i=0; i<res.rows.length; i++){
                        res.rows[i].base = transformObjKey(res.rows[i].base, '_');
                    }
                }
                res.total = res.rowsSize || 0;
                delete res.rowsSize;
                return res;
            },
            onLoadSuccess: function () {
                $('.bugLevel').on('click', function (e) {
                    if (e.target.dataset.level) {
                        window.location.href = "/views/vulnerability-description.html?proID=" + projectId + "&modID=" + e.currentTarget.dataset.bugid + "&type=" + e.target.dataset.type + "&level=" + e.target.dataset.level + "#show=bug";
                    }
                })
            },
            onClickCell: function (field, value, row, $element) {
                // 点击许可证
                if (field === 'module_license') {
                    moduleLicense({
                        licType: row.base.module_license,
                        modalId: 'licenseModal'
                    });
                } else if (field === 'module_name') {
                    window.location.href = "vulnerability-description.html?modID=" + row.base["module_id"] + "&proID=" + projectId;
                } else if (field === 'module_match_type' || field === 'module_match') {
                    // window.location.href = "CodeMatching.html";
                    if (row.base.module_match_type === '部分匹配'){
                        window.location.href = "CodeMatching.html?modID="+row.base.module_id;
                    } else {
                        swal({
                            title: '敬请期待',
                            text: '',
                            type: 'warning',
                            // showConfirmButton: false
                        });    
                    }
                }
            }
        })
    };
    // 漏洞页、组件表
    function moduleTable() {
        $('#ProjectModuleListTable').bootstrapTable({
            url: '/module/getProjectModuleList',
            queryParamsType: '',
            queryParams: function (){
                return{
                    projectId: projectId,//项目名
                    key: $('#componentSearch').val(),
// ？？？？？？？？？？？？？？？？应给设置limit一个默认值？？？？？？？？？？？？？？？？？
                    limit: "1000",
                    page: "0"
                }
            },
            method: "get",
            locale: 'zh-CN',
            height: windowHeight * 0.5,
            totalField: 'rowsSize',
            pagination: false,
            sidePagination: "server",
            cache: false,
            classes: 'table table-hover right-table', //按钮样式
            undefinedText: "",
            columns: [
                {
                    title: '组件',
                    align: 'center',
                    field: 'module_name',
                    formatter: function (value, row) {
                        return "<span class='user-management'>" + row.base["module_name"] + "</span><span class='project-name-label'>" + row.base["module_version"] + "</span>";
                    }
                },
                {
                    title: '漏洞',
                    align: 'left',
                    field: 'allBug',
                    formatter: function( value,row,index ) {
                        var bh_html, bm_html, bl_html, bo_html;
                        var bh = row.allBug["high"];
                        var bm = row.allBug["middle"];
                        var bl = row.allBug["low"];
                        var bo = row.allBug["other"];
                        var max = Math.max.apply(null, [bh, bm, bl, bo]);
                        if (max === 0) {
                            bh_html = "<div class='bug-level bugH'><div class='progress-bar-high progress-bar-H' role='progressbar'></div><span class='left-progressbar-count'>" + 0 + "</span></div>";
                            bm_html = "<div class='bug-level bugM'><div class='progress-bar-middle progress-bar-H' role='progressbar'></div><span class='left-progressbar-count'>" + 0 + "</span></div>";
                            bl_html = "<div class='bug-level bugL'><div class='progress-bar-low progress-bar-H' role='progressbar'></div><span class='left-progressbar-count'>" + 0 + "</span></div>";
                            bo_html = "<div class='bug-level bugO'><div class='progress-bar-other progress-bar-H' role='progressbar'></div><span class='left-progressbar-count'>" + 0 + "</span></div>";
                        } else {
                            bh_html = "<div class='bug-level bugH'><div class='progress-bar-high progress-bar-H' role='progressbar' style='width:" + 75 * bh / max + "%;'></div><span class='left-progressbar-count'>" + bh + "</span></div>";
                            bm_html = "<div class='bug-level bugM'><div class='progress-bar-middle progress-bar-H' role='progressbar' style='width:" + 75 * bm / max + "%;'></div><span class='left-progressbar-count'>" + bm + "</span></div>";
                            bl_html = "<div class='bug-level bugL'><div class='progress-bar-low progress-bar-H' role='progressbar' style='width:" + 75 * bl / max + "%;'></div><span class='left-progressbar-count'>" + bl + "</span></div>";
                            bo_html = "<div class='bug-level bugO'><div class='progress-bar-other progress-bar-H' role='progressbar' style='width:" + 75 * bo / max + "%;'></div><span class='left-progressbar-count'>" + bo + "</span></div>";
                        }
                        return bh_html + bm_html + bl_html + bo_html;
                    }
                },
                {
                    title: '漏洞',
                    align: 'left',
                    field: 'triggerBug',
                    formatter: function( value,row,index ) {
                        var max, bh_html, bm_html, bl_html, bo_html;
                        var tbh = row.triggerBug["high"];
                        var tbm = row.triggerBug["middle"];
                        var tbo = row.triggerBug["low"];
                        var tbl = row.triggerBug["other"];
                        max = Math.max.apply(null, [tbh, tbm, tbo, tbl]);
                        if (max === 0) {
                            bh_html = "<div class='bug-level bugH'><div class='progress-bar-high progress-bar-H' role='progressbar'></div><span class='left-progressbar-count'>" + 0 + "</span></div>";
                            bm_html = "<div class='bug-level bugM'><div class='progress-bar-middle progress-bar-H' role='progressbar'></div><span class='left-progressbar-count'>" + 0 + "</span></div>";
                            bl_html = "<div class='bug-level bugL'><div class='progress-bar-low progress-bar-H' role='progressbar'></div><span class='left-progressbar-count'>" + 0 + "</span></div>";
                            bo_html = "<div class='bug-level bugO'><div class='progress-bar-other progress-bar-H' role='progressbar'></div><span class='left-progressbar-count'>" + 0 + "</span></div>";
                        } else {
                            bh_html = "<div class='bug-level bugH'><div class='progress-bar-high progress-bar-H' role='progressbar' style='width:" + 75 * tbh / max + "%;'></div><span class='left-progressbar-count'>" + tbh + "</span></div>";
                            bm_html = "<div class='bug-level bugM'><div class='progress-bar-middle progress-bar-H' role='progressbar' style='width:" + 75 * tbm / max + "%;'></div><span class='left-progressbar-count'>" + tbm + "</span></div>";
                            bl_html = "<div class='bug-level bugL'><div class='progress-bar-low progress-bar-H' role='progressbar' style='width:" + 75 * tbl / max + "%;'></div><span class='left-progressbar-count'>" + tbl + "</span></div>";
                            bo_html = "<div class='bug-level bugO'><div class='progress-bar-other progress-bar-H' role='progressbar' style='width:" + 75 * tbo / max + "%;'></div><span class='left-progressbar-count'>" + tbo + "</span></div>";
                        }
                        return bh_html + bm_html + bl_html + bo_html;
                    }
                }
            ],
            responseHandler: function(res){
                if(res.rows){
                    for(var i=0; i<res.rows.length; i++){
                        res.rows[i].base = transformObjKey(res.rows[i].base, '_');
                    }
                }
                res.total = res.rowsSize || 0;
                delete res.rowsSize;
                return res;
            },
            onClickRow: function (row,$element) {
                $('#ProjectModuleListTable .active').removeClass('active');
                $($element).addClass('active');
                moduleIndex = row.index;
                moduleId = row.base.module_id;
                moduleInfo(moduleId);
                safetyRefresh();
            },
            onLoadSuccess: function(data) {
                $('#ProjectModuleListTable>tbody>tr').eq(moduleIndex).addClass('active');
                // 留在以后解决多请求了一次
                if(data.rows){
                    if (data.rows.length > 0) {
                        moduleId = data.rows[0].base.module_id;
                        bugTable(moduleId);
                        moduleInfo(moduleId);
                        safetyRefresh();
                    }
                }
            },
            onRefresh: function () {
                $('#ProjectModuleListTable>tbody>tr').eq(moduleIndex).addClass('active');
            }
        });
    };
    // 漏洞表
    function bugTable(id) {
        moduleId = id;
        $('#ProjectBugTable').bootstrapTable({
            url: '/bug/getModuleBugList',
            queryParamsType: '',              //默认值为 'limit' ,在默认情况下 传给服务端的参数为：offset,limit,sort
            queryParams: function (params) {
                return {
                    triggerType: triggerOption === "trigger" ? true : "",
                    level: bugLevel ? bugLevel : "",
                    module_id: moduleId,
                    key: $("#bugSearch").val(),
                    limit: params.pageSize,
                    page: --params.pageNumber
                }
            },
            method: "get",
            locale: 'zh-CN',
            height: windowHeight * 0.4,
            totalField: 'total',
            pagination: true,
            pageSize: 5,
            sidePagination: "server",
            paginationPreText: "上一页",
            paginationNextText: "下一页",
            paginationLoop: false,
            cache: false,
            classes: 'table table-hover right-table',//按钮样式
            undefinedText: "",
            columns: [
                {	title: '',
                    align: 'right',
                    field: 'bug_category',
                    formatter: function(value, row, index) {
                        if(value){
                            return "<span class='ldID " + value.toLowerCase() +"'>"+value+"</span>";
                        }
                    }
                },
                {
                    title: '漏洞名称',
                    align: 'left',
                    field: 'bug_name',
                    formatter: function (value, row, index) {
                        value = value || '';
                        return "<a class='user-management'>" + value + "</a>";
                    }
                },
                {
                    title: '发布时间',
                    align: 'center',
                    field: 'bug_releasedate',
                    formatter: function(value) {
                        if(value){
                            return value.split('T')[0];
                        }
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
                    field: 'bug_type',
                },
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
                    title: '修复版本',
                    align: 'center',
                    field: 'bug_fix_version',
                },
                {
                    title: '修复日期',
                    align: 'center',
                    field: 'bug_fix_date',
                    formatter: function(value) {
                        if(value){
                            return value.split('T')[0];

                        }
                    }
                },
                {
                    title: '',
                    align: 'center',
                    field: 'bug_url',
                    formatter:function (value, row, index) {
                        var cls, text;
                        text = row.triggerflag === "true" ? "查看修复详情" : "查看漏洞详情";
                        cls = row.triggerflag === "true" ? "purple" : "user-management";
                        return "<a class='" + cls + "' href='" + value + "' target='_blank'>" + text + "</a>";
                    }
                }
            ],
            responseHandler: function(res){
                if(res.rows){
                    for(var i=0; i<res.rows.length; i++){
                        res.rows[i] = transformObjKey(res.rows[i], '_');
                    }
                }
                res.total = res.rowsSize || 0;
                delete res.rowsSize;
                return res;
            },
            onClickCell:  function (field, value, row, $element) {
                // 点击许可证
                if (field === 'bug_name') {
                    window.location.href = "affected-projects.html?proID=" + projectId +"&modID=" + id + "&bugID=" + row["bug_id"];
                } else if (field === 'bug_effect_count') {
                    window.location.href = "affected-projects.html?bugID=" + row["bug_id"];
                }
            }
        })
    };

    // 组件页组件表格刷新
    function componentRefresh() {
        $('#ComponentTable').bootstrapTable('refresh', { pageNumber: 1 });
    };
    // 漏洞页组件表格刷新
    function moduleRefresh() {
        $('#ProjectModuleListTable').bootstrapTable('refresh', { pageNumber: 1 });
    };
    // bug表格刷新
    function safetyRefresh() {
        $('#ProjectBugTable').bootstrapTable('refresh', { pageNumber: 1 })
    };
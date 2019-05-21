$(function () {
    /*表格*/
    //表格配置项

    // 将url参数转化为对象
    var location_params = getParams(window.location.href),
        table = "#table", // 表格id
        proID = "", // 项目id
        modID = "", // 组件id
        project_name = "", // 项目名称
        project_version = "", // 项目版本号
        module_name = "", // 组件名称
        module_version = "";
         // 组件版本号
    var b_id = location_params.bugID; // 漏洞id

    if(location_params.proID && location_params.modID){
        proID = location_params.proID;
        modID = location_params.modID;
    }else if(!location_params.proID && location_params.modID){
        proID = "";
        modID = location_params.modID;
    }

    $.ajax({//根据bugid从服务器获取bug数据
        type:'GET',
        url:'/bug/getBugContentByBugId',
        data:{bugId: b_id},
        dataType: 'json',
        success: function(data){
            console.log(data);
            var row = transformObjKey(data.data.data);
            InitScoreGraph(row);
            InitBugInfo(row);
            navigationLink(row);
            initTable(data.data.data.bugname);
        }
    })
    //初始化展示数据
    function InitBugInfo(data){
        if (data == null || data == undefined){
            return;
        }
        var href = "";
        convertNull(data);
        $('#bug_url').html(data.bugurl);
        $('#bug_url').attr('href',data.bugurl);
        $('#bug_id').html(data.bugdata_bugid);
        $('#bug_release_date').html(timeChrono(data.bugreleasedate));
        $('#bug_level').html(levelToChinese(data.buglevel));
        if (checkEmpty(data.cve_info)) {
            $('#bug_info').html("暂无描述");
        } else {
            $('#bug_info').html(data.cve_info);
        }
    }

    function levelToChinese(level) {
        if (level == 'high'){
            return "高";
        } else if (level == 'mid'){
            return "中";
        } else if (level == 'low'){
            return "低";
        } else {
            return level;
        }
    }

    function checkEmpty(str) {
        if (str == null || str == undefined || str == ""){
            return true;
        } else {
            return false;
        }
    }

    // 面包屑
    function navigationLink(data){
        if (data == null || data == undefined){
            href = "<li>漏洞详情</li>";
            $('.directory-address').append(href);
            return;
        }
        if(proID !== "" && modID !== ""){
            $.ajax({ // 为面包屑导航获取项目名称和版本号
                url: "/project/getProjectInfo",
                type: "GET",
                data: { "projectId": proID },
                dataType: "json",
                success: function(params){
                    params = transformObjKey(params, '_');
                    project_name = params.project_name;
                    project_version = params.project_version;
                    $.ajax({ // 为面包屑导航获取组件名称和版本号
                        type: "GET",
                        url: "/module/getModuleContent",
                        data: {moduleid: modID},
                        dataType: "json",
                        success: function (res) {
                            res = transformObjKey(res, '');
                            // 显示组件链接，名称，版本，更新日期
                            module_name = res.modulename;
                            module_version = res.moduleversion;
                            href = "<li><a href='./CodeSecurityAnalysis28.html?proID=" + proID + "'>" + project_name + " " + project_version + "</a></li><li><a href='./vulnerability-description.html?proID=" + proID + "&modID=" + modID + "'>" + module_name + " " + module_version + "</a></li><li>" + data.bigdatabugid + "漏洞详情</li>";
                            $('.directory-address').append(href);
                        }
                    })
                }
            })
        }else if(proID === "" && modID !== ""){
            $.ajax({ // 为面包屑导航获取组件名称和版本号
                type: "GET",
                url: "/module/getModuleContent",
                data: {moduleid: modID},
                dataType: "json",
                success: function (res) {
                    res = transformObjKey(res, '');
                    // 显示组件链接，名称，版本，更新日期
                    module_name = res.modulename;
                    module_version = res.moduleversion;
                    href = "<li><a href='./vulnerability-description.html?modID=" + modID + "'>" + module_name + " " + module_version + "</a></li><li>" + data.bigdatabugid + "漏洞详情</li>";
                    $('.directory-address').append(href);
                }
            })
        }else{
            var href = "<li>" + data.bigdatabugid + "漏洞详情</li>";
            $('.directory-address').append(href);
        }
    }

    //初始化数据图(三角)
    function InitScoreGraph(data){
        if (data == null || data == undefined){
            return;
        }
        var bp = data.basesorce,
            tp = data.availabilityimpact,
            ep = data.impactscore,

            bp3 = data.basicscore3 || '',
            tp3 = data.availabilityscore3,
            ep3 = data.impactscore3;

        if (bp3 != null && tp3 != null && ep3 != null){
            $('#graph-tag-3').show();
        }

        if (bp == null || tp == null || ep == null){
            return
        }

        $(bp).append("#base_per");
        $(tp).append("#triggerable_per");
        $(ep).append("#effect_per");

        $(bp3).append("#base_per3");
        $(tp3).append("#triggerable_per3");
        $(ep3).append("#effect_per3");

        var mData = [
            ['可利用性', tp],
            ['影响', ep],
            ['基本评分', bp]
        ];

        var mData3 = [
            ['可利用性', tp3],
            ['影响', ep3],
            ['基本评分', bp3]
        ];

        var mW = $('.detials-right').width() * 0.8;
        var mCount = 3, //边数
            mCenter = mW /2, //中心点
            mRadius = mCenter, //半径(减去的值用于给绘制的文本留空间)
            mAngle = Math.PI * 2 / mCount, //角度
            mCtx = null,
            mColorPolygon = '#90BCD5', //多边形颜色
            mColorLines = '#5e89a9'; //顶点连线颜色

        resetFunc();

        // 初始化
        function resetFunc(){
            var canvas = document.createElement('canvas');
            var canvas3 = document.createElement('canvas');
            document.getElementById("radar-chart").appendChild(canvas);
            document.getElementById("radar-chart3").appendChild(canvas3);
            canvas.height = mW;
            canvas.width = mW;
            canvas3.height = mW;
            canvas3.width = mW;
            $('#radar-chart').height(mW * 0.8);
            $('#radar-chart3').height(mW * 0.8);
            var mCtx = canvas.getContext('2d');
            var mCtx3 = canvas3.getContext('2d');

            drawPolygon(mCtx);
            drawLines(mCtx);
            drawRegion(mCtx,mData);

            drawPolygon(mCtx3);
            drawLines(mCtx3);
            drawRegion(mCtx3,mData3);
            write();
        }
        // 填写数字文本
        function write(){
            var bp_num = '<div class="score-text" id="base_per">'+bp+'</div>';
            var tp_num = '<div class="score-text" id="triggerable_per">'+tp+'</div>';
            var dp_num = '<div class="score-text" id="effect_per">'+ep+'</div>';
            $("#base_per").append(bp_num);
            $("#triggerable_per").append(tp_num);
            $("#effect_per").append(dp_num);

            var bp_num3 = '<div class="score-text" id="base_per3">'+bp3+'</div>';
            var tp_num3 = '<div class="score-text" id="triggerable_per3">'+tp3+'</div>';
            var dp_num3 = '<div class="score-text" id="effect_per3">'+ep3+'</div>';
            $("#base_per3").append(bp_num3);
            $("#triggerable_per3").append(tp_num3);
            $("#effect_per3").append(dp_num3);
        }
        // 绘制多边形边
        function drawPolygon(ctx){
            ctx.save();
            ctx.fillStyle = "blue";
            ctx.strokeStyle = mColorPolygon;
            var r = mRadius/ 5; //单位半径
            //画5个圈
            
            for(var i = 0; i < 5; i ++){
                ctx.beginPath();
                var currR = r * ( i + 1); //当前半径
                //画5条边
                for(var j = 0; j < mCount; j ++){
                    var x = mCenter + currR * Math.cos(mAngle * j);
                    var y = mCenter + currR * Math.sin(mAngle * j);
                    ctx.lineTo(x, y);
                }
                ctx.closePath()
                ctx.stroke();
            }
            ctx.restore();
            
        }
        // 顶点连线
        function drawLines(ctx){
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = mColorLines;
            for(var i = 0; i < mCount; i ++){
                var x = mCenter + mRadius * Math.cos(mAngle * i);
                var y = mCenter + mRadius * Math.sin(mAngle * i);

                ctx.moveTo(mCenter, mCenter);
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
        }
        // 绘制数据区域
        function drawRegion(ctx,data){
            ctx.save();
            ctx.beginPath();
            for(var i = 0; i < mCount; i ++){
                var x = mCenter + mRadius * Math.cos(mAngle * i) * data[i][1] / 10;
                var y = mCenter + mRadius * Math.sin(mAngle * i) * data[i][1] / 10;
                ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(94, 137, 169, 0.5)';
            ctx.fill();
            ctx.restore();
        }
    }
        // $(window).resize(function () {
        //     $(table).bootstrapTable('resetView');
        // });

    var tableStyle = {
        Col_1: ' entry-name-col text-nowrap-ellipsis',
        Col_2: '  type-col',
        Col_3: 'check-time-col',
        Col_4: ' last-time-col',
    };

    var colHandle = {
        entryNameFormatter: function (value, row, index) {
            var html = row["projec_tname"]+"<span class='project-name-label'>"+row["project_version"]+"</span>";
            html = "<a class='user-management' href='CodeSecurityAnalysis28.html?proID=" + row["project_id"] + "' style='margin-left: 60px;'>" + row["project_name"] + "</a>" + "<span class='project-name-label'>"+row["project_version"]+"</span>";
            return html;
        },
        imgFormatter: function (value, row, index) {
            //图片类型
            var allImage = row["project_type"];
            if (allImage == null || allImage == undefined){
                return
            }
            var numImage = allImage.split(",");
            var html = "";
            for (var i = 0; i < numImage.length; i++) {
                html = html + "<img class='icon-img' src='../assets/icon/" + numImage[i] + "-icon.png' alt=''>";
            }
            return html;
        },
        /*ProjectNameFormatter:function (value,row,index) {
            if(row["project_name"] == "qtractor") {
                var html = "<a class='user-management' href='CodeSecurityAnalysis28.html'>" + row["project_name"] + "</a>";
            } else {
                html = row["project_name"];
            }
            return html;
        }*/
    };

    function initTable(b_name){
        $(table).bootstrapTable({
            url:'/project/getProjectListByBugId' ,    //'../json/affected-projects.json',http://localhost:3000/table
            queryParamsType: '', //默认值为 'limit' ,在默认情况下 传给服务端的参数为：offset,limit,sort
            queryParams: function (params) {
                return {
                    bugName: b_name,
                    limit: params.pageSize,
                    page: --params.pageNumber
                }
            },
            method: "get",
            locale: 'zh-CN',
            pagination: true,
            sidePagination: "server",
            paginationUseIntermediate: true,
            cache: false,
            classes: 'table table-no-bordered fixed-table',//table样式
            paginationPreText: "上一页",
            paginationNextText: "下一页",
            paginationLoop: false,
            showPaginationSwitch: false,
            undefinedText: '',
            buttonsAlign: "right",
            columns: [
                {
                    title: '项目名称',
                    field: 'project_name',
                    formatter: colHandle.entryNameFormatter,
                    class: tableStyle.Col_1
                },
                {
                    title: '类型',
                    field: 'project_type',
                    align: 'center',
                    formatter: colHandle.imgFormatter,
                    class: tableStyle.Col_2
                },
                {title: '检测时间', field: 'analysis_time',align: 'center', class: tableStyle.Col_3,
                    formatter:function( value,row,index ){
                        return "<span>" + timeChrono(row.analysis_time) + "</span>";
                    }},
                {title: '组件最后更新时间', field: 'module_updatetime',align: 'center', class: tableStyle.Col_4,
                    formatter:function( value,row,index ){
                        return "<span>" + timeChrono(row.module_updatetime) + "</span>";
                    }},
            ],
            responseHandler: function(res){
                res.data.total = res.data.totalSize;
                res.data.rows = transformObjKey(res.data.rows, '_');
                return res.data;
            },
        });
    }
    

    $('#bug-search-project').on('click', function () {
        swal({
                title: '敬请期待',
                text: '',
                type: 'warning'
            });
    });

    var nowHref = window.location.search;
    var args = nowHref.split("?");
    var project_id = args[1];
});
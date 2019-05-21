// 发Ajax时增加loading
var loadAlert = false;//用于识别loading的弹窗
function loading () {
    if (!loadAlert) {
        loadAlert = true;
        var count = 0;
        $('.sweet-alert .sa-icon').each(function () {
            if ($(this).css('display') === 'block') {
                count++
            }
        });
        if ($('.sweet-alert').length === 0 || (count === 1 && $('.sweet-alert .sa-icon.sa-custom').css('display') === 'block')) {
            swal({
                title: '',
                text: '正在努力请求中！',
                showConfirmButton: false,
                imageUrl: '../../assets/basic_img/loading.gif',
                imageSize: '64x64'
            });
        }
    }
}
// Ajax请求拦截
$(document).ajaxSend(function (event, jqXHR, ajaxOptions) {
    var userId = sessionStorage.getItem('user_id');
    if(!(userId || new RegExp('/login$', 'i').test(window.location.pathname))) {
        window.location.href = '/login';
        return;
    }
    if (ajaxOptions.url.indexOf('projectDataController/projectRate') === -1) {
        loading();
    }
    if (ajaxOptions.url && ajaxOptions.url.indexOf('projectDataController/createProject') > -1) {
        return false;
    }
    if (ajaxOptions.data && Object.prototype.toString.call(ajaxOptions.data) === '[object FormData]') {
        return false;
    }
    if (userId) {
        if (ajaxOptions.type === 'POST') {
            if (ajaxOptions.data && ajaxOptions.data.indexOf('userId') === -1) {
                if (ajaxOptions.data) {
                    ajaxOptions.data += '&userId=' + userId;
                } else {
                    ajaxOptions.data += 'userId=' + userId;
                }
            }
        } else if (ajaxOptions.type === 'GET') {
            if (ajaxOptions.url.indexOf('userId') === -1) {
                if (ajaxOptions.url.indexOf('?') === -1) {
                    ajaxOptions.url += '?userId=' + userId;
                } else {
                    ajaxOptions.url += '&userId=' + userId;
                }
            }
        } else if (ajaxOptions.type === 'DELETE') {
            if (ajaxOptions.data.indexOf('userId') === -1) {
                if (ajaxOptions.data) {
                    ajaxOptions.data += '&userId=' + userId;
                } else {
                    ajaxOptions.data += 'userId=' + userId;
                }
            }
        }
    }
});
$(document).ajaxStart(function () {
});
$(document).ajaxStop(function () {
    if (loadAlert) {
        loadAlert = false;
        setTimeout(function () {
            var count = 0;
            $('.sweet-alert .sa-icon').each(function () {
                if ($(this).css('display') === 'block') {
                    count++
                }
            });
            if (count === 1 && $('.sweet-alert .sa-icon.sa-custom').css('display') === 'block') {
                swal.close();
            }
        }, 500);
    }
});
$(document).ajaxComplete(function (event, XMLHttpRequest, ajaxOptions) {
    if (XMLHttpRequest.responseJSON && "success" in XMLHttpRequest.responseJSON && !XMLHttpRequest.responseJSON.success) {
        swal({
            title: '',
            text: XMLHttpRequest.responseJSON.msg || '网络请求错误',
            type: 'warning',
            confirmButtonText: '确定'
        });
    }
});
$(document).ajaxError(function (event, jqXHR, ajaxSettings, thrownError) {
    console.log(event, jqXHR, ajaxSettings, thrownError)
});

$(document).ready(function () {
    $(".footer").load("../views/footer.html");
    // 超时退出登录
    var now = new Date().getTime();
    function ifTimeout (time, now) {
        if ((new Date().getTime() - now) > time) {
            // 超时重新登录
            clearInterval(logOutTimer);
            swal({
                title: '登录超时',
                text: '登录超时，请重新登录！',
                type: 'warning'
            });
            sessionStorage.clear();
            window.location.href = '/login';
        }
    }
    function computerMove () {
        now = new Date().getTime();
    }
    $(document).mousemove(computerMove).keydown(computerMove);
    var logOutTimer = setInterval(function () {
        ifTimeout(15*60000, now);
    }, 30*60000);
});
// 公用方法，放到$().ready外面，怀疑其锁死了自己内部的作用域
// 更具url切换页面tab、便于重新登录时回到当前页面
// 输入查找的key，输出value （query模式)
function query (searchVal) {
    var value;
    window.location.search.split('?')[1].split('&').forEach(function (item, index, arr) {
        if (item.indexOf(searchVal) > -1) {
            value = arr[index].split('=')[1];
            arr = arr.concat(arr.splice(index, arr.length - index));
        }
    });
    return value;
}
// hash模式
function hash (searchVal) {
    var value;
    if (window.location.hash.split('#')[1]) {
        window.location.hash.split('#')[1].split('&').forEach(function (item, index, arr) {
            if (item.indexOf(searchVal) > -1) {
                value = arr[index].split('=')[1];
                arr = arr.concat(arr.splice(index, arr.length - index));
            } else {
                return null;
            }
        });
    } else {
        return null;
    }
    return value;
}
// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.Format = function (fmt) {
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
}
// 漏洞收藏&取消收藏
function bug_isfavorites (obj) {
    $.ajax({
        url: '/bug/setBugFavorite',
        type: 'POST',
        data: {
            bugId: obj.bugid,
            bugIsfavorites: obj.isFavorite
        },
        success: function (data) {
            if (obj.callback) {
                obj.callback();
            }
        }
    })
}
// 近期项目添加&删除
function project_isCheck (obj) {
    $.ajax({
        url: '/project/setNear',
        type: 'GET',
        data: {
            projectId: obj.proid,
            type: obj.type
        },
        sucess: function (data) {
            obj.callback && obj.callback();
        }
    })
}
// 一个函数接收对象或全是对象的数组，改变其的所有key的值。第二个参数可不传返回全小写字符
/*transformObjKey([{}, {}, {}], '_');*/
function transformObjKey (options, returnType) {
    if (Object.prototype.toString.call(options) === '[object Object]') {
        options = transformStr(options);
    }else if (Object.prototype.toString.call(options) === '[object Array]') {
        for (var i=0; i<options.length; i++) {
            options[i] = transformStr(options[i]);
        }
    } else {
        return;
    }
    return options;
    function transformStr (obj) {
        for (var key in obj) {
            var temp = transformCamelCase({
                value: key,
                returnType: returnType
            });
            obj[temp] = obj[key];
            if (temp !== key) {
                delete obj[key];
            }
        }
        return obj;
    }
}
// 输入驼峰式字符串返回下划线格式或全小写模式（支持数组）
/*transformCamelCase({
    value: {},
    returnType: '_',
});*/
function transformCamelCase (options) {
    if (typeof(options.value) === 'string') {
        if (!options.returnType) {
            options.value = options.value.toLowerCase();
        } else {
            options.value = options.value.replace(/[A-Z]/g, function (match, p1, offset, string) {
                return options.returnType + match.toLowerCase();
            });
        }
        return options.value;
    } else {
        return 'please make sure options.value is String';
    }
}

// 点击许可证
function moduleLicense (obj) {
    $.ajax({
        type: "GET",
        url: "/module/getLicenceMessage",
        data:{
            "licType": obj.licType
        },
        success: function(data){
            if ( data.data ) {
                $('#' + obj.modalId + ' .modal-header').html(obj.licType.toUpperCase() + "(" + data.data.licname + "通用公共许可证)");
                $('#' + obj.modalId + ' .modal-body').html("<p>" + data.data.licintro + "</p><a class='licenseHref' target='_blank' href='"+ data.data.licweb +"'>查看详情></a>");
            }
        }
    })
}
// 将url参数转化为对象
function getParams(url) {
    try {
        url = url.match(/\?([^#]+)/)[1];
        url = decodeURIComponent(url);
        var obj = {}, arr = url.split('&');
        for (var i = 0; i < arr.length; i++) {
            var subArr = arr[i].split('=');
            obj[subArr[0]] = subArr[1];
        }
        return obj;
    } catch (err) {
        return null;
    }
}

/**
 用来控制时间的方法。这世间的一切都离不开时间。若是能控制时间，就没有办不到的事
 Args:
 stamp: 输入的时间戳格式的字符串
 dateinfo: 目标的日期格式，可由y,m,d三个字母的任意排列组成,代表想要返回的日期的顺序,默认为'ymd'
 timeinfo: 目标的时间格式，可由h,m,s三个字母的任意排列组成,代表想要返回的时间顺序
 divider: 分割日期的分割符,默认为"."。时分秒的分隔符为内置的":"无法修改

 Returns:
 转换后的字符串，由日期和时间构成

 Usage:
 timeChrono(stamp,'ymd','hm')会返回由年,月,日,和时,分组成的字符串
 使用时需要大喊The World! 才能会有效，注意要把叹号也喊出来

 Raises:
 */
function timeChrono(stamp,dateinfo,timeinfo,divider){
    if (stamp == null || stamp == undefined || stamp == ''){
        return "";//返回--若传进来的时间戳为空
    }
    var numbers = stamp.match(/\d+/g).map(Number)
    var data = new Date(numbers[0],numbers[1],numbers[2],numbers[3],numbers[4],
        numbers[5],numbers[6],numbers[7]);

    if (!(data > 0)) {
        return "";
    }

    if (dateinfo == null || dateinfo == undefined){
        dateinfo = "ymd";
    }

    if (divider == null || divider == undefined){
        divider = ".";
    }

    var html = "";

    dateinfo.toLowerCase()
    for(var i=0;i<dateinfo.length;i++){
        switch(dateinfo[i]){
            case "y":
                html += data.getFullYear();
                break;
            case "m":
                html += data.getMonth()+1;
                break;
            case "d":
                html += data.getDate();
                break;
            default:
                break;
        }
        if (i < dateinfo.length - 1){
            html += divider;
        }
    }

    if (timeinfo != undefined && timeinfo != null){
        if (html != ''){
            html += " ";
        }
        dateinfo.toLowerCase()
        for(var j=0;j<timeinfo.length;j++){
            switch(timeinfo[j]){
                case "h":
                    html += data.getHours();
                    break;
                case "m":
                    html += data.getMinutes()+1;
                    break;
                case "s":
                    html += data.getSeconds();
                    break;
                default:
                    break;
            }
            if (j < timeinfo.length - 1){
                html += ":";
            }
        }
    }
    return html;
}

// 输入 "2019-04-14T16:00:00.000+0000" 输出时间戳
function utcToStamp (str) {
    if (!str) {
        return;
    }
    str = str.split('.')[0];
    return new Date(str).getTime();
}

/**
 能推断出存在与不存在的意义的方法。存在或是不存在一直是一个哲学上的难题。若能轻松定义与掌握存在，就没有办不到的事
 Args:
 data: 输入的数据
 symbol:想要替换的字符

 Returns:
 转换后的字符串

 Usage:
 convertNull(null)会返回一个空的字符串
 convertNull(null, '?')会返回"?"
 convertNull(object, '?')会把object里所有为null的值都转换为'?'

 Raises:
 */
function convertNull(data,symbol){
    if (symbol == null || symbol === undefined){
        symbol = '';
    }
    if (data === null || data === undefined){
        return symbol;
    }

    if (typeof data === 'object' && data) {
        try {
            for (var key in data){
                if (data[key] === null){
                    data[key] = symbol;
                }
            }
        } catch(e) {
            console.log('error：'+str+'!'+e);
        }
    }
    return data;
}

// 节流函数
function throttle (method, time, context) {
    clearTimeout(method.tId);
    method.tId = setTimeout(function () {
        // method.call(context);
        method();
    }, time);
}

var tableToExcel = (function () {
    var uri = 'data:application/vnd.ms-excel;base64,',
        template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head></head><body><table>{table}</table></body></html>',
        base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) },
        format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) };
    return function (table, name, filename) {
        if (!table.nodeType) table = document.getElementById(table)
        var ctx = { worksheet: name || 'Worksheet', table: table.innerHTML }

        document.getElementById("dlink").href = uri + base64(format(template, ctx));
        document.getElementById("dlink").download = filename;
        console.log(document.getElementById("dlink").href);
        document.getElementById("dlink").click();
    }
})();

// 查看漏洞级别 low => 低
function bugLevelTransform (value) {
    switch (value) {
        case 'high':
            return '高';
        case 'mid':
            return '中';
        case 'low':
            return '低';
        case 'other':
            return '其它'
    }
}

// 验证文件名已.zip\.rar结尾的
function isCompressFile (fileName) {
    var reg = new RegExp('.zip|.rar$');
    return reg.test(fileName);
}
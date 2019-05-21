$(function() {
    // 将url参数转化为对象
    var location_params = getParams(window.location.href);
    var mod_id = location_params.modID; // 组件id
    var user_file_name = null;
    var user_file_text = null;
    var serv_file_name = null;
    var serv_file_text = null;

    $.ajax({// 根据bugid从服务器获取bug数据
        type:'POST',
        url:'/file/tree',
        data:{moduleId: mod_id},
        success: function(data){
            $("#tree-root").empty();// 清空路径树下的元素
            var doc = generateDirectoryTree(data.data.content);
            $("#tree-root").append(doc);
            listEvent();
        }
    })

    // CodeMirror和文件对比部有待测试分暂时放在html文件中
    $('#testbtn').on('click', function(){
        //initUI();
        console.log("testing...");
    })

    // 点击路径树中的文件发送ajax请求获取文件信息并展示
    $("#tree-root").on("click",".file-box",function(){
        var url = $(this).attr("file-url");
        var id = $(this).attr("file-id");
        var name = $(this).find(".file-text").html();

        requestUserFile(url,name)
        .then(function(data){return requestServerFile(id)})
    })

    // 点击用户端下载按钮
    $("#downloadUserBtn").on("click", function(){
        if (user_file_name != null){
            downloadFile(user_file_name,user_file_text);
        }
    })

    // 点击服务端下载按钮
    $("#downloadServBtn").on("click", function(){
        if (serv_file_name != null){
            downloadFile(serv_file_name,serv_file_text);
        }
    })

    // 点击用户的可复制按钮
    $("#editUserBtn").on("click", function(){
        dv.edit.setOption("readOnly",true);
        $(".CodeMirror-merge-editor").addClass("can-copy");
    })

    // 点击服务端可复制按钮
    $("#editServBtn").on("click", function(){
        dv.right.orig.setOption("readOnly",true);
        $(".CodeMirror-merge-right").addClass("can-copy");
    })

    // 获取用户的文件内容
    function requestUserFile(url,name){
        $("#user_path").html(url);
        return new Promise(function(resolve,reject){
            $.ajax({
                type:'POST',
                url:'/file/userFile',
                data:{
                    moduleId: mod_id,
                    url: url,
                },
                success: function(data){
                    user_file_text = data.msg;
                    user_file_name = name;
                    $("#userFileName").html(name);
                    orig1 = value = data.msg;
                    resolve();
                },
            })  
        });
    }

    // 获取服务端的文件内容
    function requestServerFile(id){
        return new Promise(function(resolve,reject){
            $.ajax({
                type:'GET',
                url:'/file/rightFile',
                data:{fileId: id},
                success: function(data){
                    serv_file_text = data.msg;
                    orig2 = data.msg;
                    initUI();//展示对比的部分在html文件中
                    resolve();
                }
            })
        });
    }

    // 文件后缀名与实际图片文件的对照
    var filemap = {
        ".py": "python",".class": "java",".java": "java",".c": "c",".html": "html",".js": "javascript",".css": "css",".php": "php",".jar": "jar",".dll": "dll",".cpp": "c++",
    }

    // 文件夹的生成
    function generateFolder(name) {
        var folder = '<div class="folder-box clearfix"><div class="folder-arrow"></div><div class="folder-icon"></div><div class="folder-text">' + name + '</div></div>'
        return folder;
    }

    // 文件的生成
    function generateFile(name,url,id) {
        var pos = name.lastIndexOf('.');
        var bg = '';
        
        if (pos >= 0){// 找到文件后缀
            var suffix = filemap[name.substring(pos, name.length)]
            if(suffix != undefined){// 根据后缀改变图片
                bg = 'style="background-image:url(../../assets/icon/' + suffix + '-icon.png)"';
            }
        }
        
        var file = '<li><div class="file-box clearfix" file-id="'+id+'" file-url="'+url+'"><div class="file-arrow"></div><div class="file-icon" ' + bg + '></div><div class="file-text">' + name + '</div></div></li>';
        return file;
    }

    // 遍历json生成路径树
    function generateDirectoryTree(jsons) {
        if (jsons == "" || jsons == undefined) {
            return;
        }

        var html = "";
        for (var i in jsons) {
            if (jsons[i].type == "file"){
                html += generateFile(jsons[i].name,jsons[i].url,jsons[i].fileId);
            } 
            else if (jsons[i].type == "folder"){
                html += '<li>' + generateFolder(jsons[i].name) + '<ul>' + generateDirectoryTree(jsons[i].content) + '</ul></li>';
            }
            else if (jsons[i].content != undefined) {
                html += '<li>' + generateFolder(jsons[i].name) + '<ul>' + generateDirectoryTree(jsons[i].content) + '</ul></li>';
            }
            else {
                console.log("error: input json not recognized");
            }
        }

        return html;
    }

    // 一些点击路径树的事件
    function listEvent(){
        var allFolders = $(".directory-list li > ul");
        allFolders.each(function() {
            // add the folder class to the parent <li>
            var folderAndName = $(this).parent();
            folderAndName.addClass("folder");
            // backup this inner <ul>
            var backupOfThisFolder = $(this);
            // then delete it
            $(this).remove();
            // add an <a> tag to whats left ie. the folder name
            folderAndName.wrapInner("<a href='#' class='open'/>");
            // then put the inner <ul> back
            folderAndName.append(backupOfThisFolder);
            // now add a slideToggle to the <a> we just added
            folderAndName.find("a").click(function(e) {
                if ($(this).siblings("ul").is(":visible")){
                    $(this).removeClass("open");
                    $(this).siblings("ul").slideUp("fast");
                }
                else {
                    $(this).addClass("open");
                    $(this).siblings("ul").slideDown("fast");
                }
                e.preventDefault();
            });
        });
    }

    // 文件下载的函数
    function downloadFile(filename, text) {
        try{
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', filename);

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();
            document.body.removeChild(element);
        }
        catch(err){// 若上面的方法下载失败则用iframe下载。下面的方法不支持新的浏览器
            var ifd = document.getElementById('dummy').contentDocument;
            ifd.open('text/plain', 'replace');
            ifd.write(text);
            ifd.close();
            ifd.execCommand('SaveAs', true, filename);
        }
    }



})

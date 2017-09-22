/**
 * Created by jsonlu on 17/5/5.
 */
const util = require('util');
const axios = require('axios')
const build = require('./Build')
const config = require('./config.json')

axios.interceptors.request.use(function (config) {
    return config;
}, function (error) {
    console.log(error)
    return Promise.reject(error);
});
axios.interceptors.response.use(function (response) {
    return response;
    return Promise.reject(error);
});

const instance = axios.create({
    baseURL: 'https://oapi.dingtalk.com/robot/',
    timeout: 8000,
    headers: {'Content-Type': 'application/json; charset=utf-8'}
});
exports.puts = util.deprecate(function () {
    for (let i = 0, len = arguments.length; i < len; ++i) {
        process.stdout.write(arguments[i] + '\n');
    }
}, 'util.puts: Use console.log instead');


module.exports = {
    req: function (url, param, call) {
        console.log(url)
        instance.post(url, param)
            .then(function (response) {
                call(JSON.stringify(response.data));
            })
            .catch(function (err) {
                call(err);
            })
    },
    reqDingd: function (param) {
        console.log('请求:' + JSON.stringify(param))
        let data = '项目:' + param.project.name + '\n团队:' + param.project.namespace + '\n提交:' + param.user_name + '\n分支:' +
            param.ref.split("refs/heads/")[1] + '\n内容:'
        let commit = param.commits
        for (let l in commit) {
            let comm = commit[l]
            data += comm.message
            if (comm.modified.length > 0) {
                data += '\n[修改]:' + comm.modified
            }
            if (comm.added.length > 0) {
                data += '\n[增加]:' + comm.added
            }
            if (comm.removed.length > 0) {
                data += '\n[移除]:' + comm.removed
            }
            data += '\n详细:' + comm.url
        }
        let p = {msgtype: 'text', text: {content: data}}
        let groups = config.data.group
        let team = param.project.namespace
        let projects = groups[team]
        if (typeof(projects) == "undefined")
            return;
        for (let key in projects)
            this.req('send?access_token=' + projects[key], p, '')
    },
    build: function (req, res) {
        let groups = config.data.group
        let team = req.params.group
        let project = req.params.project
        let branch = req.params.branch
        let task = req.params.task
        let gits = config.data.git
        let git_project = gits[project]
        let projects = groups[team]
        let branchs = git_project.branch
        let ci_url, ci_logo

        if (task == '0') {
            ci_url = branchs[1].ci_url
            ci_logo = branchs[1].ci_logo
            task = 'gradle app:assembleComRelease && gradle app:upload1'
        } else {
            task = 'gradle app:assembleComDebug && gradle app:uploads'
            ci_url = branchs[0].ci_url
            ci_logo = branchs[0].ci_logo
        }


        if (typeof(git_project) == "undefined" || typeof(team) == "undefined" || typeof(branch) == "undefined") {
            res.end('没有找到项目' + project)
            return;
        }

        if (git_project.group != team) {
            res.end('没有找到团队' + team)
            return;
        }


        for (let index in branchs) {
            let data = branchs[index]
            if (branch == data.name) {
                branch = data
                break;
            }
            res.end('没有找到构建分支' + branch)
            return;
        }

        let that = this
        let url = git_project.url

        config.data.template = config.data.default
        let mk = config.data.template.markdown
        let date = new Date()
        let d = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + '-' + date.getHours() + ':' + date.getMinutes()
        let txt = mk.text
        mk.text = util.format(txt, project + '更新提示', ci_logo, d, ci_url);
        mk.title = project + '更新提示[' + branch.name + ']';
        build.build(project, url, branch, task, function (data) {
            if (data != 1) {
                console.log(data)
                res.end(data)
                return;
            }
            let tempalte = config.data.template
            tempalte.markdown = mk
            for (let key in projects)
                that.req('send?access_token=' + projects[key], tempalte, function (resData) {
                    console.log(resData)
                    res.end(resData)
                })
        })
    }

}

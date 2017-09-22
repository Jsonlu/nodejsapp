const shell = require('shelljs');


module.exports = {

    build: function (project, url, branch, task, call) {
        shell.cd('/tmp');
        if (!shell.which('git') || !shell.which('gradle')) {
            call('Sorry, this script requires git, gradle, java, android environment');
        } else {
            let that = this
            let name = branch.name
            if (shell.cd(project).code !== 0) {
                if (0 != shell.exec('git clone ' + url + ' && git checkout -b ' + name + ' origin/' + name).code) {
                    that.builds(task, call)
                }
                else
                    call('git clone 失败')
            } else {
                if (shell.exec('git fetch --all && git checkout ' + name).code == 0) {
                    that.builds(task, call)
                } else
                    call('git pull 失败')
            }
        }
    },
    builds: function (task, call) {
        if (shell.exec(task).code == 0) {
            call(1)
        } else
            call('gradle app:assemble构建失败')
    }
}

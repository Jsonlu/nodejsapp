/**
 * Created by jsonlu on 17/4/24.
 */
const express = require('express')
const bodyParser = require('body-parser')
const reqs = require('./Req')
const router = express.Router()
const app = module.exports = express()
app.use(bodyParser.json({limit: '1mb'}))
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use("/api", router);
router.use((req, res, next) => {
    console.log('进入中间件')
    next()
})

router.post('/dingding', (req, res, nex) => {
    reqs.reqDingd(req.body)
    res.end("yes")
})

router.get('/build/:group/:project/:branch/:task', (req, res, nex) => {
    console.log(req.params)
    reqs.build(req, res)
})

if (!module.parent) {
    app.listen(3000)
}

const path = require('path')
const url = require('url')
const request = require('request')
const fs = require('fs-extra')
const argv = require('yargs').argv
const jsonPretty = require('json-pretty')

/**
 * 获取游戏API: api_start2
 * 
 * @param {string} api_token
 * @param {string} ip
 * @param {string} proxy - 'http://127.0.0.1:8118'
 * @return {promise}
 */
const run = async (api_token = argv.token, ip = "203.104.209.23", proxy) => {
    console.log('  Fetching api_start2...')

    if (!api_token) {
        console.log('  └── No api_token found! Terminated.')
        return
    }


    await new Promise((resolve, reject) => {
        request({
            'uri': url.parse('http://' + ip + '/kcsapi/api_start2'),
            'method': 'POST',
            'headers': {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Pragma': 'no-cache',
                'Referer': 'http://' + ip + '/kcs/mainD2.swf?api_token=' + api_token + '&api_starttime=' + (new Date()).valueOf() + '/[[DYNAMIC]]/1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36',
                'X-Requested-With': 'ShockwaveFlash/17.0.0.169'
            },
            'formData': {
                'api_token': api_token,
                'api_verno': 1
            },
            'proxy': proxy
        }, (err, response, body) => {
            if (err || response.statusCode != 200) {
                // console.log(err, response)
                reject(new Error(err))
            }
            if (!err && response.statusCode == 200) {
                // console.log(body)
                let svdata
                eval(body)
                // console.log(svdata)
                if (svdata.api_result == 1) {
                    resolve(svdata)
                } else {
                    console.log(svdata)
                    reject(new Error(err))
                }
            }
        })
    })
        .then(svdata => {
            const dir = path.join(process.cwd(), 'fetched_data')
            fs.ensureDirSync(dir)
            fs.writeFileSync(
                path.join(dir, 'api_start2.json'),
                jsonPretty(svdata)
            )
            console.log('  └── Fetched api_start2 -> /game_data/api_start2.json')
            return svdata
        })
        .catch(err => console.log("  └── Fetched error:", err))

}

run(argv.token)
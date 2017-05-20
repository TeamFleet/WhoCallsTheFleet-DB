const fs = require('fs-extra')
const request = require('request')

module.exports = async (url, topath, proxy) => {
    let statusCode
    return await new Promise((resolve, reject) => {
        request({
            'uri': url,
            'method': 'GET',
            'proxy': proxy
        }).on('error', function (err) {
            reject(new Error(err))
        }).on('response', function (response) {
            statusCode = response.statusCode
        }).pipe(
            fs.createWriteStream(topath)
                .on('finish', function () {
                    if (statusCode != 200)
                        fs.unlinkSync(topath)
                    resolve()
                    // if (statusCode != 200 || data['api_name'] == 'なし') {
                    //     skipped = true
                    // }
                })
            )
    })
}
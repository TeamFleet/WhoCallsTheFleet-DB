const path = require('path')
const url = require('url')
const fs = require('fs-extra')
const jsonPretty = require('json-pretty')
const request = require('request')
const jpexs = require('jpexs-flash-decompiler')

const dirFetchedData = path.join(process.cwd(), 'fetched_data')

const { enemyIdStartFrom } = require('./libs/vars.js')
const getFile = require('./libs/get-file.js')

// http://203.104.209.23/kcs/resources/swf/ships/nehcyhpiviue.swf?VERSION=7

/*
fetched_data
`-- pics
    `-- ships
        +-- versions.json
        +-- raw
        `-- extract
*/

const run = async (proxy) => {
    const dirPicsShips = path.join(dirFetchedData, 'pics', 'ships')
    const dirPicsShipsRaw = path.join(dirPicsShips, 'raw')
    const dirPicsShipsExtract = path.join(dirPicsShips, 'extract')

    fs.ensureDirSync(dirPicsShips)
    fs.ensureDirSync(dirPicsShipsRaw)
    fs.ensureDirSync(dirPicsShipsExtract)

    const fileApiStart2 = path.join(dirFetchedData, 'api_start2.json')
    const filePicsVersions = path.join(dirPicsShips, 'pics_versions.json')

    let picsVersions

    console.log('  Fetching all ships\' illustrations...')

    if (!fs.existsSync(fileApiStart2)) {
        console.log('  └── api_start2 not fetched. Aborted.')
        return
    }
    if (fs.existsSync(filePicsVersions)) {
        console.log('  ├── Found pics_versions.json. Loaded.')
        picsVersions = fs.readJSONSync(filePicsVersions)
    } else {
        console.log('  ├── No pics_versions.json. First run.')
        picsVersions = {}
    }

    const start2 = fs.readJSONSync(fileApiStart2)
    const rawShips = start2.api_data.api_mst_ship
    const shipgraph = start2.api_data.api_mst_shipgraph
    let ships = {}
    let map = {}
    let needUpdate = []
    let picsVersionsNew = {}

    /* data examples

    ship: {
        "api_id": 1,
        "api_sortno": 31,
        "api_name": "睦月",
        "api_yomi": "むつき",
        "api_stype": 2,
        "api_ctype": 28,
        "api_afterlv": 20,
        "api_aftershipid": "254",
        "api_taik": [
          13,
          24
        ],
        "api_souk": [
          5,
          18
        ],
        "api_houg": [
          6,
          29
        ],
        "api_raig": [
          18,
          59
        ],
        "api_tyku": [
          7,
          29
        ],
        "api_luck": [
          12,
          49
        ],
        "api_soku": 10,
        "api_leng": 1,
        "api_slot_num": 2,
        "api_maxeq": [
          0,
          0,
          0,
          0,
          0
        ],
        "api_buildtime": 18,
        "api_broken": [
          1,
          1,
          4,
          0
        ],
        "api_powup": [
          1,
          1,
          0,
          0
        ],
        "api_backs": 3,
        "api_getmes": "睦月です。<br>はりきって、まいりましょー！",
        "api_afterfuel": 100,
        "api_afterbull": 100,
        "api_fuel_max": 15,
        "api_bull_max": 15,
        "api_voicef": 0
    }

    shipgraph: {
        "api_id": 1,
        "api_sortno": 31,
        "api_filename": "snohitatusbk",
        "api_version": [
          "21",
          "19",
          "1"
        ],
        "api_boko_n": [
          125,
          24
        ],
        "api_boko_d": [
          83,
          25
        ],
        "api_kaisyu_n": [
          28,
          7
        ],
        "api_kaisyu_d": [
          28,
          7
        ],
        "api_kaizo_n": [
          70,
          -31
        ],
        "api_kaizo_d": [
          29,
          -32
        ],
        "api_map_n": [
          29,
          24
        ],
        "api_map_d": [
          -13,
          15
        ],
        "api_ensyuf_n": [
          129,
          18
        ],
        "api_ensyuf_d": [
          -3,
          -32
        ],
        "api_ensyue_n": [
          129,
          0
        ],
        "api_battle_n": [
          73,
          27
        ],
        "api_battle_d": [
          29,
          21
        ],
        "api_weda": [
          112,
          108
        ],
        "api_wedb": [
          145,
          153
        ]
    }
     */

    for (let i in rawShips) {
        if (typeof rawShips[i].api_name !== 'なし') {
            ships[rawShips[i].api_id] = rawShips[i]
            map[rawShips[i].api_id] = null
        }
    }
    for (let i in shipgraph) {
        const o = shipgraph[i]
        const id = o.api_id
        if (typeof map[id] !== 'undefined') {
            map[id] = o.api_filename

            let curPicVersion
            if (Array.isArray(o.api_version)) {
                // curPicVersion = o.api_version
                //     .map(value => parseInt(value))
                //     .reduce((accumulator, currentValue) => accumulator + currentValue)
                curPicVersion = parseInt(o.api_version[0])
            } else
                curPicVersion = parseInt(o.api_version)

            if (curPicVersion !== picsVersions[id])
                needUpdate.push(id)

            // 更新图片版本
            picsVersionsNew[id] = curPicVersion
        }
    }


    console.log('  ├── Data parsed. Start fetching SWF files...')
    for (let id of needUpdate) {
        await new Promise(async (resolve, reject) => {
            const name = ships[id].api_name + (id >= enemyIdStartFrom && ships[id].api_yomi !== '-' ? (ships[id].api_yomi || '') : '')
            const pathFile = path.join(dirPicsShipsRaw, `[${id}] ${name}.swf`)

            let isDownloadSuccess = true

            console.log(`  │       Fetching ${map[id]}.swf for ship [${id}] ${name}`)

            await getFile(
                url.parse(`http://203.104.209.23/kcs/resources/swf/ships/${map[id]}.swf?VERSION=${picsVersions[id]}`),
                pathFile,
                proxy
            )
                .catch(err => {
                    isDownloadSuccess = false
                    console.log("  │       Fetched error: ", err)
                })

            if (!isDownloadSuccess) {
                console.log(`  │           Go next...`)
            } else {
                console.log(`  │           Fetched.`)

                console.log(`  │           Decompiling swf for ship #${id}...`)
                const dirPicsShipsExtractShip = path.join(dirPicsShipsExtract, '' + id)
                fs.ensureDirSync(dirPicsShipsExtractShip)
                await new Promise(async (resolve, reject) => {
                    jpexs.export({
                        file: pathFile,
                        output: dirPicsShipsExtractShip,
                        items: [jpexs.ITEM.IMAGE],
                        format: [jpexs.FORMAT.IMAGE.PNG]
                    }, function (err) {
                        if (err) {
                            console.log('Error: ', err.message)
                            // resolve()
                            reject(err)
                        } else {
                            resolve()
                        }
                    });
                })
                console.log(`  │           Decompiled -> /fetched_data/pics/ships/extract/${id}`)

                fs.readdirSync(dirPicsShipsExtractShip).forEach(file => {
                    const parsed = path.parse(file)
                    const new_name = '_' + Math.floor(parseInt(parsed['name']) / 2) + parsed['ext'].toLowerCase()
                    fs.renameSync(
                        path.join(dirPicsShipsExtractShip, file),
                        path.join(dirPicsShipsExtractShip, new_name)
                    )
                })
                fs.readdirSync(dirPicsShipsExtractShip).forEach(file => {
                    const parsed = path.parse(file)
                    const new_name = parsed['name'].substr(1) + parsed['ext'].toLowerCase()
                    fs.renameSync(
                        path.join(dirPicsShipsExtractShip, file),
                        path.join(dirPicsShipsExtractShip, new_name)
                    )
                })
                console.log(`  │           Renamed.`)

                picsVersions[id] = picsVersionsNew[id]
                fs.writeFileSync(
                    filePicsVersions,
                    jsonPretty(picsVersions)
                )
                console.log(`  │           Updated pic version for ship #${id} -> /fetched_data/pics/ships/versions.json`)
            }

            resolve()
        })
    }

    // fs.writeFileSync(
    //     filePicsVersions,
    //     jsonPretty(picsVersions)
    // )
    // console.log('  └── Updated pics versions -> /parsed/pics_versions.json')
    console.log('  └── Finished.')

}

run()
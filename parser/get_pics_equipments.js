const path = require('path')
const url = require('url')
const fs = require('fs-extra')

const dirFetchedData = path.join(process.cwd(), 'fetched_data')

const { enemyEquipmentIdStartFrom } = require('./libs/vars.js')
const getFile = require('./libs/get-file.js')

/*
 * CARD     http://203.104.209.23/kcs/resources/image/slotitem/card/211.png
 * SPRITE   http://203.104.209.23/kcs/resources/image/slotitem/item_character/211.png
 * FULL     http://203.104.209.23/kcs/resources/image/slotitem/item_on/211.png
 * ITEM     http://203.104.209.23/kcs/resources/image/slotitem/item_up/211.png
 * TITLE    http://203.104.209.23/kcs/resources/image/slotitem/statustop_item/211.png
 */

/*
fetched_data
`-- pics
    `-- equipments
        +-- 1
            +-- card.png
            +-- item_character.png
            +-- item_on.png
            +-- item_up.png
            `-- statustop_item.png
        +-- 2
        `-- ...id
*/


const run = async (proxy) => {
    const dirPicsEquipments = path.join(dirFetchedData, 'pics', 'equipments')
    fs.ensureDirSync(dirPicsEquipments)

    const fileApiStart2 = path.join(dirFetchedData, 'api_start2.json')
    console.log('  Fetching all equipments\' illustrations...')

    if (!fs.existsSync(fileApiStart2)) {
        console.log('  └── api_start2 not fetched. Aborted.')
        return
    }

    const start2 = fs.readJSONSync(fileApiStart2)
    const slotitem = start2.api_data.api_mst_slotitem

    const pics = [
        'card',
        'item_character',
        'item_on',
        'item_up',
        'statustop_item'
    ]

    for (let obj of slotitem) {
        const id = parseInt(obj.api_id)
        if (id >= enemyEquipmentIdStartFrom) continue

        const name = obj.api_name
        const dir = path.join(dirPicsEquipments, '' + id)

        if (fs.existsSync(dir)) {
            console.log(`  │       EXIST [${id}] ${name}`)
            continue
        }

        fs.ensureDirSync(dir)
        await new Promise(async (resolve, reject) => {
            console.log(`  │       Fetching images for equipment [${id}] ${name}`)
            
            if (id < 10) theId = '00' + id
            else if (id < 100) theId = '0' + id
            else theId = id

            for (let type of pics) {
                await getFile(
                    url.parse(`http://203.104.209.23/kcs/resources/image/slotitem/${type}/${theId}.png`),
                    path.join(dir, `${type}.png`),
                    proxy
                )
                    .catch(err => console.log("  │       Fetched error:", err))
                console.log(`  │           ${id}/${type}.png`)
            }

            resolve()
        })
    }

    console.log('  └── Finished.')

}

run()
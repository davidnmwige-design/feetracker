#!/usr/bin/env node
/**
 * Generates a sample students CSV with realistic Kenyan names and parent emails.
 * Usage: node scripts/generate-sample-csv.js [count] [output]
 *   count  - number of students to generate (default: 50)
 *   output - output file path (default: public/sample-students-generated.csv)
 *
 * Example: node scripts/generate-sample-csv.js 200 public/students-200.csv
 */

const fs = require('fs')
const path = require('path')

const FIRST_NAMES = [
  'Brian','Aisha','Daniel','Grace','Kevin','Fatuma','Samuel','Lydia','Michael','Sharon',
  'Patrick','Esther','Collins','Faith','Dennis','Mercy','Victor','Jackline','Calvin','Irene',
  'Allan','Brenda','Charles','Diana','Edwin','Florence','George','Harriet','Ivan','Janet',
  'Kenneth','Lilian','Martin','Nancy','Oliver','Pauline','Quincy','Rebecca','Simon','Tabitha',
  'Ugo','Vivian','Walter','Ximena','Yusuf','Zipporah','Ahmed','Beatrice','Cedric','Dorcas',
  'Emmanuel','Felicia','Gideon','Hilda','Isaiah','Josephine','Kelvin','Lavinia','Moses','Naomi',
  'Oscar','Priscilla','Rashid','Stella','Timothy','Ursulla','Veronicah','Wilfred','Yvonne','Zachary',
]

const LAST_NAMES = [
  'Kamau','Mwangi','Otieno','Njeri','Ochieng','Hassan','Waweru','Chebet','Odhiambo','Wambua',
  'Gitau','Mutua','Njoroge','Achieng','Kariuki','Kinyua','Ngugi','Mugo','Kipchoge','Moraa',
  'Kimani','Owino','Njenga','Korir','Wekesa','Mbugua','Nyambura','Ogola','Muthoni','Odour',
  'Kirui','Auma','Nyamweya','Ombati','Muhia','Nekesa','Chege','Akello','Ndirangu','Olaka',
  'Maina','Juma','Warui','Okello','Keter','Awuor','Mwenda','Oguta','Kiprotich','Wanjiru',
]

const PARENT_FIRST_NAMES = [
  'Mary','James','Grace','John','Peter','Hassan','Margaret','David','Rose','Stephen',
  'Ann','Joseph','Susan','George','Catherine','Paul','Hannah','Robert','Alice','Francis',
  'Elizabeth','Michael','Ruth','Philip','Beatrice','Thomas','Agnes','Wilson','Esther','Richard',
  'Judith','Samuel','Lydia','Daniel','Sarah','Moses','Eunice','Isaac','Naomi','Abraham',
]

const DOMAINS = ['gmail.com','gmail.com','gmail.com','yahoo.com','yahoo.com','outlook.com']

const CLASSES = ['Form 1','Form 2','Form 3','Form 4']
const STREAMS = ['North','South','East','West']
const FEES = { 'Form 1': 42000, 'Form 2': 45000, 'Form 3': 52000, 'Form 4': 58000 }

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function makeEmail(firstName, lastName) {
  const domain = pick(DOMAINS)
  const variants = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random()*99)+1}@${domain}`,
  ]
  return pick(variants)
}

function formatPhone() {
  const prefixes = ['0722','0733','0711','0712','0723','0745','0756','0768','0790','0799']
  return pick(prefixes) + String(Math.floor(Math.random() * 900000) + 100000)
}

const count = parseInt(process.argv[2]) || 50
const outputFile = process.argv[3] || path.join(__dirname, '../public/sample-students-generated.csv')
const schoolPrefix = process.argv[4] || 'WA'

const header = 'Name,Adm No,Class,Stream,Fee Required,Parent Name,Parent Phone,Parent Email'
const rows = [header]

const usedAdmNos = new Set()

for (let i = 0; i < count; i++) {
  const firstName = pick(FIRST_NAMES)
  const lastName = pick(LAST_NAMES)
  const name = `${firstName} ${lastName}`

  let admNo
  do {
    admNo = `${schoolPrefix}/${String(i + 1).padStart(3, '0')}`
  } while (usedAdmNos.has(admNo))
  usedAdmNos.add(admNo)

  const cls = pick(CLASSES)
  const stream = pick(STREAMS)
  const feeRequired = FEES[cls]

  const parentFirst = pick(PARENT_FIRST_NAMES)
  const parentLast = lastName
  const parentName = `${parentFirst} ${parentLast}`
  const parentPhone = formatPhone()
  const parentEmail = makeEmail(parentFirst, parentLast)

  rows.push(`${name},${admNo},${cls},${stream},${feeRequired},${parentName},${parentPhone},${parentEmail}`)
}

fs.writeFileSync(outputFile, rows.join('\n'), 'utf8')
console.log(`Generated ${count} students → ${outputFile}`)

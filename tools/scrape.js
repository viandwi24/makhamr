const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')

const scrape = async (offset = 0) => {
	const base_url = 'https://api.kampusmerdeka.kemdikbud.go.id/magang/browse/position'
	const full_url = `${base_url}?offset=${offset}&limit=1874`
	const response = await axios({
		method: 'GET',
		url: full_url,
	})
	return response.data?.data || []
}

const full_scrape = async (total) => {
	const datas = []
	const limit_per_chunk = 1874
	const total_chunk = Math.ceil(total / limit_per_chunk)
	for (let i = 0; i < total_chunk; i++) {
		const res = await scrape(i * limit_per_chunk)
		datas.push(...res)
    console.log(`Chunk ${i + 1} of ${total_chunk} done with ${res.length} datas`)
	}
  console.log(`Scraping done with ${datas.length} datas`)
	return datas
}

const main = async () => {
	const datas = await full_scrape(1914)
	const json = JSON.stringify(datas, null, 2)
  const date = dayjs().format('DD-MM-YYYY HH:mm')
	const file_path = path.join(__dirname, `/../public/data/${date}.json`)

  //
  if (fs.existsSync(file_path)) {
    fs.unlinkSync(file_path)
  }
	fs.writeFileSync(file_path, json, 'utf8')


  // edit /public/data/all.json
  const all_file_path = path.join(__dirname, '/../public/data/all.json')
  const all_file = fs.readFileSync(all_file_path, 'utf8')
  const all_json = JSON.parse(all_file)
  all_json.push(date)
  fs.writeFileSync(all_file_path, JSON.stringify(all_json, null, 2), 'utf8')
}
main()

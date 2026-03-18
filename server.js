import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// Proxy Yahoo Finance API
app.get('/api/yahoo/*path', async (req, res) => {
  const path = req.params.path
  const query = new URLSearchParams(req.query).toString()
  const url = `https://query2.finance.yahoo.com/${path}${query ? '?' + query : ''}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    const data = await response.text()
    res.set('Content-Type', response.headers.get('content-type') || 'application/json')
    res.status(response.status).send(data)
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch from Yahoo Finance' })
  }
})

// Serve static build
app.use(express.static(join(__dirname, 'dist')))
app.get('*path', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

const { requireAuth } = require('./_auth')

exports.handler = async (event) => {
  const auth = await requireAuth(event)
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: auth.headers,
      body: JSON.stringify({ error: 'OpenAI API key not configured on server' })
    }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' }
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: body.messages,
      max_tokens: body.max_tokens ?? 800
    })
  })

  const data = await res.json()
  return {
    statusCode: res.status,
    headers: auth.headers,
    body: JSON.stringify(data)
  }
}

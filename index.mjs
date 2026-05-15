import { config } from 'dotenv'
import { streamText } from 'ai'

config({ path: '.env.local', quiet: true })

if (!process.env.AI_GATEWAY_API_KEY && process.env.VERCEL_AI_GATEWAY_API_KEY) {
  process.env.AI_GATEWAY_API_KEY = process.env.VERCEL_AI_GATEWAY_API_KEY
}

const models = {
  productionDefault: 'openai/gpt-4o-mini',
  fastEconomy: 'mistral/mistral-small',
  cheapLongContext: 'mistral/ministral-8b',
  generalLongContext: 'meta/llama-3.3-70b',
  siteLogic: 'openai/gpt-4o-mini',
  siteDesignClaude: 'anthropic/claude-3.5-haiku',
  visualValue: 'mistral/pixtral-12b',
  visualPremium: 'mistral/pixtral-large',
  codeAndScripts: 'mistral/codestral',
  safety: 'openai/gpt-oss-safeguard-20b',
  embeddings: 'openai/text-embedding-3-small',
  paidQuality: 'openai/gpt-4o',
  paidReasoning: 'openai/o1',
  paidDeepResearch: 'openai/o3-deep-research',
  paidOpus: 'anthropic/claude-opus-4.5',
  paidPro: 'openai/gpt-5-pro',
}

const hasGatewayAuth = Boolean(
  process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN,
)

if (!hasGatewayAuth) {
  console.error('Missing AI Gateway auth.')
  console.error('Use AI_GATEWAY_API_KEY=*** or run: vc env pull .env.local')
  process.exit(1)
}

const model = process.env.AI_GATEWAY_MODEL || models.productionDefault

console.log(`Pixelrises AI Gateway quick smoke: ${model}`)

const result = streamText({
  model,
  prompt:
    'Explique en deux phrases simples pourquoi Pixelrises V2 utilise AI Gateway pour router plusieurs IA tout en controlant les couts.',
  providerOptions: {
    gateway: {
      tags: ['project:pixelrises-v2', 'feature:gateway-quick-smoke', 'env:local'],
      user: 'pixelrises-local-smoke-test',
    },
  },
})

for await (const chunk of result.textStream) {
  process.stdout.write(chunk)
}

console.log('\n\nUsage:')
console.log(JSON.stringify(await result.totalUsage, null, 2))

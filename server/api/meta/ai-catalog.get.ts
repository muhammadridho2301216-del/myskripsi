import { logicalModels, providerCatalog } from '../../utils/ai/catalog'
import { modelPrices, searchPrices } from '../../utils/ai/pricing'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=300')
  return {
    providers: providerCatalog,
    logicalModels,
    pricing: {
      warning: 'Snapshot untuk estimasi internal; bukan jaminan tarif provider.',
      models: modelPrices,
      search: searchPrices,
    },
  }
})
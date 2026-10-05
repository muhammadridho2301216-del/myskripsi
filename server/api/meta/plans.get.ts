import { plans } from '../../utils/billing/plans'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=300')
  return {
    warning: 'Harga dan quota Student/Builder masih berupa hipotesis eksperimen.',
    plans,
  }
})
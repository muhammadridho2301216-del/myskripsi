import { outlineTemplates } from '../../utils/outline/engine'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return { templates: outlineTemplates }
})
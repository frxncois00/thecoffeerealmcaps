import { useContext } from 'react'
import { RenderContext } from './performance'
import { responsiveImage } from './responsiveImage'

export default function TourImage({ as: Tag = 'img', src, sizes, loading = 'lazy', ...props }) {
  const { tier } = useContext(RenderContext)
  return <Tag {...props} {...responsiveImage(src, tier, sizes)} loading={loading} decoding="async" />
}

import { completedPassportOrders, passportDate, PASSPORT_ASSETS, PASSPORT_REWARDS, rewardProgress } from './realmPassport.js'

const fieldText = (value, fallback) => typeof value === 'string' && value.trim() ? value.trim() : fallback

// This adapter prepares display values only. Order eligibility, ordering, reward
// artwork, and progress always come from the existing passport utility.
export function buildPassportPresentation({ profile, id, orders = [], benefit, loading = false } = {}) {
  const purchases = completedPassportOrders(orders)
  const username = fieldText(profile?.username, 'Member').replace(/^@/, '') || 'Member'
  const identity = {
    username,
    photoUrl: fieldText(profile?.avatar_url, null),
    id: id || (loading ? 'Issuing…' : 'Unavailable'),
    birthDate: passportDate(profile?.birthdate),
    memberSince: passportDate(profile?.created_at, { month: 'short', year: 'numeric' }),
    favoriteDrink: fieldText(profile?.favorite_drink, 'Not set'),
    favoriteFood: fieldText(profile?.favorite_food, 'Not set'),
    verification: benefit?.status === 'approved' ? {
      kind: benefit.kind === 'senior' ? 'senior' : 'pwd',
      label: benefit.kind === 'senior' ? 'Senior verified' : 'PWD verified',
    } : null,
    loading,
  }

  const chapters = PASSPORT_REWARDS.map(([title, filename], index) => {
    const number = index + 1
    const progress = rewardProgress(loading ? 0 : purchases.length, number)
    const slots = Array.from({ length: 5 }, (_, slotIndex) => {
      const purchaseNumber = index * 5 + slotIndex + 1
      const order = loading ? null : purchases[purchaseNumber - 1]
      const position = slotIndex + 1
      const date = order ? passportDate(order.created_at) : null
      const orderNumber = order ? String(order.order_number || order.reference_code || order.order_id || order.id) : null
      return {
        key: order ? String(order.id) : `empty-${number}-${position}`,
        orderId: order?.id ?? null,
        orderNumber,
        date,
        position,
        purchaseNumber,
        earned: Boolean(order),
        label: order
          ? `Stamp ${position} of 5, earned, order ${orderNumber}, order placed ${date}`
          : `Stamp ${position} of 5, ${loading ? 'loading' : 'empty'}`,
      }
    })
    return {
      number,
      title,
      artwork: PASSPORT_ASSETS + filename,
      milestone: number * 5,
      progress,
      status: progress === 5 ? 'unlocked' : progress > 0 ? 'in-progress' : 'locked',
      slots,
      remaining: 5 - progress,
      loading,
    }
  })

  const nextChapter = chapters.find(chapter => chapter.status !== 'unlocked')
  const bookCapacity = chapters.at(-1)?.milestone || 0
  const summary = {
    totalPurchases: loading ? null : purchases.length,
    rewardsEarned: loading ? null : chapters.filter(chapter => chapter.status === 'unlocked').length,
    nextReward: loading || !nextChapter ? null : {
      number: nextChapter.number,
      title: nextChapter.title,
      artwork: nextChapter.artwork,
      milestone: nextChapter.milestone,
      progress: nextChapter.progress,
      remaining: nextChapter.remaining,
    },
    remaining: loading ? null : nextChapter?.remaining ?? 0,
    complete: !loading && !nextChapter,
    extraPurchases: loading ? null : Math.max(0, purchases.length - bookCapacity),
    loading,
  }

  const pages = [
    { kind: 'identity', title: 'Member details' },
    ...chapters.map((chapter, chapterIndex) => ({ kind: 'stamps', title: chapter.title, chapterIndex })),
    { kind: 'summary', title: 'Summary' },
  ]

  return { identity, chapters, summary, pages }
}

export function calculateSubtotal(items: { product: { price: number }; quantity: number }[]) {
    return items.reduce((s, it) => s + (it.product?.price ?? 0) * (it.quantity ?? 0), 0)
}

export function calculateShipping(subtotal: number, totalItems: number) {
    if (subtotal === 0) return 0
    if (subtotal > 1000000) return 0
    const base = 10000
    return base + Math.max(0, totalItems - 1) * 5000
}

export function calculateTotal(subtotal: number, shipping: number, taxRate = 0.11) {
    const tax = subtotal * taxRate
    return { total: subtotal + shipping + tax, tax }
}
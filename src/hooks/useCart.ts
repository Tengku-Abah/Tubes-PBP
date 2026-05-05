import { useEffect, useRef, useState, useCallback} from 'react';

export interface CartProduct{
    id: number;
    name: string;
    price: number;
    description: string;
    image: string;
    category: string;
    stock: number;
    rating: number;
    reviews: number;
}

export interface CartItem{
    id: number;
    product: CartProduct;
    quantity: number;
}

function calculateShipping(totalItem:number, subtotal: number) {
    if (subtotal>1000000) {
        return 0
    }
    else{
        const baseShip = 10000
        if (totalItem>0) {
            return baseShip + (totalItem-1)*5000
        }
        return baseShip
    }
}

export default function useCart(){
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const mountedRef = useRef(true)

    const fetchCart = useCallback(async () => {
        if (!mountedRef.current) return
        setLoading(true)
        setError(null)
        try {
            const raw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
            // const user = raw ? JSON.parse(raw) : null
            let user = null
            if (raw) {
                try{user = JSON.parse(raw)} catch { user = null}
            }
            const userId = user?.id ?? null

            const url = userId ? `/api/cart?user_id=${encodeURIComponent(userId)}` : '/api/cart'
            const res = await fetch(url)
            if(!res.ok) throw new Error('Failed to fetch cart')
            const data = await res.json()

            const items: CartItem[] = data?.data ?? data?.items ?? []
            // setCartItems(items)
            if(mountedRef.current) setCartItems(items)
            
        } catch (err: any) {
            console.error('useCart fetch error', err)
            if (mountedRef.current) {
                setError(err?.message ?? 'Unknown error')
                setCartItems([])
            }
        } finally{
            if(mountedRef.current) setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCart()
        return () => { mountedRef.current = false }
    }, [fetchCart])

    const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0)
    const totalItem = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    const shipping = calculateShipping(totalItem, subtotal)
    const total = subtotal + shipping

    return { cartItems, loading, error, subtotal, totalItem, shipping, total, refresh: fetchCart }
}
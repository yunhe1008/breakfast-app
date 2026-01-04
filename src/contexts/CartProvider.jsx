import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import CartContext from './cartContext';
import * as api from '../services/api'; // 1. 引入我們的 API 服務

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // 全域載入狀態
  const [error, setError] = useState(null);

  const { user, isLoaded: isUserLoaded } = useUser(); // 2. 取得 Clerk 的使用者物件
  const userId = user?.id;

  // 3. 當使用者狀態載入完成或使用者 ID 改變時，從後端獲取購物車
  useEffect(() => {
    if (!isUserLoaded) return; // 等待 Clerk 初始化完成

    if (!userId) {
      // 如果使用者登出，清空購物車
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    const loadCart = async () => {
      setIsLoading(true);
      try {
        const items = await api.fetchCart(userId);
        setCartItems(items);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [userId, isUserLoaded]);

  // 重新獲取購物車的輔助函式
  const refreshCart = useCallback(async () => {
    if (!userId) return;
    try {
      const items = await api.fetchCart(userId);
      setCartItems(items);
    } catch (err) {
      console.error("刷新購物車失敗:", err);
    }
  }, [userId]);

  // 4. 改造 addToCart 為 async 函式
  const addToCart = useCallback(async (menuItem) => {
    if (!userId) throw new Error("請先登入");

    try {
      const existingItem = await api.findCartItemByMenuId(menuItem.id, userId);

      if (existingItem) {
        // 如果已存在，更新數量 (PATCH)
        await api.updateCartItem(existingItem.id, {
          quantity: existingItem.quantity + 1
        });
      } else {
        // 如果不存在，新增一筆 (POST)
        await api.addCartItem({
          ...menuItem,
          menuItemId: menuItem.id, // 確保有關聯 ID
          id: undefined, // 讓 json-server 自動產生 id
          userId: userId,
          quantity: 1,
        });
      }
      await refreshCart(); // 操作成功後，重新獲取整個購物車以同步狀態
    } catch (err) {
      setError(err.message);
      throw err; // 將錯誤向上拋出，讓 UI 層可以捕捉到
    }
  }, [userId, refreshCart]);

  // 5. 改造 updateQuantity 和 removeFromCart
  const removeFromCart = useCallback(async (itemId) => {
    await api.removeCartItem(itemId);
    await refreshCart();
  }, [refreshCart]);

  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    const quantity = Math.max(0, newQuantity);
    if (quantity === 0) {
      await removeFromCart(itemId);
    } else {
      await api.updateCartItem(itemId, { quantity });
      await refreshCart();
    }
  }, [refreshCart, removeFromCart]);

  // ✅ 新增：清空購物車函式
  const clearCart = useCallback(async () => {
    if (!userId) return;
    try {
      const userCartItems = await api.fetchCart(userId);
      for (const item of userCartItems) {
        await api.removeCartItem(item.id);
      }
      await refreshCart();
    } catch (err) {
      console.error("清空購物車失敗:", err);
      setError(err.message);
    }
  }, [userId, refreshCart]);

  // ✅ 新增：結帳函式
  const checkout = useCallback(async () => {
    if (!userId || cartItems.length === 0) {
      throw new Error("購物車是空的或使用者未登入");
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderPayload = {
      userId,
      items: cartItems.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await api.createOrder(orderPayload);
      await clearCart();
    } catch (err) {
      console.error("結帳失敗:", err);
      setError(err.message);
      throw err;
    }
  }, [userId, cartItems, clearCart]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const value = useMemo(() => ({
    cartItems,
    cartCount,
    totalAmount,
    isLoading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,   // ✅ 提供出去
    checkout,    // ✅ 提供出去
  }), [
    cartItems,
    cartCount,
    totalAmount,
    isLoading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkout,
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

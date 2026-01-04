// src/pages/Menu.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useMenu from '../hooks/useMenu';
import { formatCurrency } from '../utils/helpers';
import { useUser } from '@clerk/clerk-react';
import useCart from '../hooks/useCart';

const Menu = () => {
  const navigate = useNavigate();
  const { menuItems, isLoading, error } = useMenu();
  const { isSignedIn } = useUser();
  const { addToCart } = useCart();

  const [isAddingId, setIsAddingId] = useState(null); // 正在加入的商品 id
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message: string }
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showFeedback = (payload) => {
    setFeedback(payload);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddToCart = async (item) => {
    if (!isSignedIn) {
      navigate('/login');
      return;
    }

    // 防止同一個商品被狂點（或你也可以改成鎖全部：if (isAddingId !== null) return;）
    if (isAddingId === item.id) return;

    setIsAddingId(item.id);
    setFeedback(null);

    try {
      // 若 addToCart 是同步也沒關係；若是 async 也能正常 await
      await Promise.resolve(addToCart(item));
      showFeedback({ type: 'success', message: `${item.name} 已加入購物車！` });
    } catch (err) {
      showFeedback({ type: 'error', message: err?.message || '加入失敗，請稍後再試' });
    } finally {
      setIsAddingId(null);
    }
  };

  // 載入中
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // 錯誤處理
  if (error) {
    return (
      <div className="alert alert-error">
        <span>載入菜單失敗，請稍後再試。</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 提示訊息 */}
      {feedback && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <span>{feedback.message}</span>
        </div>
      )}

      <h1 className="text-3xl font-bold text-center">🍽 美味菜單</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {menuItems.map((item) => (
          <div key={item.id} className="card bg-base-100 shadow-xl">
            <figure>
              <img
                src={item.image}
                alt={item.name}
                className="h-48 w-full object-cover"
              />
            </figure>

            <div className="card-body">
              <h2 className="card-title">{item.name}</h2>
              <p className="text-gray-500">{item.description}</p>
              <p className="font-bold text-lg">{formatCurrency(item.price)}</p>

              <div className="card-actions justify-end">
                <button
                  className={`btn ${isSignedIn ? 'btn-primary' : 'btn-outline btn-primary'}`}
                  onClick={() => handleAddToCart(item)}
                  disabled={isAddingId === item.id}
                >
                  {isAddingId === item.id ? (
                    <span className="loading loading-spinner"></span>
                  ) : isSignedIn ? (
                    '加入購物車'
                  ) : (
                    '請先登入'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;

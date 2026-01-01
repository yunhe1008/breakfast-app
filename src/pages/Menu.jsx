// src/pages/Menu.jsx
import React from 'react';
import useMenu from '../hooks/useMenu';
import { formatCurrency } from '../utils/helpers';

const Menu = () => {
  // 一行程式碼，搞定資料獲取的所有複雜邏輯！
  const { menuItems, isLoading, error } = useMenu();

  // 處理載入中的情況
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // 處理發生錯誤的情況
  if (error) {
    return (
      <div className="alert alert-error shadow-lg">
        <span>載入菜單資料時發生錯誤：{error}</span>
      </div>
    );
  }

  // 成功獲取資料，渲染菜單列表
  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-3xl font-bold mb-6">美味菜單</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div key={item.id} className="card bg-base-100 shadow-xl">
              <figure>
                <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
              </figure>
              <div className="card-body">
                <h2 className="card-title">{item.name}</h2>
                <p>{item.description}</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(item.price)}
                </p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary">
                    加入購物車
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Menu;